import type { Pregunta } from '../types';

export interface Insight {
    tipo: 'sesgo' | 'tendencia' | 'correlacion' | 'dificultad' | 'prioridad';
    icono: string;
    titulo: string;
    descripcion: string;
    detalles: string[];
}

/**
 * Calcula la bondad de ajuste mediante Chi-Cuadrado (χ²) 
 * para comprobar si hay un sesgo real en las respuestas correctas.
 */
export const calcularChiCuadradoOpciones = (preguntas: Pregunta[]): Insight | null => {
    const conteo = { A: 0, B: 0, C: 0, D: 0 };
    let totalComprobables = 0;

    preguntas.forEach(p => {
        if (p.correcta && (p.correcta === 'A' || p.correcta === 'B' || p.correcta === 'C' || p.correcta === 'D')) {
            conteo[p.correcta]++;
            totalComprobables++;
        }
    });

    if (totalComprobables < 20) return null; // Muestra insuficiente para Chi-Cuadrado

    const esperado = totalComprobables / 4;
    let chiCuadrado = 0;

    Object.values(conteo).forEach(obs => {
        chiCuadrado += Math.pow(obs - esperado, 2) / esperado;
    });

    // Para 3 grados de libertad (4 opciones - 1), un chi-cuadrado > 7.815 equivale a p < 0.05
    if (chiCuadrado > 7.815) {
        const ordenadas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
        const max = ordenadas[0];
        const min = ordenadas[3];

        return {
            tipo: 'sesgo',
            icono: 'dice',
            titulo: 'Sesgo estadístico detectado en opciones',
            descripcion: `El tribunal tiene una preferencia por la opción ${max[0]} (p < 0.05).`,
            detalles: [
                `La opción ${max[0]} aparece el ${((max[1] / totalComprobables) * 100).toFixed(1)}% del tiempo.`,
                `La opción ${min[0]} es la menos probable (${((min[1] / totalComprobables) * 100).toFixed(1)}%).`
            ]
        };
    }

    return {
        tipo: 'sesgo',
        icono: 'balance',
        titulo: 'Distribución equilibrada',
        descripcion: 'No se detecta sesgo hacia ninguna letra específica en este contexto.',
        detalles: [
            `La muestra no supera el umbral de significancia estadística (Chi-Cuadrado: ${chiCuadrado.toFixed(2)}).`
        ]
    };
};

/**
 * Realiza una regresión lineal simple sobre las frecuencias de materias por año 
 * para determinar la pendiente o tendencia.
 */
export const calcularTendenciaMaterias = (preguntas: Pregunta[]): Insight[] => {
    if (preguntas.length < 10) return [];

    // Agrupar por materia y luego por año
    const historicoMateria: Record<string, Record<number, number>> = {};
    const añosSet = new Set<number>();

    preguntas.forEach(p => {
        const materia = p.materia.toString();
        const año = p.metadatos.año;

        if (año === 0) return; // Saltar preguntas sin año

        if (!historicoMateria[materia]) historicoMateria[materia] = {};
        historicoMateria[materia][año] = (historicoMateria[materia][año] || 0) + 1;
        añosSet.add(año);
    });

    const años = Array.from(añosSet).sort((a, b) => a - b);
    if (años.length < 2) return [];

    const tendencias: { materia: string, pendiente: number, volumenTotal: number }[] = [];

    Object.keys(historicoMateria).forEach(materia => {
        // Para simplificar la regresión x = índice de año (0, 1, 2...), y = frecuencia
        const datos = años.map((año, index) => ({
            x: index,
            y: historicoMateria[materia][año] || 0
        }));

        const n = datos.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

        datos.forEach(d => {
            sumX += d.x;
            sumY += d.y;
            sumXY += d.x * d.y;
            sumXX += d.x * d.x;
        });

        const denominador = (n * sumXX) - (sumX * sumX);
        if (denominador === 0) return;

        const pendiente = ((n * sumXY) - (sumX * sumY)) / denominador;

        tendencias.push({
            materia,
            pendiente: parseFloat(pendiente.toFixed(2)),
            volumenTotal: sumY
        });
    });

    // Filtrar significativas
    const enAlza = tendencias.filter(t => t.pendiente > 0.5).sort((a, b) => b.pendiente - a.pendiente);
    const aLaBaja = tendencias.filter(t => t.pendiente < -0.5).sort((a, b) => a.pendiente - b.pendiente);

    const insights: Insight[] = [];

    if (enAlza.length > 0) {
        insights.push({
            tipo: 'tendencia',
            icono: 'trending-up',
            titulo: 'Materias en auge',
            descripcion: 'Estos tópicos han aumentado sistemáticamente en las últimas convocatorias.',
            detalles: enAlza.slice(0, 3).map(t => `${t.materia.charAt(0).toUpperCase() + t.materia.slice(1)} (Pendiente: +${t.pendiente})`)
        });
    }

    if (aLaBaja.length > 0) {
        insights.push({
            tipo: 'tendencia',
            icono: 'trending-down',
            titulo: 'Materias a la baja',
            descripcion: 'Estas áreas están perdiendo peso específico en los exámenes recientes.',
            detalles: aLaBaja.slice(0, 3).map(t => `${t.materia.charAt(0).toUpperCase() + t.materia.slice(1)} (Pendiente: ${t.pendiente})`)
        });
    }

    return insights;
};

/**
 * Consolidador maestro de insights
 */
export const generarInsights = (preguntas: Pregunta[]): Insight[] => {
    if (!preguntas || preguntas.length === 0) return [];

    const insights: Insight[] = [];

    // 1. Dificultad general por anulación
    const anuladas = preguntas.filter(p => p.anulada).length;
    const tasaAnulacion = (anuladas / preguntas.length) * 100;

    if (tasaAnulacion > 2) {
        // Calcular qué bloques concentran más anulaciones
        const anuladasPorBloque: Record<string, number> = {};
        preguntas.filter(p => p.anulada).forEach(p => {
            const blq = p.bloque || '(sin bloque)';
            anuladasPorBloque[blq] = (anuladasPorBloque[blq] || 0) + 1;
        });
        const bloquesOrden = Object.entries(anuladasPorBloque).sort((a, b) => b[1] - a[1]);
        const detallesBloque = bloquesOrden.slice(0, 3).map(([b, c]) => `${b}: ${c} anulada${c > 1 ? 's' : ''}`);

        insights.push({
            tipo: 'dificultad',
            icono: 'warning',
            titulo: 'Alta Tasa de Contención',
            descripcion: `El ${tasaAnulacion.toFixed(1)}% de las preguntas han sido anuladas (${anuladas} de ${preguntas.length}).`,
            detalles: detallesBloque
        });
    }

    // 2. Sesgo de opciones con Chi Cuadrado
    const sesgoInsight = calcularChiCuadradoOpciones(preguntas);
    if (sesgoInsight) insights.push(sesgoInsight);

    // 3. Tendencias por regresión
    const tendencias = calcularTendenciaMaterias(preguntas);
    insights.push(...tendencias);

    return insights;
};
