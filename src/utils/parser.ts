import Papa from 'papaparse';
import type { Pregunta, ConceptoAdyacente, DatasetAnalisis, CuestionarioMeta } from '../types';

function normalizarCabecera(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .trim();
}

/** 
 * Normaliza textos mostrados al usuario (versiones, tipos) 
 * convirtiendo distintos tipos de guiones largos a guión normal y quitando espacios extra.
 */
function normalizarTextoVisual(txt: string): string {
    if (!txt) return '';
    return txt
        .replace(/[\u2013\u2014]/g, '-') // Reemplazar en-dash o em-dash por guión simple
        .replace(/[\u00AD\u200B-\u200F\u202A-\u202E\u2028-\u2029\u2060-\u2064\u206A-\u206F\uFEFF\uFFF9-\uFFFB]/g, '') // Eliminar caracteres invisibles (zero-width, bidi override, soft-hyphen, Trojan Source)
        .replace(/\s+/g, ' ')            // Colapsar todos los espacios (incluidos no separables o múltiples) a 1
        .trim();
}

/**
 * Normaliza el nombre de un programa/aplicación eliminando versiones,
 * años, sufijos numéricos y variantes como «Clásico».
 * Ej: «Excel 365» → «Excel», «Word 2019, 2021, 2024, 365» → «Word»,
 * «Windows 11» → «Windows», «Outlook 365 Clásico» → «Outlook».
 */
function normalizarPrograma(app: string): string {
    if (!app) return app;
    return app
        .replace(/\b\d{4}\b/g, '')         // años: 2019, 2021, 2024…
        .replace(/\b365\b/g, '')            // «365»
        .replace(/\b\d{1,2}\b/g, '')        // versiones cortas: 11, 10…
        .replace(/\bCl[áa]sico\b/gi, '')    // «Clásico» / «Clasico»
        .replace(/[,;]+/g, '')              // separadores de listas
        .replace(/\s+/g, ' ')               // espacios múltiples
        .trim();
}

/** Dado un objeto-fila original, devuelve una función get(campo) que busca insensitivamente */
function crearGetCampo(row: Record<string, string>): (campo: string) => string {
    // Construir mapa normalizado → valor solo una vez por fila
    const mapa: Record<string, string> = {};
    for (const key of Object.keys(row)) {
        mapa[normalizarCabecera(key)] = row[key];
    }
    return (campo: string) => mapa[normalizarCabecera(campo)] ?? '';
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

                results.data.forEach((rawRow: any) => {
                    const get = crearGetCampo(rawRow);
                    const idCuest = idCuestionarioManual || get('id_cuestionario') || '';
                    if (idCuest) cuestionarios_set.add(idCuest);

                    const ejercicio = get('ejercicio') || get('id_ejercicio');
                    const numeroStr = get('numero') || get('num_pregunta') || get('num') || get('nº') || get('n.º') || get('n') || '0';

                    // id = id_cuestionario + ejercicio + numero (clave natural del dataset)
                    const baseId = idCuest
                        ? `${idCuest}_${ejercicio}_${numeroStr}`
                        : `${ejercicio}_${numeroStr}`;

                    // Si dos filas del mismo cuestionario producen la misma clave base, sufijo _dupN
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
                    let añoNum = parseInt(get('año') || get('ano')) || 0;
                    if (añoNum === 0 && ejercicio) {
                        const partes = ejercicio.split('_');
                        if (partes.length > 2) {
                            const parsedYear = parseInt(partes[2]);
                            if (!isNaN(parsedYear)) {
                                añoNum = parsedYear < 100 ? parsedYear + 2000 : parsedYear;
                            }
                        }
                    }

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
                            organismo: ejercicio?.split('_')[0] || '',
                            escala: ejercicio?.split('_')[1] || '',
                            año: añoNum,
                            acceso: ejercicio?.split('_')[3] || '',
                            tipo: ejercicio?.split('_')[4] || '',
                            variante: ejercicio?.split('_').slice(5).join(' ') || '',
                            extraordinaria: ejercicio?.includes('EXT') || false
                        },
                        materia: get('materia') || 'varia',
                        bloque: get('bloque'),
                        tema: get('tema'),
                        aplicacion: normalizarPrograma(get('aplicacion')),
                        enunciado: get('pregunta'),
                        opciones,
                        correcta: correcta || null,
                        anulada: (() => {
                            const v = get('anulada').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                            return v === 'verdadero' || v === 'true' || v === 'si' || v === 'sí' || v === '1';
                        })(),
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

/** Parsea un CSV de catálogo de cuestionarios */
export const parsearCatalogo = (file: File): Promise<CuestionarioMeta[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            delimiter: '|',
            skipEmptyLines: true,
            complete: (results) => {
                const catalogo: CuestionarioMeta[] = [];
                const toBool = (v: string): boolean => {
                    const n = v?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                    return n === 'verdadero' || n === 'true' || n === 'si' || n === 'sí' || n === '1';
                };
                results.data.forEach((rawRow: any) => {
                    const get = crearGetCampo(rawRow);
                    const id = get('id_cuestionario');
                    if (!id) return;
                    catalogo.push({
                        id_cuestionario: id,
                        cuestionario: normalizarTextoVisual(get('cuestionario')),
                        version: normalizarTextoVisual(get('version') || get('versión')),
                        tipo: normalizarTextoVisual(get('tipo')),
                        estado: normalizarTextoVisual(get('estado')),
                        recopilacion: toBool(get('recopilacion') || get('recopilación')),
                        sistema_operativo: normalizarTextoVisual(get('sistema_operativo') || get('sistema operativo')),
                        paquete_ofimatico: normalizarTextoVisual(get('paquete_ofimatico') || get('paquete ofimático') || get('paquete ofimatico')),
                        descripcion: get('descripcion') || get('descripción'),
                        procesador_texto: toBool(get('procesador_texto') || get('procesador de texto')),
                        hoja_de_calculo: toBool(get('hoja_de_calculo') || get('hoja de cálculo') || get('hoja de calculo')),
                        sgbd: toBool(get('sgbd')),
                        presentaciones: toBool(get('presentaciones')),
                        cliente_correo: toBool(get('cliente_correo') || get('cliente correo')),
                        num_preguntas: parseInt(get('num_preguntas') || get('numero_preguntas') || get('número de preguntas') || get('numero de preguntas') || get('nº preguntas') || '0') || 0,
                    });
                });
                resolve(catalogo);
            },
            error: (error) => reject(error)
        });
    });
};

/** Detecta si un CSV contiene la columna id_cuestionario leyendo solo la cabecera */
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
