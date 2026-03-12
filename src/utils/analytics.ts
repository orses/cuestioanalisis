import type { Pregunta } from '../types';
import { STOP_WORDS } from './stopwords';


// ═══════════════════════════════════════════════════════
// 1. MAPA DE CALOR — año × materia/bloque
// ═══════════════════════════════════════════════════════

export interface CeldaCalor {
    año: number;
    categoria: string;
    cantidad: number;
}

export interface MapaCalorData {
    celdas: CeldaCalor[];
    años: number[];
    categorias: string[];
    max: number;
}

export function calcularMapaCalor(
    preguntas: Pregunta[],
    campo: 'bloque' | 'tema' | 'aplicacion' = 'bloque'
): MapaCalorData {
    const mapa = new Map<string, number>();
    const añosSet = new Set<number>();
    const catsSet = new Set<string>();

    for (const p of preguntas) {
        const año = p.metadatos.año;
        let cat = '(vacío)';
        if (campo === 'bloque') cat = p.bloque || '(vacío)';
        if (campo === 'tema') cat = p.tema || '(vacío)';
        if (campo === 'aplicacion') cat = p.aplicacion || '(vacío)';
        if (!año) continue;
        const key = `${año}|${cat}`;
        mapa.set(key, (mapa.get(key) || 0) + 1);
        añosSet.add(año);
        catsSet.add(cat);
    }

    const años = Array.from(añosSet).sort((a, b) => a - b);
    const categorias = Array.from(catsSet).sort();
    let max = 0;

    const celdas: CeldaCalor[] = [];
    for (const año of años) {
        for (const cat of categorias) {
            const cantidad = mapa.get(`${año}|${cat}`) || 0;
            if (cantidad > max) max = cantidad;
            celdas.push({ año, categoria: cat, cantidad });
        }
    }

    return { celdas, años, categorias, max };
}

// ═══════════════════════════════════════════════════════
// 2. CHI-CUADRADO — distribución de la respuesta correcta
// ═══════════════════════════════════════════════════════

export interface ChiCuadradoResult {
    distribucion: Record<string, number>;
    total: number;
    chiSquare: number;
    pValue: number; // aproximado
    esperado: number;
    letras: string[];
}

export function calcularChiCuadrado(preguntas: Pregunta[]): ChiCuadradoResult {
    const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    let total = 0;

    for (const p of preguntas) {
        if (p.correcta && dist.hasOwnProperty(p.correcta)) {
            dist[p.correcta]++;
            total++;
        }
    }

    const letras = ['A', 'B', 'C', 'D'];
    const esperado = total / 4;

    // χ² = Σ (O - E)² / E
    let chi2 = 0;
    for (const l of letras) {
        chi2 += Math.pow(dist[l] - esperado, 2) / (esperado || 1);
    }

    // p-value aproximado con distribución chi² (3 gl)
    // Usando la aproximación de Wilson-Hilferty
    const pValue = chiSquarePValue(chi2, 3);

    return { distribucion: dist, total, chiSquare: chi2, pValue, esperado, letras };
}

/**
 * Aproximación del p-value para chi-cuadrado.
 * Usa la aproximación de la función gamma incompleta regularizada.
 */
function chiSquarePValue(x: number, df: number): number {
    if (x <= 0) return 1;
    // Aproximación simple pero razonablemente precisa

    // Use Wilson-Hilferty approximation for simplicity
    const z = Math.pow(x / df, 1 / 3) - (1 - 2 / (9 * df));
    const denom = Math.sqrt(2 / (9 * df));
    const zScore = z / denom;

    // Standard normal CDF approximation
    return 1 - normalCDF(zScore);
}

function normalCDF(x: number): number {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2);
    return 0.5 * (1.0 + sign * y);
}

// ═══════════════════════════════════════════════════════
// 3. PREGUNTAS CALIENTES — conceptos más repetidos
// ═══════════════════════════════════════════════════════

export interface ConceptoCaliente {
    concepto: string; // término o bigrama
    frecuencia: number;
    años: number[];
    preguntas: Pregunta[];
    tendencia: 'creciente' | 'estable' | 'decreciente';
}

/**
 * Extrae los N conceptos (bigramas significativos) más frecuentes
 * que aparecen en al menos 2 años distintos.
 */
export function detectarPreguntasCalientes(
    preguntas: Pregunta[],
    topN: number = 20
): ConceptoCaliente[] {
    const bigramaMap = new Map<string, { años: Set<number>; preguntas: Pregunta[] }>();

    for (const p of preguntas) {
        const palabras = normalizar(p.enunciado)
            .split(' ')
            .filter(w => w.length > 2 && !STOP_WORDS.has(w));

        const bigramas = new Set<string>();
        for (let i = 0; i < palabras.length - 1; i++) {
            bigramas.add(`${palabras[i]} ${palabras[i + 1]}`);
        }
        // También unigramas largos (>5 chars) como conceptos
        for (const w of palabras) {
            if (w.length > 5) bigramas.add(w);
        }

        for (const bg of bigramas) {
            if (!bigramaMap.has(bg)) {
                bigramaMap.set(bg, { años: new Set(), preguntas: [] });
            }
            const entry = bigramaMap.get(bg)!;
            entry.años.add(p.metadatos.año);
            entry.preguntas.push(p);
        }
    }

    // Filtrar: al menos 3 apariciones y 2 años distintos
    const candidatos: ConceptoCaliente[] = [];
    for (const [concepto, data] of bigramaMap) {
        if (data.preguntas.length >= 3 && data.años.size >= 2) {
            const añosArr = Array.from(data.años).sort((a, b) => a - b);
            // Tendencia: comparar primera mitad vs segunda mitad
            const mid = Math.floor(añosArr.length / 2);
            const primeraMitad = data.preguntas.filter(p => p.metadatos.año <= añosArr[mid]).length;
            const segundaMitad = data.preguntas.filter(p => p.metadatos.año > añosArr[mid]).length;
            let tendencia: 'creciente' | 'estable' | 'decreciente' = 'estable';
            if (segundaMitad > primeraMitad * 1.3) tendencia = 'creciente';
            else if (primeraMitad > segundaMitad * 1.3) tendencia = 'decreciente';

            candidatos.push({
                concepto,
                frecuencia: data.preguntas.length,
                años: añosArr,
                preguntas: data.preguntas,
                tendencia,
            });
        }
    }

    // Ordenar por frecuencia descendente
    candidatos.sort((a, b) => b.frecuencia - a.frecuencia);
    return candidatos.slice(0, topN);
}

function normalizar(texto: string): string {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ')
        // Eliminar explícitamente comillas como cadenas sueltas o unidas (redundancia)
        .replace(/["'«»\u201c\u201d]/g, ' ')
        .replace(/\b(comillas?|describe)\b/gi, ' ')
        // Eliminar tokens de versión para agrupar programas
        .replace(/\b(365|20\d{2})\b/g, ' ')        // «365», años (2019, 2021…)
        .replace(/\b\d{1,2}\b/g, ' ')               // versiones cortas (11, 10)
        .replace(/\bclasico\b/gi, ' ')              // «Clásico» (ya sin tilde por NFD)
        .replace(/\s+/g, ' ')
        .trim();
}

// ═══════════════════════════════════════════════════════
// 6. ÍNDICE DE DIFICULTAD ESTIMADO
// ═══════════════════════════════════════════════════════

export interface DificultadPregunta {
    pregunta: Pregunta;
    score: number; // 0 (fácil) a 100 (difícil)
    percentil: number; // 0-100: más difícil que el X% de las preguntas
    factores: {
        longitudEnunciado: number;
        complejidadVocabulario: number;
        similitudDistractores: number;
        esAnulada: number;
        tasaAnulacionTema: number;
        rarezaConcepto: number;
    };
}

/**
 * Calcula un índice de dificultad compuesto para cada pregunta (0-100)
 * con percentil relativo al dataset completo.
 * Factores:
 * - Longitud del enunciado (enunciados más largos = más complejos)
 * - Complejidad del vocabulario (palabras largas = más técnico)
 * - Similitud entre distractores y correcta (más similares = más difícil)
 * - Si fue anulada (indica posible ambigüedad = difícil)
 * - Tasa de anulación del tema (temas problemáticos = más difíciles)
 * - Rareza del concepto (conceptos poco frecuentes = más difíciles)
 */
export function calcularDificultad(preguntas: Pregunta[]): DificultadPregunta[] {
    if (preguntas.length === 0) return [];

    // Estadísticas base
    const longitudes = preguntas.map(p => p.enunciado.length);
    const maxLong = Math.max(...longitudes);
    const minLong = Math.min(...longitudes);

    // Tasa de anulación por tema
    const anuladasPorTema: Record<string, { total: number; anuladas: number }> = {};
    for (const p of preguntas) {
        const tema = p.bloque || p.materia.toString();
        if (!anuladasPorTema[tema]) anuladasPorTema[tema] = { total: 0, anuladas: 0 };
        anuladasPorTema[tema].total++;
        if (p.anulada) anuladasPorTema[tema].anuladas++;
    }

    // Frecuencia de conceptos clave (bigramas) para detectar rareza
    const conceptoFreq = new Map<string, number>();
    for (const p of preguntas) {
        const palabras = normalizar(p.enunciado)
            .split(' ')
            .filter(w => w.length > 4 && !STOP_WORDS.has(w));
        for (let i = 0; i < palabras.length - 1; i++) {
            const bg = `${palabras[i]} ${palabras[i + 1]}`;
            conceptoFreq.set(bg, (conceptoFreq.get(bg) || 0) + 1);
        }
    }
    const maxFreqConcepto = Math.max(...conceptoFreq.values(), 1);

    // Calcular scores brutos
    const resultados = preguntas.map(p => {
        // Factor 1: longitud relativa (0-20)
        const longNorm = maxLong > minLong
            ? ((p.enunciado.length - minLong) / (maxLong - minLong)) * 20
            : 10;

        // Factor 2: complejidad vocabulario (0-20)
        const palabras = p.enunciado.split(/\s+/);
        const palabrasLargas = palabras.filter(w => w.length > 8).length;
        const compVocab = Math.min((palabrasLargas / Math.max(palabras.length, 1)) * 80, 20);

        // Factor 3: similitud entre opciones (0-25)
        const opcTextos = Object.values(p.opciones).filter(Boolean);
        let simOpciones = 0;
        if (opcTextos.length > 1) {
            const sets = opcTextos.map(t => new Set(normalizar(t).split(' ').filter(w => w.length > 2)));
            let totalSim = 0;
            let pairs = 0;
            for (let i = 0; i < sets.length; i++) {
                for (let j = i + 1; j < sets.length; j++) {
                    let inter = 0;
                    for (const w of sets[i]) { if (sets[j].has(w)) inter++; }
                    const union = sets[i].size + sets[j].size - inter;
                    totalSim += union > 0 ? inter / union : 0;
                    pairs++;
                }
            }
            simOpciones = pairs > 0 ? (totalSim / pairs) * 25 : 0;
        }

        // Factor 4: anulada (0 o 10)
        const factorAnulada = p.anulada ? 10 : 0;

        // Factor 5: tasa de anulación del tema (0-10)
        const tema = p.bloque || p.materia.toString();
        const tasaTema = anuladasPorTema[tema]
            ? (anuladasPorTema[tema].anuladas / anuladasPorTema[tema].total)
            : 0;
        const factorTasaTema = Math.round(tasaTema * 10);

        // Factor 6: rareza del concepto (0-15)
        const pals = normalizar(p.enunciado).split(' ').filter(w => w.length > 4 && !STOP_WORDS.has(w));
        let rarezaMedia = 0;
        let bgCount = 0;
        for (let i = 0; i < pals.length - 1; i++) {
            const bg = `${pals[i]} ${pals[i + 1]}`;
            const freq = conceptoFreq.get(bg) || 1;
            rarezaMedia += 1 - (freq / maxFreqConcepto);
            bgCount++;
        }
        const factorRareza = bgCount > 0 ? Math.round((rarezaMedia / bgCount) * 15) : 0;

        const score = Math.min(Math.round(
            longNorm + compVocab + simOpciones + factorAnulada + factorTasaTema + factorRareza
        ), 100);

        return {
            pregunta: p,
            score,
            percentil: 0, // se calcula en el segundo pase
            factores: {
                longitudEnunciado: Math.round(longNorm),
                complejidadVocabulario: Math.round(compVocab),
                similitudDistractores: Math.round(simOpciones),
                esAnulada: factorAnulada,
                tasaAnulacionTema: factorTasaTema,
                rarezaConcepto: factorRareza,
            },
        };
    });

    // Segundo pase: calcular percentil
    const sorted = [...resultados].sort((a, b) => a.score - b.score);
    for (let i = 0; i < sorted.length; i++) {
        sorted[i].percentil = Math.round((i / (sorted.length - 1 || 1)) * 100);
    }

    return resultados;
}

// ═══════════════════════════════════════════════════════
// 5. BÚSQUEDA SEMÁNTICA POR CONCEPTO
// ═══════════════════════════════════════════════════════

export interface GrupoConcepto {
    concepto: string;
    preguntas: Pregunta[];
    años: number[];
}

/**
 * Agrupa preguntas que comparten conceptos clave extraídos
 * de los enunciados. Usa extracción de términos técnicos
 * (sustantivos largos, bigramas significativos).
 */
export function agruparPorConcepto(
    preguntas: Pregunta[],
    minPorGrupo: number = 3
): GrupoConcepto[] {
    // Extraer términos clave de cada pregunta
    const pregTerminos = new Map<string, Set<string>>();
    const terminoPreguntas = new Map<string, Pregunta[]>();

    for (const p of preguntas) {
        const norm = normalizar(p.enunciado);
        const palabras = norm.split(' ').filter(w => w.length > 3 && !STOP_WORDS.has(w));
        const terminos = new Set<string>();

        // Bigramas significativos
        for (let i = 0; i < palabras.length - 1; i++) {
            const bg = `${palabras[i]} ${palabras[i + 1]}`;
            terminos.add(bg);
        }

        pregTerminos.set(p.id, terminos);

        for (const t of terminos) {
            if (!terminoPreguntas.has(t)) terminoPreguntas.set(t, []);
            terminoPreguntas.get(t)!.push(p);
        }
    }

    // Filtrar términos que aparecen en al menos minPorGrupo preguntas
    const grupos: GrupoConcepto[] = [];
    const usados = new Set<string>(); // evitar duplicados

    // Ordenar por frecuencia
    const terminosOrdenados = Array.from(terminoPreguntas.entries())
        .filter(([, ps]) => ps.length >= minPorGrupo)
        .sort((a, b) => b[1].length - a[1].length);

    for (const [termino, ps] of terminosOrdenados) {
        // Evitar grupos redundantes (si >80% de preguntas ya aparecen en otro grupo)
        const nuevas = ps.filter(p => !usados.has(p.id));
        if (nuevas.length < minPorGrupo * 0.5) continue;

        const años = Array.from(new Set(ps.map(p => p.metadatos.año))).sort((a, b) => a - b);
        grupos.push({
            concepto: termino,
            preguntas: ps,
            años,
        });

        ps.forEach(p => usados.add(p.id));
    }

    return grupos.slice(0, 30); // top 30 conceptos
}

// ═══════════════════════════════════════════════════════
// 8. COMPARATIVA ENTRE CONVOCATORIAS
// ═══════════════════════════════════════════════════════

export interface ComparativaData {
    ejercicio: string;
    año: number;
    organismo: string;
    escala: string;
    totalPreguntas: number;
    materias: Record<string, number>;
    bloques: Record<string, number>;
    temas: Record<string, number>;
    programas: Record<string, number>;
    tasaAnulacion: number;
    distribucionCorrecta: Record<string, number>;
}

export function generarComparativa(preguntas: Pregunta[]): ComparativaData[] {
    const porEjercicio = new Map<string, Pregunta[]>();

    for (const p of preguntas) {
        const ej = p.id.replace(/_\d+$/, '');
        if (!porEjercicio.has(ej)) porEjercicio.set(ej, []);
        porEjercicio.get(ej)!.push(p);
    }

    const datos: ComparativaData[] = [];

    for (const [ejercicio, ps] of porEjercicio) {
        const materias: Record<string, number> = {};
        const bloques: Record<string, number> = {};
        const temas: Record<string, number> = {};
        const programas: Record<string, number> = {};
        const distCorrecta: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
        let anuladas = 0;

        for (const p of ps) {
            const mat = p.materia.toString();
            materias[mat] = (materias[mat] || 0) + 1;
            if (p.bloque) bloques[p.bloque] = (bloques[p.bloque] || 0) + 1;
            if (p.tema) temas[p.tema] = (temas[p.tema] || 0) + 1;
            if (p.aplicacion) programas[p.aplicacion] = (programas[p.aplicacion] || 0) + 1;
            if (p.correcta && distCorrecta.hasOwnProperty(p.correcta)) {
                distCorrecta[p.correcta]++;
            }
            if (p.anulada) anuladas++;
        }

        datos.push({
            ejercicio,
            año: ps[0].metadatos.año,
            organismo: ps[0].metadatos.organismo,
            escala: ps[0].metadatos.escala,
            totalPreguntas: ps.length,
            materias,
            bloques,
            temas,
            programas,
            tasaAnulacion: ps.length > 0 ? anuladas / ps.length : 0,
            distribucionCorrecta: distCorrecta,
        });
    }

    datos.sort((a, b) => a.año - b.año || a.ejercicio.localeCompare(b.ejercicio));
    return datos;
}

// ═══════════════════════════════════════════════════════
// 9. PREDICCIÓN DE TEMAS PROBABLES
// ═══════════════════════════════════════════════════════

export interface PrediccionTema {
    tema: string;
    campo: 'materia' | 'bloque' | 'tema' | 'aplicacion';
    frecuenciaTotal: number;
    añosPresente: number[];
    ultimaAparicion: number;
    tendencia: 'creciente' | 'estable' | 'decreciente';
    probabilidad: number; // 0-100
    razon: string;
}

/**
 * Predice qué bloques, temas y aplicaciones/programas tienen más probabilidad de caer
 * basándose en: frecuencia, recencia, estabilidad y tendencia.
 */
export function predecirTemas(preguntas: Pregunta[]): PrediccionTema[] {
    if (preguntas.length === 0) return [];

    type AcumTema = { pregs: Pregunta[]; años: Set<number>; campo: 'materia' | 'bloque' | 'tema' | 'aplicacion' };
    const temaMap = new Map<string, AcumTema>();

    for (const p of preguntas) {
        // Por materia
        const mat = p.materia?.toString();
        if (mat) {
            if (!temaMap.has(`m|${mat}`)) temaMap.set(`m|${mat}`, { pregs: [], años: new Set(), campo: 'materia' });
            const e = temaMap.get(`m|${mat}`)!;
            e.pregs.push(p); e.años.add(p.metadatos.año);
        }
        // Por bloque
        const blq = p.bloque;
        if (blq) {
            if (!temaMap.has(`b|${blq}`)) temaMap.set(`b|${blq}`, { pregs: [], años: new Set(), campo: 'bloque' });
            const e = temaMap.get(`b|${blq}`)!;
            e.pregs.push(p); e.años.add(p.metadatos.año);
        }
        // Por tema
        const tem = p.tema;
        if (tem) {
            if (!temaMap.has(`t|${tem}`)) temaMap.set(`t|${tem}`, { pregs: [], años: new Set(), campo: 'tema' });
            const e = temaMap.get(`t|${tem}`)!;
            e.pregs.push(p); e.años.add(p.metadatos.año);
        }
        // Por aplicación/programa
        const app = p.aplicacion;
        if (app) {
            if (!temaMap.has(`a|${app}`)) temaMap.set(`a|${app}`, { pregs: [], años: new Set(), campo: 'aplicacion' });
            const e = temaMap.get(`a|${app}`)!;
            e.pregs.push(p); e.años.add(p.metadatos.año);
        }
    }

    const todosAños = Array.from(new Set(preguntas.map(p => p.metadatos.año))).sort((a, b) => a - b);
    const maxAño = todosAños[todosAños.length - 1];
    const totalAños = todosAños.length;

    const predicciones: PrediccionTema[] = [];

    for (const [key, data] of temaMap) {
        const tema = key.substring(2);
        const añosArr = Array.from(data.años).sort((a, b) => a - b);
        const ultimaAparicion = añosArr[añosArr.length - 1];

        // Tendencia: comparar mitad reciente vs antigua
        const mid = Math.floor(añosArr.length / 2);
        const antiguaCount = data.pregs.filter(p => p.metadatos.año <= añosArr[Math.max(mid - 1, 0)]).length;
        const recienteCount = data.pregs.filter(p => p.metadatos.año > añosArr[Math.max(mid - 1, 0)]).length;
        let tendencia: 'creciente' | 'estable' | 'decreciente' = 'estable';
        if (recienteCount > antiguaCount * 1.3) tendencia = 'creciente';
        else if (antiguaCount > recienteCount * 1.3) tendencia = 'decreciente';

        // Probabilidad: combinar factores
        const factorFrecuencia = Math.min((data.pregs.length / preguntas.length) * 400, 30); // máx 30
        const factorCobertura = Math.min((añosArr.length / totalAños) * 40, 25); // máx 25
        const factorRecencia = ultimaAparicion === maxAño ? 25 : (maxAño - ultimaAparicion <= 1 ? 15 : 5); // máx 25
        const factorTendencia = tendencia === 'creciente' ? 20 : tendencia === 'estable' ? 10 : 0; // máx 20

        const probabilidad = Math.min(Math.round(factorFrecuencia + factorCobertura + factorRecencia + factorTendencia), 100);

        let razon = '';
        if (tendencia === 'creciente' && ultimaAparicion === maxAño) razon = 'Tendencia creciente y presente en la última convocatoria';
        else if (ultimaAparicion === maxAño) razon = 'Presente en la última convocatoria';
        else if (tendencia === 'creciente') razon = 'Tendencia creciente en convocatorias recientes';
        else if (añosArr.length >= totalAños * 0.8) razon = 'Aparece de forma constante en casi todas las convocatorias';
        else if (tendencia === 'decreciente') razon = 'Tendencia decreciente, menor probabilidad';
        else razon = 'Aparición regular';

        predicciones.push({
            tema,
            campo: data.campo,
            frecuenciaTotal: data.pregs.length,
            añosPresente: añosArr,
            ultimaAparicion,
            tendencia,
            probabilidad,
            razon,
        });
    }

    predicciones.sort((a, b) => b.probabilidad - a.probabilidad);
    // Devolver más elementos para que el componente pueda filtrar por campo
    return predicciones;
}

// ═══════════════════════════════════════════════════════
// 10. MAPA DE CONCEPTOS CLAVE POR TEMA
// ═══════════════════════════════════════════════════════

export interface ConceptoClave {
    concepto: string;
    frecuencia: number;
    ejemplo: string; // enunciado de ejemplo
    preguntas: Pregunta[]; // preguntas asociadas
}

export interface MapaConceptosTema {
    tema: string;
    totalPreguntas: number;
    conceptos: ConceptoClave[];
}

/**
 * Para cada tema (materia o bloque), extrae los conceptos
 * más preguntados dentro de ese tema.
 */
export function mapaConceptosPorTema(
    preguntas: Pregunta[],
    campo: 'bloque' | 'tema' | 'aplicacion' = 'bloque',
    topConceptos: number = 10
): MapaConceptosTema[] {
    // Agrupar por tema
    const porTema = new Map<string, Pregunta[]>();
    for (const p of preguntas) {
        let tema = '(vacío)';
        if (campo === 'bloque') tema = p.bloque || '(vacío)';
        if (campo === 'tema') tema = p.tema || '(vacío)';
        if (campo === 'aplicacion') tema = p.aplicacion || '(vacío)';
        if (!porTema.has(tema)) porTema.set(tema, []);
        porTema.get(tema)!.push(p);
    }

    const resultado: MapaConceptosTema[] = [];

    for (const [tema, ps] of porTema) {
        const conceptoFreq = new Map<string, { freq: number; ejemplo: string; preguntas: Pregunta[] }>();

        for (const p of ps) {
            const palabras = normalizar(p.enunciado)
                .split(' ')
                .filter(w => w.length > 3 && !STOP_WORDS.has(w));

            // Bigramas
            const vistos = new Set<string>();
            for (let i = 0; i < palabras.length - 1; i++) {
                const bg = `${palabras[i]} ${palabras[i + 1]}`;
                if (vistos.has(bg)) continue;
                vistos.add(bg);
                const entry = conceptoFreq.get(bg) || { freq: 0, ejemplo: p.enunciado, preguntas: [] };
                entry.freq++;
                entry.preguntas.push(p);
                conceptoFreq.set(bg, entry);
            }
        }

        const conceptos = Array.from(conceptoFreq.entries())
            .filter(([, v]) => v.freq >= 2)
            .sort((a, b) => b[1].freq - a[1].freq)
            .slice(0, topConceptos)
            .map(([concepto, v]) => ({
                concepto,
                frecuencia: v.freq,
                ejemplo: v.ejemplo.substring(0, 120),
                preguntas: v.preguntas,
            }));

        if (conceptos.length > 0) {
            resultado.push({ tema, totalPreguntas: ps.length, conceptos });
        }
    }

    resultado.sort((a, b) => b.totalPreguntas - a.totalPreguntas);
    return resultado;
}

// ═══════════════════════════════════════════════════════
// 11. ANÁLISIS DE CONFUSIÓN (DISTRACTORES RECURRENTES)
// ═══════════════════════════════════════════════════════

export interface PatronConfusion {
    conceptoA: string;
    conceptoB: string;
    frecuencia: number;   // veces que aparecen juntos en correcta vs distractor
    ejemplos: { enunciado: string; año: number }[];
    consejo: string;
}

/**
 * Detecta pares de conceptos que aparecen juntos como
 * respuesta correcta y distractor → indican confusión intencional.
 */
export function analizarConfusion(preguntas: Pregunta[], topN: number = 15): PatronConfusion[] {
    const paresMap = new Map<string, { freq: number; ejemplos: { enunciado: string; año: number }[] }>();

    for (const p of preguntas) {
        if (!p.correcta) continue;
        const textoCorrecta = p.opciones[p.correcta];
        if (!textoCorrecta) continue;

        // Palabras clave de la opción correcta
        const kwCorrecta = normalizar(textoCorrecta)
            .split(' ')
            .filter(w => w.length > 4 && !STOP_WORDS.has(w));

        // Palabras clave de los distractores
        const letrasDistrac = ['A', 'B', 'C', 'D'].filter(l => l !== p.correcta);
        const kwDistractores = new Set<string>();
        for (const l of letrasDistrac) {
            const txt = p.opciones[l];
            if (txt) {
                normalizar(txt).split(' ')
                    .filter(w => w.length > 4 && !STOP_WORDS.has(w))
                    .forEach(w => kwDistractores.add(w));
            }
        }

        // Buscar palabras compartidas (conceptos que confunden)
        for (const kw of kwCorrecta) {
            if (kwDistractores.has(kw)) {
                // Para cada par kw-distractor distinto
                for (const d of kwDistractores) {
                    if (d !== kw && kwCorrecta.includes(d)) continue; // evitar duplicados
                    if (d === kw) {
                        const pairKey = kw; // la misma palabra en ambos lados
                        const entry = paresMap.get(pairKey) || { freq: 0, ejemplos: [] };
                        entry.freq++;
                        if (entry.ejemplos.length < 3) {
                            entry.ejemplos.push({ enunciado: p.enunciado.substring(0, 100), año: p.metadatos.año });
                        }
                        paresMap.set(pairKey, entry);
                    }
                }
            }
        }

        // También buscar conceptos distintos opción correcta vs distractor más similar
        for (const kwC of kwCorrecta) {
            for (const kwD of kwDistractores) {
                if (kwC === kwD) continue;
                // Si comparten raíz (primeras 5 letras iguales) → confusión
                if (kwC.length >= 5 && kwD.length >= 5 && kwC.substring(0, 5) === kwD.substring(0, 5)) {
                    const pairKey = [kwC, kwD].sort().join(' ↔ ');
                    const entry = paresMap.get(pairKey) || { freq: 0, ejemplos: [] };
                    entry.freq++;
                    if (entry.ejemplos.length < 3) {
                        entry.ejemplos.push({ enunciado: p.enunciado.substring(0, 100), año: p.metadatos.año });
                    }
                    paresMap.set(pairKey, entry);
                }
            }
        }
    }

    const patrones: PatronConfusion[] = Array.from(paresMap.entries())
        .filter(([, v]) => v.freq >= 3)
        .sort((a, b) => b[1].freq - a[1].freq)
        .slice(0, topN)
        .map(([par, v]) => {
            const partes = par.split(' ↔ ');
            return {
                conceptoA: partes[0],
                conceptoB: partes[1] || partes[0],
                frecuencia: v.freq,
                ejemplos: v.ejemplos,
                consejo: partes.length > 1
                    ? `Estudiar juntos «${partes[0]}» y «${partes[1]}» — los tribunales los usan como confusores mutuos.`
                    : `El concepto «${partes[0]}» aparece tanto en las opciones correctas como en los distractores — dominar a fondo.`,
            };
        });

    return patrones;
}

// ═══════════════════════════════════════════════════════
// 12. GRAFO DE CO-OCURRENCIA DE CONCEPTOS
// ═══════════════════════════════════════════════════════

export interface NodoConcepto {
    id: string;
    label: string;
    frecuencia: number; // veces que aparece como concepto
}

export interface ArcoConcepto {
    source: string;
    target: string;
    peso: number; // veces que co-ocurren
}

export interface GrafoCoocurrencia {
    nodos: NodoConcepto[];
    arcos: ArcoConcepto[];
}

/**
 * Construye un grafo donde los nodos son conceptos clave
 * y los arcos conectan conceptos que aparecen juntos
 * en la misma pregunta o convocatoria.
 */
export function construirGrafoCoocurrencia(
    preguntas: Pregunta[],
    maxNodos: number = 25
): GrafoCoocurrencia {
    // Extraer conceptos clave de cada pregunta
    const conceptFreq = new Map<string, number>();
    const pregConceptos = new Map<string, string[]>();

    for (const p of preguntas) {
        const palabras = normalizar(p.enunciado)
            .split(' ')
            .filter(w => w.length > 4 && !STOP_WORDS.has(w));

        const conceptos = new Set<string>();
        // Unigramas largos
        for (const w of palabras) {
            if (w.length > 5) conceptos.add(w);
        }
        // Bigramas
        for (let i = 0; i < palabras.length - 1; i++) {
            conceptos.add(`${palabras[i]} ${palabras[i + 1]}`);
        }

        const lista = Array.from(conceptos);
        pregConceptos.set(p.id, lista);
        for (const c of lista) {
            conceptFreq.set(c, (conceptFreq.get(c) || 0) + 1);
        }
    }

    // Seleccionar top N conceptos más frecuentes
    const topConceptos = Array.from(conceptFreq.entries())
        .filter(([, f]) => f >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxNodos);

    const topSet = new Set(topConceptos.map(([c]) => c));

    const nodos: NodoConcepto[] = topConceptos.map(([c, f]) => ({
        id: c,
        label: c,
        frecuencia: f,
    }));

    // Contar co-ocurrencias
    const arcoMap = new Map<string, number>();

    for (const [, conceptos] of pregConceptos) {
        const filtrados = conceptos.filter(c => topSet.has(c));
        for (let i = 0; i < filtrados.length; i++) {
            for (let j = i + 1; j < filtrados.length; j++) {
                const key = [filtrados[i], filtrados[j]].sort().join('|||');
                arcoMap.set(key, (arcoMap.get(key) || 0) + 1);
            }
        }
    }

    const arcos: ArcoConcepto[] = Array.from(arcoMap.entries())
        .filter(([, peso]) => peso >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 60) // top 60 arcos
        .map(([key, peso]) => {
            const [source, target] = key.split('|||');
            return { source, target, peso };
        });

    return { nodos, arcos };
}

// ═══════════════════════════════════════════════════════
// 13. CHI² SEGMENTADO POR CONVOCATORIA
// ═══════════════════════════════════════════════════════

export interface ChiSegmentadoItem {
    ejercicio: string;
    año: number;
    totalPreguntas: number;
    distribucion: Record<string, number>;
    chiSquare: number;
    pValue: number;
    sesgado: boolean;
}

export function calcularChiCuadradoSegmentado(preguntas: Pregunta[]): ChiSegmentadoItem[] {
    const porEjercicio = new Map<string, Pregunta[]>();
    for (const p of preguntas) {
        const ej = p.id.replace(/_\d+$/, '');
        if (!porEjercicio.has(ej)) porEjercicio.set(ej, []);
        porEjercicio.get(ej)!.push(p);
    }

    const resultados: ChiSegmentadoItem[] = [];

    for (const [ejercicio, ps] of porEjercicio) {
        const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
        let total = 0;
        for (const p of ps) {
            if (p.correcta && dist.hasOwnProperty(p.correcta)) {
                dist[p.correcta]++;
                total++;
            }
        }
        if (total < 10) continue; // muestra demasiado pequeña

        const esperado = total / 4;
        let chi2 = 0;
        for (const l of ['A', 'B', 'C', 'D']) {
            chi2 += Math.pow(dist[l] - esperado, 2) / (esperado || 1);
        }
        const pValue = chiSquarePValue(chi2, 3);

        resultados.push({
            ejercicio,
            año: ps[0]?.metadatos.año || 0,
            totalPreguntas: total,
            distribucion: dist,
            chiSquare: chi2,
            pValue,
            sesgado: pValue < 0.05,
        });
    }

    resultados.sort((a, b) => a.año - b.año || a.ejercicio.localeCompare(b.ejercicio));
    return resultados;
}

// ═══════════════════════════════════════════════════════
// 14. ANÁLISIS DE COBERTURA DEL TEMARIO
// ═══════════════════════════════════════════════════════

export interface CoberturaItem {
    nombre: string;
    nivel: 'materia' | 'bloque' | 'tema' | 'aplicacion';
    totalPreguntas: number;
    añosPresente: number[];
    esLaguna: boolean; // solo 1 año o < 3 preguntas
}

export interface CoberturaData {
    items: CoberturaItem[];
    totalElementos: number;
    elementosConLaguna: number;
    coberturaPorcentaje: number; // elementos sin laguna / total
}

export function analizarCobertura(preguntas: Pregunta[]): CoberturaData {
    const mapa = new Map<string, { nivel: CoberturaItem['nivel']; pregs: number; años: Set<number> }>();

    for (const p of preguntas) {
        const mat = p.materia.toString();
        if (mat) {
            const k = `m|${mat}`;
            if (!mapa.has(k)) mapa.set(k, { nivel: 'materia', pregs: 0, años: new Set() });
            const e = mapa.get(k)!; e.pregs++; e.años.add(p.metadatos.año);
        }
        if (p.bloque) {
            const k = `b|${p.bloque}`;
            if (!mapa.has(k)) mapa.set(k, { nivel: 'bloque', pregs: 0, años: new Set() });
            const e = mapa.get(k)!; e.pregs++; e.años.add(p.metadatos.año);
        }
        if (p.tema) {
            const k = `t|${p.tema}`;
            if (!mapa.has(k)) mapa.set(k, { nivel: 'tema', pregs: 0, años: new Set() });
            const e = mapa.get(k)!; e.pregs++; e.años.add(p.metadatos.año);
        }
        if (p.aplicacion) {
            const k = `a|${p.aplicacion}`;
            if (!mapa.has(k)) mapa.set(k, { nivel: 'aplicacion', pregs: 0, años: new Set() });
            const e = mapa.get(k)!; e.pregs++; e.años.add(p.metadatos.año);
        }
    }

    const items: CoberturaItem[] = [];
    for (const [key, data] of mapa) {
        const nombre = key.substring(2);
        const añosArr = Array.from(data.años).filter(a => a > 0).sort((a, b) => a - b);
        const esLaguna = añosArr.length <= 1 || data.pregs < 3;
        items.push({
            nombre,
            nivel: data.nivel,
            totalPreguntas: data.pregs,
            añosPresente: añosArr,
            esLaguna,
        });
    }

    items.sort((a, b) => {
        const nivelOrden = { materia: 0, bloque: 1, tema: 2, aplicacion: 3 };
        return nivelOrden[a.nivel] - nivelOrden[b.nivel] || b.totalPreguntas - a.totalPreguntas;
    });

    const totalElementos = items.length;
    const elementosConLaguna = items.filter(i => i.esLaguna).length;
    const coberturaPorcentaje = totalElementos > 0
        ? Math.round(((totalElementos - elementosConLaguna) / totalElementos) * 100)
        : 0;

    return { items, totalElementos, elementosConLaguna, coberturaPorcentaje };
}

// ═══════════════════════════════════════════════════════
// 15. CORRELACIÓN ENTRE MATERIAS (MATRIZ)
// ═══════════════════════════════════════════════════════

export interface CorrelacionMatriz {
    etiquetas: string[];
    valores: number[][]; // matriz simétrica de coeficientes de Pearson
}

export function calcularCorrelacionMaterias(
    preguntas: Pregunta[],
    campo: 'bloque' | 'tema' | 'aplicacion' = 'bloque'
): CorrelacionMatriz {
    // Agrupar por convocatoria
    const porConvo = new Map<string, Pregunta[]>();
    for (const p of preguntas) {
        const ej = p.id.replace(/_\d+$/, '');
        if (!porConvo.has(ej)) porConvo.set(ej, []);
        porConvo.get(ej)!.push(p);
    }

    // Obtener todas las categorías
    const catsSet = new Set<string>();
    for (const p of preguntas) {
        let cat = '';
        if (campo === 'bloque') cat = p.bloque || '';
        if (campo === 'tema') cat = p.tema || '';
        if (campo === 'aplicacion') cat = p.aplicacion || '';
        if (cat) catsSet.add(cat);
    }
    const etiquetas = Array.from(catsSet).sort();
    if (etiquetas.length < 2) return { etiquetas, valores: [] };

    // Construir vectores: para cada convocatoria, contar preguntas por categoría
    const convos = Array.from(porConvo.keys());
    const vectores: Record<string, number[]> = {};
    for (const cat of etiquetas) {
        vectores[cat] = convos.map(ej => {
            const ps = porConvo.get(ej)!;
            return ps.filter(p => {
                let val = '';
                if (campo === 'bloque') val = p.bloque || '';
                if (campo === 'tema') val = p.tema || '';
                if (campo === 'aplicacion') val = p.aplicacion || '';
                return val === cat;
            }).length;
        });
    }

    // Calcular correlación de Pearson entre cada par
    const n = convos.length;
    const valores: number[][] = [];
    for (let i = 0; i < etiquetas.length; i++) {
        const fila: number[] = [];
        for (let j = 0; j < etiquetas.length; j++) {
            if (i === j) { fila.push(1); continue; }
            const x = vectores[etiquetas[i]];
            const y = vectores[etiquetas[j]];
            const meanX = x.reduce((a, b) => a + b, 0) / n;
            const meanY = y.reduce((a, b) => a + b, 0) / n;
            let num = 0, denX = 0, denY = 0;
            for (let k = 0; k < n; k++) {
                const dx = x[k] - meanX;
                const dy = y[k] - meanY;
                num += dx * dy;
                denX += dx * dx;
                denY += dy * dy;
            }
            const den = Math.sqrt(denX * denY);
            fila.push(den > 0 ? Math.round((num / den) * 100) / 100 : 0);
        }
        valores.push(fila);
    }

    return { etiquetas, valores };
}

// ═══════════════════════════════════════════════════════
// 16. DIFICULTAD CRUZADA POR TEMA / BLOQUE
// ═══════════════════════════════════════════════════════

export interface DificultadPorCategoria {
    categoria: string;
    campo: string;
    dificultadMedia: number;      // 0-100
    totalPreguntas: number;
    tasaAnulacion: number;        // 0-1
    complejidadMedia: number;     // vocabulario
    similitudDistractoresMedia: number;
}

/**
 * Calcula la dificultad media agrupada por categoría (materia, bloque, tema o aplicación).
 * Permite identificar qué temas son objetivamente más difíciles.
 */
export function dificultadPorCategoria(
    preguntas: Pregunta[],
    campo: 'materia' | 'bloque' | 'tema' | 'aplicacion' = 'bloque'
): DificultadPorCategoria[] {
    if (preguntas.length === 0) return [];

    const difs = calcularDificultad(preguntas);
    const difMap = new Map<string, DificultadPregunta>();
    for (const d of difs) difMap.set(d.pregunta.id, d);

    const grupos = new Map<string, { scores: number[]; comps: number[]; sims: number[]; anuladas: number; total: number }>();

    for (const p of preguntas) {
        let cat = '(vacío)';
        if (campo === 'materia') cat = p.materia?.toString() || '(vacío)';
        if (campo === 'bloque') cat = p.bloque || '(vacío)';
        if (campo === 'tema') cat = p.tema || '(vacío)';
        if (campo === 'aplicacion') cat = p.aplicacion || '(vacío)';

        if (!grupos.has(cat)) grupos.set(cat, { scores: [], comps: [], sims: [], anuladas: 0, total: 0 });
        const g = grupos.get(cat)!;
        const dif = difMap.get(p.id);
        if (dif) {
            g.scores.push(dif.score);
            g.comps.push(dif.factores.complejidadVocabulario);
            g.sims.push(dif.factores.similitudDistractores);
        }
        if (p.anulada) g.anuladas++;
        g.total++;
    }

    const resultado: DificultadPorCategoria[] = [];
    for (const [cat, g] of grupos) {
        if (g.total < 2) continue;
        const media = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        resultado.push({
            categoria: cat,
            campo,
            dificultadMedia: Math.round(media(g.scores)),
            totalPreguntas: g.total,
            tasaAnulacion: g.anuladas / g.total,
            complejidadMedia: Math.round(media(g.comps)),
            similitudDistractoresMedia: Math.round(media(g.sims)),
        });
    }

    resultado.sort((a, b) => b.dificultadMedia - a.dificultadMedia);
    return resultado;
}

// ═══════════════════════════════════════════════════════
// 17. SIMULADOR DE PUNTUACIÓN ESPERADA
// ═══════════════════════════════════════════════════════

export interface SimulacionPuntuacion {
    bloquesDominados: string[];
    bloquesNoDominados: string[];
    preguntasEsperadas: number;
    aciertosEstimados: number;
    fallosEstimados: number;
    blancosEstimados: number;
    puntuacionBruta: number;       // antes de penalización
    puntuacionNeta: number;        // con penalización -0.33 por fallo
    porcentajeAcierto: number;
    desglose: { bloque: string; preguntas: number; peso: number; dominado: boolean }[];
}

/**
 * Simula la puntuación esperada dado un plan de estudio:
 * - Bloques dominados: se asume 85% de acierto, 10% en blanco, 5% de fallo.
 * - Bloques no dominados: se asume 25% de acierto (azar), 40% en blanco, 35% de fallo.
 * - Penalización estándar: -1/(n-1) por respuesta incorrecta (n=4 → -0.333).
 */
export function simularPuntuacion(
    preguntas: Pregunta[],
    bloquesDominados: string[],
    campo: 'materia' | 'bloque' | 'tema' | 'aplicacion' = 'bloque'
): SimulacionPuntuacion {
    const dominadosSet = new Set(bloquesDominados.map(b => b.toLowerCase()));

    // Contar preguntas por categoría
    const porCat = new Map<string, number>();
    for (const p of preguntas) {
        let cat = '';
        if (campo === 'materia') cat = p.materia?.toString().toLowerCase() || '';
        if (campo === 'bloque') cat = p.bloque?.toLowerCase() || '';
        if (campo === 'tema') cat = p.tema?.toLowerCase() || '';
        if (campo === 'aplicacion') cat = p.aplicacion?.toLowerCase() || '';
        porCat.set(cat, (porCat.get(cat) || 0) + 1);
    }

    const totalPreg = preguntas.length;
    const desglose: SimulacionPuntuacion['desglose'] = [];
    let totalAciertos = 0, totalFallos = 0, totalBlancos = 0;

    for (const [cat, count] of porCat) {
        const dominado = dominadosSet.has(cat);
        const peso = totalPreg > 0 ? count / totalPreg : 0;

        let aciertos: number, fallos: number, blancos: number;
        if (dominado) {
            aciertos = Math.round(count * 0.85);
            blancos = Math.round(count * 0.10);
            fallos = count - aciertos - blancos;
        } else {
            aciertos = Math.round(count * 0.25);
            blancos = Math.round(count * 0.40);
            fallos = count - aciertos - blancos;
        }

        totalAciertos += aciertos;
        totalFallos += fallos;
        totalBlancos += blancos;

        desglose.push({ bloque: cat, preguntas: count, peso: Math.round(peso * 100), dominado });
    }

    const penalizacion = 1 / 3; // 4 opciones → -1/3 por fallo
    const puntuacionBruta = totalAciertos;
    const puntuacionNeta = totalAciertos - totalFallos * penalizacion;

    const bloquesNoDominados = Array.from(porCat.keys()).filter(c => !dominadosSet.has(c));

    return {
        bloquesDominados,
        bloquesNoDominados,
        preguntasEsperadas: totalPreg,
        aciertosEstimados: totalAciertos,
        fallosEstimados: totalFallos,
        blancosEstimados: totalBlancos,
        puntuacionBruta,
        puntuacionNeta: Math.round(puntuacionNeta * 100) / 100,
        porcentajeAcierto: totalPreg > 0 ? Math.round((totalAciertos / totalPreg) * 1000) / 10 : 0,
        desglose: desglose.sort((a, b) => b.preguntas - a.preguntas),
    };
}

// ═══════════════════════════════════════════════════════
// 18. PATRONES POR ORGANISMO / ESCALA
// ═══════════════════════════════════════════════════════

export interface PatronOrganismoEscala {
    clave: string;             // «INAP – ADV» o «AGE – AUX»
    organismo: string;
    escala: string;
    totalPreguntas: number;
    totalEjercicios: number;
    distribucionBloques: Record<string, number>;
    distribucionCorrecta: Record<string, number>;
    tasaAnulacion: number;
    añosPresentados: number[];
    tendenciaBloques: string;  // bloque con más peso
}

/**
 * Analiza cómo varía el «estilo» de los exámenes según organismo y escala:
 * ¿El INAP pregunta diferente que una comunidad autónoma?
 * ¿Los auxiliares tienen patrones distintos a los administrativos?
 */
export function analizarPatronesOrganismoEscala(preguntas: Pregunta[]): PatronOrganismoEscala[] {
    const grupos = new Map<string, Pregunta[]>();

    for (const p of preguntas) {
        const org = p.metadatos.organismo || '(desconocido)';
        const esc = p.metadatos.escala || '(desconocida)';
        const clave = `${org} – ${esc}`;
        if (!grupos.has(clave)) grupos.set(clave, []);
        grupos.get(clave)!.push(p);
    }

    const resultado: PatronOrganismoEscala[] = [];

    for (const [clave, ps] of grupos) {
        if (ps.length < 5) continue;

        const [org, esc] = clave.split(' – ');
        const bloques: Record<string, number> = {};
        const distCorrecta: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
        let anuladas = 0;
        const ejercicioSet = new Set<string>();
        const añosSet = new Set<number>();

        for (const p of ps) {
            const blq = p.bloque || '(vacío)';
            bloques[blq] = (bloques[blq] || 0) + 1;
            if (p.correcta && distCorrecta.hasOwnProperty(p.correcta)) {
                distCorrecta[p.correcta]++;
            }
            if (p.anulada) anuladas++;
            ejercicioSet.add(p.id.replace(/_\d+$/, ''));
            añosSet.add(p.metadatos.año);
        }

        // Detectar bloque con más peso
        const bloquesOrd = Object.entries(bloques).sort((a, b) => b[1] - a[1]);
        const tendenciaBloques = bloquesOrd.length > 0 ? bloquesOrd[0][0] : '';

        resultado.push({
            clave,
            organismo: org,
            escala: esc,
            totalPreguntas: ps.length,
            totalEjercicios: ejercicioSet.size,
            distribucionBloques: bloques,
            distribucionCorrecta: distCorrecta,
            tasaAnulacion: ps.length > 0 ? anuladas / ps.length : 0,
            añosPresentados: Array.from(añosSet).sort((a, b) => a - b),
            tendenciaBloques,
        });
    }

    resultado.sort((a, b) => b.totalPreguntas - a.totalPreguntas);
    return resultado;
}

// ═══════════════════════════════════════════════════════
// 19. POSICIÓN VS. CORRECTA / DIFICULTAD
// ═══════════════════════════════════════════════════════

export interface PuntoPosicion {
    posicion: number;          // número de pregunta en el ejercicio (1, 2, 3…)
    letraCorrecta: string;
    dificultad: number;
}

export interface AnalisisPosicion {
    puntos: PuntoPosicion[];
    mediaDificultadPorTercio: [number, number, number]; // primer, segundo, último tercio
    distribucionPorPosicion: Record<string, Record<string, number>>; // tercio → {A, B, C, D}
    tendenciaDificultad: 'creciente' | 'estable' | 'decreciente';
}

/**
 * Analiza la relación entre la posición de la pregunta en el examen,
 * la letra correcta y la dificultad estimada.
 */
export function analizarPosicion(preguntas: Pregunta[]): AnalisisPosicion {
    const difs = calcularDificultad(preguntas);
    const difMap = new Map<string, number>();
    for (const d of difs) difMap.set(d.pregunta.id, d.score);

    const puntos: PuntoPosicion[] = [];
    for (const p of preguntas) {
        if (!p.numero_original || !p.correcta) continue;
        puntos.push({
            posicion: p.numero_original,
            letraCorrecta: p.correcta,
            dificultad: difMap.get(p.id) || 0,
        });
    }

    puntos.sort((a, b) => a.posicion - b.posicion);

    // Dividir en tercios
    const maxPos = Math.max(...puntos.map(p => p.posicion), 1);
    const tercio1 = Math.ceil(maxPos / 3);
    const tercio2 = Math.ceil(maxPos * 2 / 3);

    const tercios: [PuntoPosicion[], PuntoPosicion[], PuntoPosicion[]] = [[], [], []];
    for (const p of puntos) {
        if (p.posicion <= tercio1) tercios[0].push(p);
        else if (p.posicion <= tercio2) tercios[1].push(p);
        else tercios[2].push(p);
    }

    const media = (arr: PuntoPosicion[]) => arr.length > 0 ? arr.reduce((s, p) => s + p.dificultad, 0) / arr.length : 0;
    const mediaDificultadPorTercio: [number, number, number] = [
        Math.round(media(tercios[0])),
        Math.round(media(tercios[1])),
        Math.round(media(tercios[2])),
    ];

    // Distribución de letras por tercio
    const distribucionPorPosicion: Record<string, Record<string, number>> = {};
    const labels = ['Primer tercio', 'Segundo tercio', 'Último tercio'];
    for (let t = 0; t < 3; t++) {
        const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
        for (const p of tercios[t]) {
            if (dist.hasOwnProperty(p.letraCorrecta)) dist[p.letraCorrecta]++;
        }
        distribucionPorPosicion[labels[t]] = dist;
    }

    // Tendencia de dificultad
    let tendencia: 'creciente' | 'estable' | 'decreciente' = 'estable';
    if (mediaDificultadPorTercio[2] > mediaDificultadPorTercio[0] * 1.15) tendencia = 'creciente';
    else if (mediaDificultadPorTercio[0] > mediaDificultadPorTercio[2] * 1.15) tendencia = 'decreciente';

    return { puntos, mediaDificultadPorTercio, distribucionPorPosicion, tendenciaDificultad: tendencia };
}

// ═══════════════════════════════════════════════════════
// 20. VOCABULARIO TÉCNICO EMERGENTE
// ═══════════════════════════════════════════════════════

export interface TerminoEmergente {
    termino: string;
    primeraAparicion: number;    // año
    frecuenciaReciente: number;  // ocurrencias en los últimos 2 años
    frecuenciaTotal: number;
    esNuevo: boolean;            // apareció por primera vez recientemente
    añosPresente: number[];
    ejemploEnunciado: string;
}

/**
 * Detecta términos técnicos que han aparecido por primera vez en convocatorias
 * recientes o cuya frecuencia ha crecido significativamente.
 * Estos son candidatos probables para futuras convocatorias.
 */
export function detectarVocabularioEmergente(
    preguntas: Pregunta[],
    topN: number = 25
): TerminoEmergente[] {
    if (preguntas.length === 0) return [];

    const todosAños = Array.from(new Set(preguntas.map(p => p.metadatos.año))).sort((a, b) => a - b);
    if (todosAños.length < 2) return [];
    const maxAño = todosAños[todosAños.length - 1];
    const umbralReciente = maxAño - 1; // últimos 2 años

    // Extraer bigramas y su distribución temporal
    const terminoMap = new Map<string, {
        años: Map<number, number>;
        total: number;
        ejemplo: string;
    }>();

    for (const p of preguntas) {
        const palabras = normalizar(p.enunciado)
            .split(' ')
            .filter(w => w.length > 4 && !STOP_WORDS.has(w));

        const vistos = new Set<string>();
        // Bigramas
        for (let i = 0; i < palabras.length - 1; i++) {
            const bg = `${palabras[i]} ${palabras[i + 1]}`;
            if (vistos.has(bg)) continue;
            vistos.add(bg);

            if (!terminoMap.has(bg)) {
                terminoMap.set(bg, { años: new Map(), total: 0, ejemplo: p.enunciado.substring(0, 120) });
            }
            const entry = terminoMap.get(bg)!;
            entry.años.set(p.metadatos.año, (entry.años.get(p.metadatos.año) || 0) + 1);
            entry.total++;
        }

        // Unigramas técnicos largos (> 7 chars)
        for (const w of palabras) {
            if (w.length > 7 && !vistos.has(w)) {
                vistos.add(w);
                if (!terminoMap.has(w)) {
                    terminoMap.set(w, { años: new Map(), total: 0, ejemplo: p.enunciado.substring(0, 120) });
                }
                const entry = terminoMap.get(w)!;
                entry.años.set(p.metadatos.año, (entry.años.get(p.metadatos.año) || 0) + 1);
                entry.total++;
            }
        }
    }

    // Identificar emergentes: nuevos o con frecuencia reciente alta
    const candidatos: TerminoEmergente[] = [];

    for (const [termino, data] of terminoMap) {
        if (data.total < 2) continue;

        const añosPresente = Array.from(data.años.keys()).sort((a, b) => a - b);
        const primeraAparicion = añosPresente[0];
        const frecuenciaReciente = Array.from(data.años.entries())
            .filter(([año]) => año >= umbralReciente)
            .reduce((sum, [, count]) => sum + count, 0);

        const frecuenciaAntigua = data.total - frecuenciaReciente;
        const esNuevo = primeraAparicion >= umbralReciente;
        const esCreciente = frecuenciaReciente > frecuenciaAntigua * 0.8 && frecuenciaReciente >= 2;

        if (esNuevo || esCreciente) {
            candidatos.push({
                termino,
                primeraAparicion,
                frecuenciaReciente,
                frecuenciaTotal: data.total,
                esNuevo,
                añosPresente,
                ejemploEnunciado: data.ejemplo,
            });
        }
    }

    // Ordenar: nuevos primero, luego por frecuencia reciente
    candidatos.sort((a, b) => {
        if (a.esNuevo !== b.esNuevo) return a.esNuevo ? -1 : 1;
        return b.frecuenciaReciente - a.frecuenciaReciente;
    });

    return candidatos.slice(0, topN);
}
