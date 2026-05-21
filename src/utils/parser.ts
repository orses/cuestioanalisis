import Papa from 'papaparse';
import JSZip from 'jszip';
import type { Pregunta, ConceptoAdyacente, DatasetAnalisis, CuestionarioMeta, MetadatosEjercicio } from '../types';
import { obtenerEjercicioBase } from './ejercicios';
import { ACCESS_CODES, CALL_TYPE_CODES, EXERCISE_TYPE_CODES, MODEL_CODES, QUOTA_CODES, SCALE_CODES } from './metadata';

type ValorCelda = string | number | boolean | Date | null | undefined;
type FilaFuente = Record<string, ValorCelda>;

function valorATexto(valor: ValorCelda): string {
    if (valor === null || valor === undefined) return '';
    if (valor instanceof Date) return valor.toISOString();
    return String(valor);
}

function normalizarCabecera(s: string): string {
    return valorATexto(s)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .trim();
}

/**
 * Normaliza textos mostrados al usuario, como versiones o tipos, convirtiendo
 * distintos tipos de guion en guion normal y quitando espacios extra.
 */
function normalizarTextoVisual(valor: ValorCelda): string {
    const txt = valorATexto(valor);
    if (!txt) return '';
    return txt
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[\u00AD\u200B-\u200F\u202A-\u202E\u2028-\u2029\u2060-\u2064\u206A-\u206F\uFEFF\uFFF9-\uFFFB]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizarValorBooleano(valor: ValorCelda): string {
    return normalizarTextoVisual(valor)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

const VALORES_VERDADEROS = new Set(['verdadero', 'true', 'si', 's', '1', 'x', 'yes', 'y', 'v', 'checked', 'marcado']);
const VALORES_FALSOS = new Set(['falso', 'false', 'no', 'n', '0', 'unchecked', 'desmarcado']);

function toBool(valor: ValorCelda): boolean {
    const texto = valorATexto(valor).trim();
    if (texto === '✓' || texto === '✔' || texto === '☑') return true;
    return VALORES_VERDADEROS.has(normalizarValorBooleano(valor));
}

function pareceBooleano(valor: ValorCelda): boolean {
    const texto = valorATexto(valor).trim();
    if (texto === '✓' || texto === '✔' || texto === '☑' || texto === '☐') return true;
    const normalizado = normalizarValorBooleano(valor);
    return VALORES_VERDADEROS.has(normalizado) || VALORES_FALSOS.has(normalizado);
}

function normalizarClavePrograma(texto: string): string {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function limpiarFragmentoPrograma(texto: string): string {
    return texto
        .replace(/\b\d{4}\b/g, '')
        .replace(/\b365\b/g, '')
        .replace(/\b\d{1,2}\b/g, '')
        .replace(/\bCl[áa]sico\b/gi, '')
        .replace(/[,;]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function colapsarPalabrasRepetidas(texto: string): string {
    return texto
        .split(' ')
        .filter((palabra, indice, palabras) => indice === 0 || normalizarClavePrograma(palabra) !== normalizarClavePrograma(palabras[indice - 1]))
        .join(' ');
}

const PROGRAM_ALIASES: Record<string, string> = {
    palabra: 'Word',
    sobresalir: 'Excel',
    acceso: 'Access',
    perspectiva: 'Outlook',
    borde: 'Edge',
    escritor: 'Writer',
    calculo: 'Calc',
    ventanas: 'Windows',
};

function normalizarAliasPrograma(texto: string): string {
    return PROGRAM_ALIASES[normalizarClavePrograma(texto)] ?? texto;
}

/**
 * Normaliza el nombre de un programa o aplicación eliminando versiones, años,
 * sufijos numéricos y variantes como «Clásico».
 */
export function normalizarPrograma(app: string): string {
    const texto = normalizarTextoVisual(app);
    if (!texto) return '';

    const fragmentos = texto
        .split(/\s*(?:[,;/|]+|\s+(?:y|e|and)\s+)\s*/i)
        .map(limpiarFragmentoPrograma)
        .filter(Boolean);
    const clavesUnicas = new Set(fragmentos.map(normalizarClavePrograma));

    if (fragmentos.length > 1 && clavesUnicas.size === 1) {
        return normalizarAliasPrograma(fragmentos[0]);
    }

    return normalizarAliasPrograma(colapsarPalabrasRepetidas(limpiarFragmentoPrograma(texto)));
}

/** Dado un objeto-fila original, devuelve funciones de lectura insensibles a acentos y separadores. */
function crearLectorCampos(row: FilaFuente) {
    const mapa: Record<string, string[]> = {};
    for (const key of Object.keys(row)) {
        const cabecera = normalizarCabecera(key);
        if (!cabecera) continue;
        mapa[cabecera] = [...(mapa[cabecera] ?? []), valorATexto(row[key])];
    }

    const getAll = (campo: string) => mapa[normalizarCabecera(campo)] ?? [];

    const get = (campo: string) => {
        const valores = getAll(campo);
        return valores.find(v => v.trim() !== '') ?? valores[0] ?? '';
    };

    const getAny = (campos: string[]) => {
        for (const campo of campos) {
            const valor = get(campo);
            if (valor !== '') return valor;
        }
        return '';
    };

    const getBoolAny = (campos: string[]) => campos.some(campo => getAll(campo).some(valor => toBool(valor)));

    const getTextAny = (campos: string[]) => {
        for (const campo of campos) {
            const valor = getAll(campo).find(v => v.trim() !== '' && !pareceBooleano(v));
            if (valor !== undefined) return valor;
        }
        return '';
    };

    return { get, getAny, getBoolAny, getTextAny };
}

/** Dado un objeto-fila original, devuelve una función get(campo) que busca insensitivamente. */
function crearGetCampo(row: FilaFuente): (campo: string) => string {
    return crearLectorCampos(row).get;
}

function parsearAnioEjercicio(valor: string): number {
    const texto = normalizarTextoVisual(valor);
    if (!texto || texto === '0') return 0;
    const anio = parseInt(texto, 10);
    if (Number.isNaN(anio)) return 0;
    return anio < 100 ? anio + 2000 : anio;
}

function normalizarCodigoMetadato(valor: string): string {
    return normalizarTextoVisual(valor)
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\./g, '')
        .trim();
}

const VARIANTES_CONVOCATORIA: Record<string, string> = {
    BIB: 'Bibliotecas',
    BIBLIOTECA: 'Bibliotecas',
    BIBLIOTECAS: 'Bibliotecas',
};
const REGEX_EXTRAORDINARIO = /(^|[_\s-])EXT($|[_\s-])|extraordinari/i;

function esTokenAnio(valor: string): boolean {
    return /^(?:\d{2}|\d{4})$/.test(normalizarTextoVisual(valor)) && parsearAnioEjercicio(valor) > 0;
}

function buscarIndiceCodigo(partes: string[], codigos: ReadonlySet<string>, desde = 0): number {
    return partes.findIndex((parte, indice) => indice >= desde && codigos.has(normalizarCodigoMetadato(parte)));
}

function normalizarCodigoModelo(valor: string): string {
    return normalizarCodigoMetadato(valor).replace(/^MODELO\s+/, '');
}

function buscarIndiceModelo(partes: string[], desde = 0): number {
    return partes.findIndex((parte, indice) => indice >= desde && MODEL_CODES.has(normalizarCodigoModelo(parte)));
}

function buscarIndiceEscala(partes: string[], indiceAnio: number): number {
    if (indiceAnio > 0) {
        for (let i = indiceAnio - 1; i >= 0; i -= 1) {
            if (SCALE_CODES.has(normalizarCodigoMetadato(partes[i]))) return i;
        }
    }
    return buscarIndiceCodigo(partes, SCALE_CODES);
}

function parsearMetadatosEjercicio(ejercicio: string): MetadatosEjercicio {
    const texto = normalizarTextoVisual(ejercicio);
    const usaGuiones = /\s+-\s+/.test(texto);
    const partes = (usaGuiones ? texto.split(/\s+-\s+/) : texto.split('_'))
        .map(p => normalizarTextoVisual(p))
        .filter(Boolean);

    const indiceAnio = partes.findIndex(esTokenAnio);
    const indiceEscala = buscarIndiceEscala(partes, indiceAnio);
    const indicePosteriorAnio = Math.max(indiceAnio + 1, 0);
    const indiceTipoConvocatoria = buscarIndiceCodigo(partes, CALL_TYPE_CODES, indicePosteriorAnio);
    const indiceAcceso = buscarIndiceCodigo(partes, ACCESS_CODES, indicePosteriorAnio);
    const indicePosteriorConvocatoria = Math.max(indiceTipoConvocatoria, indiceAcceso, indiceAnio) + 1;
    const indiceCupo = buscarIndiceCodigo(partes, QUOTA_CODES, indicePosteriorConvocatoria);
    const indiceTipo = buscarIndiceCodigo(partes, EXERCISE_TYPE_CODES, indicePosteriorConvocatoria);
    const indiceModeloDesde = Math.max(indiceTipoConvocatoria, indiceAcceso, indiceCupo, indiceTipo, indiceAnio) + 1;
    const indiceModelo = buscarIndiceModelo(partes, indiceModeloDesde);
    const indicesEstructurales = new Set([indiceEscala, indiceAnio, indiceTipoConvocatoria, indiceAcceso, indiceCupo, indiceTipo, indiceModelo].filter(i => i >= 0));
    const varianteTokens: string[] = [];
    const organismoTokens: string[] = [];

    partes.forEach((parte, indice) => {
        if (indicesEstructurales.has(indice)) return;

        const codigo = normalizarCodigoMetadato(parte);
        const varianteNormalizada = VARIANTES_CONVOCATORIA[codigo];
        if (varianteNormalizada) {
            varianteTokens.push(varianteNormalizada);
            return;
        }

        if (indiceEscala >= 0 && indice < indiceEscala) {
            organismoTokens.push(parte);
            return;
        }

        if (codigo === 'EXT' || /extraordinari/i.test(parte)) {
            varianteTokens.push('EXT');
            return;
        }
    });

    const organismo = indiceEscala >= 0
        ? organismoTokens.join(' ')
        : partes[0] || '';

    return {
        organismo,
        escala: indiceEscala >= 0 ? normalizarCodigoMetadato(partes[indiceEscala]) : partes[1] || '',
        año: indiceAnio >= 0 ? parsearAnioEjercicio(partes[indiceAnio]) : 0,
        tipoConvocatoria: indiceTipoConvocatoria >= 0 ? normalizarCodigoMetadato(partes[indiceTipoConvocatoria]) : '',
        acceso: indiceAcceso >= 0 ? normalizarCodigoMetadato(partes[indiceAcceso]) : '',
        cupo: indiceCupo >= 0 ? normalizarCodigoMetadato(partes[indiceCupo]) : '',
        tipo: indiceTipo >= 0 ? normalizarCodigoMetadato(partes[indiceTipo]) : '',
        modelo: indiceModelo >= 0 ? normalizarCodigoModelo(partes[indiceModelo]) : '',
        variante: Array.from(new Set(varianteTokens)).join(' '),
        extraordinaria: REGEX_EXTRAORDINARIO.test(texto),
    };
}

function normalizarAnioNumero(anio: number): number {
    if (!anio) return 0;
    return anio > 0 && anio < 100 ? anio + 2000 : anio;
}

function sonMetadatosIguales(a: MetadatosEjercicio, b: MetadatosEjercicio): boolean {
    return a.organismo === b.organismo
        && a.escala === b.escala
        && a.año === b.año
        && (a.tipoConvocatoria || '') === (b.tipoConvocatoria || '')
        && a.acceso === b.acceso
        && (a.cupo || '') === (b.cupo || '')
        && a.tipo === b.tipo
        && (a.modelo || '') === (b.modelo || '')
        && a.variante === b.variante
        && a.extraordinaria === b.extraordinaria;
}

export function normalizarDatasetAnalisis(dataset: DatasetAnalisis): DatasetAnalisis {
    let hayCambios = false;
    const preguntas = dataset.preguntas.map(pregunta => {
        const metadatosEjercicio = parsearMetadatosEjercicio(obtenerEjercicioBase(pregunta));
        const metadatos: MetadatosEjercicio = {
            ...pregunta.metadatos,
            organismo: metadatosEjercicio.organismo || pregunta.metadatos.organismo,
            escala: metadatosEjercicio.escala || pregunta.metadatos.escala,
            año: normalizarAnioNumero(pregunta.metadatos.año) || metadatosEjercicio.año,
            tipoConvocatoria: metadatosEjercicio.tipoConvocatoria,
            acceso: metadatosEjercicio.acceso,
            cupo: metadatosEjercicio.cupo,
            tipo: metadatosEjercicio.tipo,
            modelo: metadatosEjercicio.modelo,
            variante: metadatosEjercicio.variante,
            extraordinaria: metadatosEjercicio.extraordinaria || pregunta.metadatos.extraordinaria,
        };
        const aplicacion = normalizarPrograma(pregunta.aplicacion);

        if (sonMetadatosIguales(pregunta.metadatos, metadatos) && pregunta.aplicacion === aplicacion) return pregunta;
        hayCambios = true;
        return { ...pregunta, metadatos, aplicacion };
    });

    return hayCambios ? { ...dataset, preguntas } : dataset;
}

export const procesarCSV = (file: File, idCuestionarioManual?: string): Promise<DatasetAnalisis> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            delimiter: '|',
            skipEmptyLines: true,
            complete: (results) => {
                const preguntas: Pregunta[] = [];
                const conceptos_globales: ConceptoAdyacente[] = [];
                const cuestionarios_set = new Set<string>();
                const ejercicios_set = new Set<string>();
                const idsUsados = new Map<string, number>();

                results.data.forEach((rawRow) => {
                    const get = crearGetCampo(rawRow as FilaFuente);
                    const idCuest = idCuestionarioManual || get('id_cuestionario') || '';
                    if (idCuest) cuestionarios_set.add(idCuest);

                    const ejercicio = get('ejercicio') || get('id_ejercicio');
                    const numeroStr = get('numero') || get('num_pregunta') || get('num') || get('nº') || get('n.º') || get('nÂº') || get('n.Âº') || get('n') || '0';
                    const metadatosEjercicio = parsearMetadatosEjercicio(ejercicio);

                    const baseId = idCuest
                        ? `${idCuest}_${ejercicio}_${numeroStr}`
                        : `${ejercicio}_${numeroStr}`;

                    const key = `${idCuest}::${baseId}`;
                    const nPrev = idsUsados.get(key) ?? 0;
                    idsUsados.set(key, nPrev + 1);
                    const id = nPrev === 0 ? baseId : `${baseId}_dup${nPrev}`;
                    ejercicios_set.add(ejercicio);

                    const opciones = {
                        A: get('respuesta_a'),
                        B: get('respuesta_b'),
                        C: get('respuesta_c'),
                        D: get('respuesta_d')
                    };

                    const distractores: ConceptoAdyacente[] = [];
                    const añoNum = parsearAnioEjercicio(get('año') || get('ano')) || metadatosEjercicio.año;

                    const correcta = get('correcta');
                    if (correcta !== '') {
                        Object.entries(opciones).forEach(([letra, texto]) => {
                            if (letra !== correcta && texto.trim() !== '') {
                                const concepto = {
                                    id_origen: id,
                                    texto_opcion: texto,
                                    año_aparicion: añoNum
                                };
                                distractores.push(concepto);
                                conceptos_globales.push(concepto);
                            }
                        });
                    }

                    preguntas.push({
                        id,
                        id_cuestionario: idCuest,
                        numero_original: parseInt(numeroStr) || 0,
                        metadatos: {
                            organismo: metadatosEjercicio.organismo,
                            escala: metadatosEjercicio.escala,
                            año: añoNum,
                            tipoConvocatoria: metadatosEjercicio.tipoConvocatoria,
                            acceso: metadatosEjercicio.acceso,
                            cupo: metadatosEjercicio.cupo,
                            tipo: metadatosEjercicio.tipo,
                            modelo: metadatosEjercicio.modelo,
                            variante: metadatosEjercicio.variante,
                            extraordinaria: metadatosEjercicio.extraordinaria
                        },
                        materia: get('materia') || 'varia',
                        bloque: get('bloque'),
                        tema: get('tema'),
                        aplicacion: normalizarPrograma(get('aplicacion')),
                        enunciado: get('pregunta'),
                        opciones,
                        correcta: correcta || null,
                        anulada: toBool(get('anulada')),
                        observaciones: get('observaciones'),
                        conceptos_clave: [],
                        distractores
                    });
                });

                resolve({
                    preguntas,
                    conceptos_globales,
                    ejercicios_unicos: Array.from(ejercicios_set),
                    cuestionarios_cargados: Array.from(cuestionarios_set)
                });
            },
            error: (error) => reject(error)
        });
    });
};

const esExcel = (file: File): boolean => /\.(xlsx|xlsm)$/i.test(file.name);

const leerFilasCatalogoCSV = (file: File): Promise<FilaFuente[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            delimitersToGuess: ['|', ';', '\t', ','],
            skipEmptyLines: true,
            complete: (results) => resolve(results.data as FilaFuente[]),
            error: (error) => reject(error)
        });
    });
};

function parsearXml(xml: string): Document {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const error = doc.getElementsByTagName('parsererror')[0];
    if (error) {
        throw new Error('El archivo Excel contiene XML no válido.');
    }
    return doc;
}

async function leerXml(zip: JSZip, ruta: string): Promise<Document | null> {
    const archivo = zip.file(ruta.replace(/^\/+/, ''));
    if (!archivo) return null;
    return parsearXml(await archivo.async('text'));
}

function leerCadenasCompartidas(doc: Document | null): string[] {
    if (!doc) return [];
    return Array.from(doc.getElementsByTagName('si')).map(si =>
        Array.from(si.getElementsByTagName('t')).map(t => t.textContent ?? '').join('')
    );
}

function resolverRutaHoja(target: string): string {
    const limpio = target.replace(/^\/+/, '');
    return limpio.startsWith('xl/') ? limpio : `xl/${limpio}`;
}

async function obtenerRutaPrimeraHoja(zip: JSZip): Promise<string> {
    const workbook = await leerXml(zip, 'xl/workbook.xml');
    const relaciones = await leerXml(zip, 'xl/_rels/workbook.xml.rels');
    const primeraHoja = workbook?.getElementsByTagName('sheet')[0];
    const relacionId = primeraHoja?.getAttribute('r:id')
        ?? primeraHoja?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');

    if (relaciones && relacionId) {
        const relacion = Array.from(relaciones.getElementsByTagName('Relationship'))
            .find(r => r.getAttribute('Id') === relacionId);
        const target = relacion?.getAttribute('Target');
        if (target) return resolverRutaHoja(target);
    }

    return 'xl/worksheets/sheet1.xml';
}

function obtenerIndiceColumna(referencia: string): number {
    const letras = (referencia.match(/^[A-Z]+/i)?.[0] ?? '').toUpperCase();
    return letras.split('').reduce((acc, letra) => acc * 26 + letra.charCodeAt(0) - 64, 0) - 1;
}

function leerTextoInline(celda: Element): string {
    return Array.from(celda.getElementsByTagName('t')).map(t => t.textContent ?? '').join('');
}

function leerValorCelda(celda: Element, cadenasCompartidas: string[]): ValorCelda {
    const tipo = celda.getAttribute('t');
    if (tipo === 'inlineStr') return leerTextoInline(celda);

    const valor = celda.getElementsByTagName('v')[0]?.textContent ?? '';
    if (tipo === 's') return cadenasCompartidas[Number(valor)] ?? '';
    if (tipo === 'b') return valor === '1' || valor.toLowerCase() === 'true';
    return valor;
}

function leerFilasHoja(doc: Document, cadenasCompartidas: string[]): ValorCelda[][] {
    return Array.from(doc.getElementsByTagName('row')).map(row => {
        const valores: ValorCelda[] = [];
        Array.from(row.getElementsByTagName('c')).forEach(celda => {
            const referencia = celda.getAttribute('r') ?? '';
            const indice = obtenerIndiceColumna(referencia);
            if (indice >= 0) valores[indice] = leerValorCelda(celda, cadenasCompartidas);
        });
        return valores;
    });
}

function crearCabecerasUnicas(cabeceras: ValorCelda[]): string[] {
    const usos = new Map<string, number>();
    return cabeceras.map((cabecera, indice) => {
        const base = normalizarTextoVisual(cabecera) || `columna_${indice + 1}`;
        const uso = usos.get(base) ?? 0;
        usos.set(base, uso + 1);
        return uso === 0 ? base : `${base}_${uso}`;
    });
}

function convertirFilasExcel(filas: ValorCelda[][]): FilaFuente[] {
    const indiceCabecera = filas.findIndex(fila => fila.some(valor => valorATexto(valor).trim() !== ''));
    if (indiceCabecera < 0) return [];

    const cabeceras = crearCabecerasUnicas(filas[indiceCabecera]);
    return filas.slice(indiceCabecera + 1)
        .filter(fila => fila.some(valor => valorATexto(valor).trim() !== ''))
        .map(fila => Object.fromEntries(cabeceras.map((cabecera, indice) => [cabecera, fila[indice] ?? ''])));
}

const leerFilasCatalogoExcel = async (file: File): Promise<FilaFuente[]> => {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const cadenasCompartidas = leerCadenasCompartidas(await leerXml(zip, 'xl/sharedStrings.xml'));
    const rutaHoja = await obtenerRutaPrimeraHoja(zip);
    const hoja = await leerXml(zip, rutaHoja);
    if (!hoja) return [];
    return convertirFilasExcel(leerFilasHoja(hoja, cadenasCompartidas));
};

const leerFilasCatalogo = (file: File): Promise<FilaFuente[]> => (
    esExcel(file) ? leerFilasCatalogoExcel(file) : leerFilasCatalogoCSV(file)
);

function parsearNumeroPreguntas(valor: string): number {
    const limpio = valor.replace(/[^\d-]/g, '');
    return parseInt(limpio || '0', 10) || 0;
}

function normalizarVersionSistemaOperativo(valor: string): string {
    const texto = normalizarTextoVisual(valor);
    return texto && !pareceBooleano(texto) ? texto : '';
}

function inferirVersionSistemaOperativo(version: string): string {
    const texto = normalizarTextoVisual(version);
    const match = texto.match(/\b(?:win|windows)\s*[-_ ]?(10|11)\b/i);
    return match ? `Windows ${match[1]}` : '';
}

function normalizarCuestionarioMeta(item: CuestionarioMeta): CuestionarioMeta {
    const legado = (item as unknown as { sistema_operativo?: unknown }).sistema_operativo;
    const versionLegada = typeof legado === 'string' ? normalizarVersionSistemaOperativo(legado) : '';
    const versionSistemaOperativo = normalizarVersionSistemaOperativo(item.version_sistema_operativo)
        || versionLegada
        || inferirVersionSistemaOperativo(item.version);

    return {
        ...item,
        version_sistema_operativo: versionSistemaOperativo,
    };
}

function crearCuestionarioMeta(rawRow: FilaFuente): CuestionarioMeta | null {
    const { getAny, getBoolAny, getTextAny } = crearLectorCampos(rawRow);
    const cuestionario = normalizarTextoVisual(getAny(['cuestionario', 'ejercicio', 'id_ejercicio']));
    const id = getAny(['id_cuestionario', 'id_cu', 'codigo', 'código']) || cuestionario || getAny(['id']);
    if (!id) return null;

    return {
        id_cuestionario: normalizarTextoVisual(id),
        familia: normalizarTextoVisual(getAny(['familia', 'categoria', 'categoría', 'ambito', 'ámbito', 'area', 'área', 'grupo', 'clase', 'tipo_cuestionario', 't'])),
        cuestionario,
        version: normalizarTextoVisual(getAny(['version', 'versión'])),
        tipo: normalizarTextoVisual(getAny(['tipo'])),
        estado: normalizarTextoVisual(getAny(['estado'])),
        recopilacion: getBoolAny(['recopilacion', 'recopilación', 'rec']),
        num_preguntas: parsearNumeroPreguntas(getAny(['num_preguntas', 'numero_preguntas', 'número_preguntas', 'numero de preguntas', 'número de preguntas', 'nº preguntas', 'n.º preguntas', 'num', 'numero', 'número', 'n'])),
        version_sistema_operativo: normalizarVersionSistemaOperativo(getTextAny([
            'version_sistema_operativo',
            'versión_sistema_operativo',
            'version_so',
            'versión_so',
            'version so',
            'versión so',
            'so_version',
            'so version',
            'version sistema operativo',
            'versión sistema operativo',
            'version del sistema operativo',
            'versión del sistema operativo',
            'sistema_operativo_version',
            'sistema operativo version',
            'sistema operativo versión',
            'sistema_operativo',
            'sistema operativo'
        ])),
        paquete_ofimatico: normalizarTextoVisual(getAny(['paquete_ofimatico', 'paquete ofimático', 'paquete ofimatico'])),
        descripcion: normalizarTextoVisual(getAny(['descripcion', 'descripción'])),
        preparacion: normalizarTextoVisual(getAny(['preparacion', 'preparación', 'prep'])),
        informatica: getBoolAny(['informatica', 'informática']),
        seguridad: getBoolAny(['seguridad']),
        sistema_operativo: getBoolAny(['sistema_operativo_1', 'sistema operativo_1', 'sistema_operativo2', 'sistema operativo2', 'sistema_operativo_tema', 'sistema operativo tema', 'so_tema', 'sistema_operativo', 'sistema operativo']),
        procesador_texto: getBoolAny(['procesador_texto', 'procesador de texto', 'procesador']),
        hoja_de_calculo: getBoolAny(['hoja_de_calculo', 'hoja de cálculo', 'hoja de calculo', 'hoja']),
        sgbd: getBoolAny(['sgbd']),
        presentaciones: getBoolAny(['presentaciones', 'presentacion', 'presentación']),
        redes: getBoolAny(['redes', 'rede', 'red']),
        cliente_correo: getBoolAny(['cliente_correo', 'cliente correo', 'cliente_c', 'correo']),
    };
}

const CAMPOS_TEXTO_CATALOGO = [
    'familia',
    'cuestionario',
    'version',
    'tipo',
    'estado',
    'version_sistema_operativo',
    'paquete_ofimatico',
    'descripcion',
    'preparacion',
] as const;

const CAMPOS_BOOLEANOS_CATALOGO = [
    'recopilacion',
    'informatica',
    'seguridad',
    'sistema_operativo',
    'procesador_texto',
    'hoja_de_calculo',
    'sgbd',
    'presentaciones',
    'redes',
    'cliente_correo',
] as const;

function obtenerClaveCatalogo(cuestionario: CuestionarioMeta): string {
    return normalizarTextoVisual(cuestionario.id_cuestionario)
        || [
            cuestionario.cuestionario,
            cuestionario.version,
            cuestionario.tipo,
        ].map(normalizarTextoVisual).join('|');
}

export function normalizarCatalogo(catalogo: CuestionarioMeta[]): CuestionarioMeta[] {
    const grupos = new Map<string, { item: CuestionarioMeta; filas: number; maxPreguntas: number }>();

    catalogo.map(normalizarCuestionarioMeta).forEach(item => {
        const clave = obtenerClaveCatalogo(item);
        const grupo = grupos.get(clave);

        if (!grupo) {
            grupos.set(clave, { item: { ...item }, filas: 1, maxPreguntas: item.num_preguntas });
            return;
        }

        grupo.filas += 1;
        grupo.maxPreguntas = Math.max(grupo.maxPreguntas, item.num_preguntas);

        CAMPOS_TEXTO_CATALOGO.forEach(campo => {
            if (!grupo.item[campo] && item[campo]) {
                grupo.item[campo] = item[campo];
            }
        });

        CAMPOS_BOOLEANOS_CATALOGO.forEach(campo => {
            grupo.item[campo] = grupo.item[campo] || item[campo];
        });
    });

    return Array.from(grupos.values()).map(grupo => ({
        ...grupo.item,
        num_preguntas: grupo.filas > 1
            ? Math.max(grupo.maxPreguntas, grupo.filas)
            : grupo.item.num_preguntas,
    }));
}

/** Parsea un catálogo de cuestionarios en CSV o Excel. */
export const parsearCatalogo = async (file: File): Promise<CuestionarioMeta[]> => {
    const filas = await leerFilasCatalogo(file);
    const catalogo = filas
        .map(crearCuestionarioMeta)
        .filter((fila): fila is CuestionarioMeta => fila !== null);

    return normalizarCatalogo(catalogo);
};

/** Detecta si un CSV contiene la columna id_cuestionario leyendo solo la cabecera. */
export const csvTieneIdCuestionario = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
        Papa.parse(file, {
            header: true,
            delimiter: '|',
            preview: 1,
            complete: (results) => {
                const campos = results.meta.fields || [];
                resolve(campos.some(f => normalizarCabecera(f) === 'id_cuestionario'));
            },
            error: () => resolve(false)
        });
    });
};
