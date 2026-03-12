import type { Pregunta } from '../types';

/**
 * Normaliza un texto para comparación:
 * minúsculas, sin tildes, sin puntuación, sin espacios múltiples.
 */
export function normalizar(texto: string): string {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // quitar diacríticos
        .replace(/[^\w\s]/g, ' ')          // puntuación → espacio
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Similitud Jaccard entre dos conjuntos de palabras (0 a 1).
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 && b.size === 0) return 1;
    let intersection = 0;
    for (const w of a) {
        if (b.has(w)) intersection++;
    }
    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

function palabras(texto: string): Set<string> {
    return new Set(normalizar(texto).split(' ').filter(w => w.length > 2));
}

export interface GrupoDuplicados {
    tipo: 'exacto' | 'similar';
    similitud: number;           // 1.0 para exactos
    preguntas: Pregunta[];
    textoRepresentativo: string; // enunciado del primer elemento
}

// ═══════════════════════════════════════════════════════
// MinHash + LSH para acelerar la detección de similares
// ═══════════════════════════════════════════════════════

const NUM_HASHES = 100;  // Firmas de MinHash
const NUM_BANDAS = 20;   // Bandas para LSH (100/20 = 5 filas por banda)
const FILAS_POR_BANDA = NUM_HASHES / NUM_BANDAS;

// Genera coeficientes pseudo-aleatorios estables para las funciones hash
const A_COEFS: number[] = [];
const B_COEFS: number[] = [];
const PRIMO = 2147483647; // 2^31 - 1

function initCoefs() {
    if (A_COEFS.length > 0) return;
    // Semilla fija para resultados reproducibles
    let seed = 42;
    const nextRand = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed;
    };
    for (let i = 0; i < NUM_HASHES; i++) {
        A_COEFS.push(nextRand() % PRIMO);
        B_COEFS.push(nextRand() % PRIMO);
    }
}

/**
 * Calcula la firma MinHash de un conjunto de palabras.
 * Cada hash simula una permutación aleatoria del universo de shingles.
 */
function minHashSignature(wordSet: Set<string>): Uint32Array {
    initCoefs();
    const sig = new Uint32Array(NUM_HASHES).fill(0xFFFFFFFF);

    for (const word of wordSet) {
        // Hash base de la palabra (FNV-1a simplificado)
        let h = 2166136261;
        for (let i = 0; i < word.length; i++) {
            h ^= word.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }

        for (let i = 0; i < NUM_HASHES; i++) {
            const hashVal = ((Math.imul(A_COEFS[i], h) + B_COEFS[i]) % PRIMO) >>> 0;
            if (hashVal < sig[i]) {
                sig[i] = hashVal;
            }
        }
    }

    return sig;
}

/**
 * Agrupa candidatos por LSH: Dos documentos son candidatos si coinciden
 * en todas las filas de al menos una banda.
 */
function lshCandidates(
    signatures: Map<string, Uint32Array>
): Map<string, Set<string>> {
    // Para cada banda, generamos un hash de banda y agrupamos documentos
    const candidates = new Map<string, Set<string>>();

    // Buckets por banda
    for (let b = 0; b < NUM_BANDAS; b++) {
        const start = b * FILAS_POR_BANDA;
        const buckets = new Map<string, string[]>();

        for (const [id, sig] of signatures) {
            // Hash de la banda: concatenar los valores de las filas
            let bandHash = '';
            for (let r = start; r < start + FILAS_POR_BANDA; r++) {
                bandHash += sig[r].toString(36) + '|';
            }

            if (!buckets.has(bandHash)) {
                buckets.set(bandHash, []);
            }
            buckets.get(bandHash)!.push(id);
        }

        // Los documentos en el mismo bucket son candidatos
        for (const [, ids] of buckets) {
            if (ids.length > 1) {
                for (let i = 0; i < ids.length; i++) {
                    if (!candidates.has(ids[i])) {
                        candidates.set(ids[i], new Set());
                    }
                    for (let j = i + 1; j < ids.length; j++) {
                        candidates.get(ids[i])!.add(ids[j]);
                        if (!candidates.has(ids[j])) {
                            candidates.set(ids[j], new Set());
                        }
                        candidates.get(ids[j])!.add(ids[i]);
                    }
                }
            }
        }
    }

    return candidates;
}


/**
 * Agrupa preguntas duplicadas (exactas) y similares (Jaccard ≥ umbral).
 * Devuelve solo los grupos con > 1 pregunta.
 *
 * Optimizado con MinHash + LSH para escalar a +5 000 preguntas
 * sin comparaciones O(n²) exhaustivas.
 */
export function detectarDuplicados(
    preguntas: Pregunta[],
    umbralSimilar: number = 0.6
): GrupoDuplicados[] {
    // PASO 1 — Duplicados exactos (O(n) con hash map)
    const mapExactos = new Map<string, Pregunta[]>();
    const wordCache = new Map<string, Set<string>>();

    for (const p of preguntas) {
        const textoCompleto = [
            p.enunciado,
            ...Object.values(p.opciones).filter(Boolean),
        ].join(' ');
        const norm = normalizar(p.enunciado);
        wordCache.set(p.id, palabras(textoCompleto));

        if (!mapExactos.has(norm)) {
            mapExactos.set(norm, []);
        }
        mapExactos.get(norm)!.push(p);
    }

    const gruposExactos: GrupoDuplicados[] = [];
    const yaAgrupados = new Set<string>();

    for (const [, grupo] of mapExactos) {
        if (grupo.length > 1) {
            gruposExactos.push({
                tipo: 'exacto',
                similitud: 1.0,
                preguntas: grupo,
                textoRepresentativo: grupo[0].enunciado,
            });
            grupo.forEach(p => yaAgrupados.add(p.id));
        }
    }

    // PASO 2 — Similares con MinHash + LSH
    const restantes = preguntas.filter(p => !yaAgrupados.has(p.id));

    // Si hay pocos restantes, usar el algoritmo directo (más rápido para n pequeño)
    if (restantes.length < 200) {
        return [
            ...gruposExactos.sort((a, b) => b.preguntas.length - a.preguntas.length),
            ...detectarSimilaresDirecto(restantes, wordCache, umbralSimilar),
        ];
    }

    // Calcular firmas MinHash
    const signatures = new Map<string, Uint32Array>();
    for (const p of restantes) {
        const words = wordCache.get(p.id)!;
        signatures.set(p.id, minHashSignature(words));
    }

    // Obtener candidatos por LSH
    const candidates = lshCandidates(signatures);

    // Verificar candidatos con Jaccard real
    const gruposSimilares: GrupoDuplicados[] = [];
    const yaSimilar = new Set<string>();
    const restantesMap = new Map<string, Pregunta>();
    for (const p of restantes) {
        restantesMap.set(p.id, p);
    }

    for (const p of restantes) {
        if (yaSimilar.has(p.id)) continue;

        const candidateIds = candidates.get(p.id);
        if (!candidateIds || candidateIds.size === 0) continue;

        const wordsI = wordCache.get(p.id)!;
        const cluster: Pregunta[] = [p];
        let sumSim = 0;
        let countSim = 0;

        for (const candId of candidateIds) {
            if (yaSimilar.has(candId)) continue;

            const wordsJ = wordCache.get(candId)!;
            const sim = jaccardSimilarity(wordsI, wordsJ);

            if (sim >= umbralSimilar) {
                cluster.push(restantesMap.get(candId)!);
                sumSim += sim;
                countSim++;
                yaSimilar.add(candId);
            }
        }

        if (cluster.length > 1) {
            yaSimilar.add(p.id);
            gruposSimilares.push({
                tipo: 'similar',
                similitud: countSim > 0 ? sumSim / countSim : 0,
                preguntas: cluster,
                textoRepresentativo: cluster[0].enunciado,
            });
        }
    }

    const todos = [
        ...gruposExactos.sort((a, b) => b.preguntas.length - a.preguntas.length),
        ...gruposSimilares.sort((a, b) => b.similitud - a.similitud),
    ];

    return todos;
}

/**
 * Algoritmo directo O(n²) para conjuntos pequeños (< 200 preguntas).
 */
function detectarSimilaresDirecto(
    restantes: Pregunta[],
    wordCache: Map<string, Set<string>>,
    umbralSimilar: number
): GrupoDuplicados[] {
    const gruposSimilares: GrupoDuplicados[] = [];
    const yaSimilar = new Set<string>();

    for (let i = 0; i < restantes.length; i++) {
        if (yaSimilar.has(restantes[i].id)) continue;

        const wordsI = wordCache.get(restantes[i].id)!;
        const cluster: Pregunta[] = [restantes[i]];
        let sumSim = 0;
        let countSim = 0;

        for (let j = i + 1; j < restantes.length; j++) {
            if (yaSimilar.has(restantes[j].id)) continue;

            const wordsJ = wordCache.get(restantes[j].id)!;
            const sim = jaccardSimilarity(wordsI, wordsJ);

            if (sim >= umbralSimilar) {
                cluster.push(restantes[j]);
                sumSim += sim;
                countSim++;
                yaSimilar.add(restantes[j].id);
            }
        }

        if (cluster.length > 1) {
            yaSimilar.add(restantes[i].id);
            gruposSimilares.push({
                tipo: 'similar',
                similitud: countSim > 0 ? sumSim / countSim : 0,
                preguntas: cluster,
                textoRepresentativo: cluster[0].enunciado,
            });
        }
    }

    return gruposSimilares.sort((a, b) => b.similitud - a.similitud);
}
