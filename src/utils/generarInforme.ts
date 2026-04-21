import type { Pregunta } from '../types';
import { calcularChiCuadrado, analizarCobertura, predecirTemas, calcularDificultad, calcularChiCuadradoSegmentado } from './analytics';
import { detectarDuplicados } from './similarity';
import { generarInsights } from './estadisticas';

/**
 * Genera un informe analítico completo del dataset en formato Markdown.
 */
export function generarInformeMarkdown(preguntas: Pregunta[], nombreDataset: string): string {
    const ahora = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const lines: string[] = [];
    const line = (s: string) => lines.push(s);

    line(`# Informe de Análisis — ${nombreDataset}`);
    line(`\n*Generado el ${ahora}*\n`);

    // ——— Helpers reutilizables ———
    const ejercicioDe = (p: Pregunta) => p.id.split('_').slice(0, -1).join('_') || '(sin ejercicio)';
    const fmtEscala = (v: string) => ({ AUX: 'Auxiliar', ADV: 'Administrativo', PSX: 'Servicios Grales.' } as Record<string, string>)[v] || v || '—';
    const fmtAcceso = (v: string) => ({ LI: 'Libre', PI: 'Prom. int.', PC: 'Prom. cruz.' } as Record<string, string>)[v] || v || '—';
    const fmtTipo = (v: string) => ({ PRI: 'Primero', SEG: 'Segundo', UNI: 'Único' } as Record<string, string>)[v] || v || '—';
    const limpiarAplicacion = (a?: string) => a ? a.replace(/\s*\b\d+.*$/i, '').trim() : '';
    const total = preguntas.length;
    const pct = (n: number) => total > 0 ? (n / total * 100).toFixed(1) : '0.0';

    // ——————— RESUMEN GENERAL ———————
    line(`## Resumen general\n`);
    const totalAnuladas = preguntas.filter(p => p.anulada).length;
    const ejercicios = new Set(preguntas.map(ejercicioDe));
    const materias = new Set(preguntas.map(p => p.materia.toString()));
    const bloques = new Set(preguntas.map(p => p.bloque).filter(Boolean));
    const temas = new Set(preguntas.map(p => p.tema).filter(Boolean));
    const aplicaciones = new Set(preguntas.map(p => limpiarAplicacion(p.aplicacion)).filter(Boolean));

    line(`| Métrica | Valor |`);
    line(`|---------|-------|`);
    line(`| Preguntas totales | ${total} |`);
    line(`| Ejercicios / convocatorias | ${ejercicios.size} |`);
    line(`| Materias | ${materias.size} |`);
    line(`| Bloques | ${bloques.size} |`);
    line(`| Temas | ${temas.size} |`);
    line(`| Aplicaciones | ${aplicaciones.size} |`);
    line(`| Anuladas | ${totalAnuladas} (${pct(totalAnuladas)}%) |`);
    line('');

    // ——————— DISTRIBUCIÓN POR EJERCICIO ———————
    line(`## Ejercicios (${ejercicios.size})\n`);
    const ejConteo = new Map<string, { organismo: string; escala: string; año: number; acceso: string; tipo: string; count: number; anuladas: number }>();
    preguntas.forEach(p => {
        const ej = ejercicioDe(p);
        if (!ejConteo.has(ej)) {
            ejConteo.set(ej, {
                organismo: p.metadatos?.organismo || '—',
                escala: p.metadatos?.escala || '',
                año: p.metadatos?.año || 0,
                acceso: p.metadatos?.acceso || '',
                tipo: p.metadatos?.tipo || '',
                count: 0,
                anuladas: 0,
            });
        }
        const d = ejConteo.get(ej)!;
        d.count++;
        if (p.anulada) d.anuladas++;
    });
    const ejOrdenados = Array.from(ejConteo.values()).sort((a, b) => {
        const o = a.organismo.localeCompare(b.organismo);
        if (o !== 0) return o;
        const e = a.escala.localeCompare(b.escala);
        if (e !== 0) return e;
        if (a.año !== b.año) return a.año - b.año;
        return a.acceso.localeCompare(b.acceso);
    });
    line(`| Organismo | Escala | Año | Acceso | Ejercicio | Preguntas | % | Anuladas |`);
    line(`|-----------|--------|-----|--------|-----------|-----------|---|----------|`);
    ejOrdenados.forEach(d => {
        line(`| ${d.organismo || '—'} | ${fmtEscala(d.escala)} | ${d.año > 0 ? d.año : '—'} | ${fmtAcceso(d.acceso)} | ${fmtTipo(d.tipo)} | ${d.count} | ${pct(d.count)}% | ${d.anuladas || '—'} |`);
    });
    line('');

    // ——————— DISTRIBUCIÓN POR MATERIA ———————
    line(`## Distribución por materia (${materias.size})\n`);
    const matConteo: Record<string, number> = {};
    for (const p of preguntas) {
        const m = p.materia.toString();
        matConteo[m] = (matConteo[m] || 0) + 1;
    }
    line(`| Materia | Preguntas | % |`);
    line(`|---------|-----------|---|`);
    Object.entries(matConteo)
        .sort(([, a], [, b]) => b - a)
        .forEach(([m, c]) => {
            line(`| ${m} | ${c} | ${pct(c)}% |`);
        });
    line('');

    // ——————— DISTRIBUCIÓN POR BLOQUE ———————
    if (bloques.size > 0) {
        line(`## Distribución por bloque (${bloques.size})\n`);
        const blConteo: Record<string, number> = {};
        for (const p of preguntas) {
            const b = p.bloque;
            if (b && b.trim() !== '') blConteo[b] = (blConteo[b] || 0) + 1;
        }
        line(`| Bloque | Preguntas | % |`);
        line(`|--------|-----------|---|`);
        Object.entries(blConteo)
            .sort(([, a], [, b]) => b - a)
            .forEach(([b, c]) => {
                line(`| ${b} | ${c} | ${pct(c)}% |`);
            });
        line('');
    }

    // ——————— DISTRIBUCIÓN POR TEMA ———————
    if (temas.size > 0) {
        line(`## Distribución por tema (${temas.size})\n`);
        const tmConteo: Record<string, number> = {};
        for (const p of preguntas) {
            const t = p.tema;
            if (t && t.trim() !== '') tmConteo[t] = (tmConteo[t] || 0) + 1;
        }
        line(`| Tema | Preguntas | % |`);
        line(`|------|-----------|---|`);
        Object.entries(tmConteo)
            .sort(([, a], [, b]) => b - a)
            .forEach(([t, c]) => {
                line(`| ${t} | ${c} | ${pct(c)}% |`);
            });
        line('');
    }

    // ——————— DISTRIBUCIÓN POR APLICACIÓN ———————
    if (aplicaciones.size > 0) {
        line(`## Distribución por aplicación (${aplicaciones.size})\n`);
        const apConteo: Record<string, number> = {};
        for (const p of preguntas) {
            const a = limpiarAplicacion(p.aplicacion);
            if (a) apConteo[a] = (apConteo[a] || 0) + 1;
        }
        line(`| Aplicación | Preguntas | % |`);
        line(`|------------|-----------|---|`);
        Object.entries(apConteo)
            .sort(([, a], [, b]) => b - a)
            .forEach(([a, c]) => {
                line(`| ${a} | ${c} | ${pct(c)}% |`);
            });
        line('');
    }

    // ——————— RADIOGRAFÍA DE ANULADAS ———————
    if (totalAnuladas > 0) {
        line(`## Radiografía de anulaciones (${totalAnuladas})\n`);
        line(`Tasa global: **${pct(totalAnuladas)}%** · ${totalAnuladas} de ${total} preguntas.\n`);

        // Por organismo
        const orgAnuladas = new Map<string, { total: number; anuladas: number }>();
        preguntas.forEach(p => {
            const org = p.metadatos?.organismo || 'Desconocido';
            if (!orgAnuladas.has(org)) orgAnuladas.set(org, { total: 0, anuladas: 0 });
            orgAnuladas.get(org)!.total++;
            if (p.anulada) orgAnuladas.get(org)!.anuladas++;
        });
        const orgConAnuladas = Array.from(orgAnuladas.entries())
            .filter(e => e[1].anuladas > 0)
            .sort((a, b) => b[1].anuladas - a[1].anuladas);
        if (orgConAnuladas.length > 0) {
            line(`### Por organismo\n`);
            line(`| Organismo | Total muestra | Anuladas | Tasa impugnación |`);
            line(`|-----------|---------------|----------|------------------|`);
            orgConAnuladas.forEach(([org, s]) => {
                line(`| ${org} | ${s.total} | ${s.anuladas} | ${((s.anuladas / s.total) * 100).toFixed(1)}% |`);
            });
            line('');
        }

        // Por año
        const añoAnuladas = new Map<number, { total: number; anuladas: number }>();
        preguntas.forEach(p => {
            const año = p.metadatos?.año || 0;
            if (!año) return;
            if (!añoAnuladas.has(año)) añoAnuladas.set(año, { total: 0, anuladas: 0 });
            añoAnuladas.get(año)!.total++;
            if (p.anulada) añoAnuladas.get(año)!.anuladas++;
        });
        const añosConAnuladas = Array.from(añoAnuladas.entries())
            .filter(e => e[1].anuladas > 0)
            .sort((a, b) => a[0] - b[0]);
        if (añosConAnuladas.length > 0) {
            line(`### Por año\n`);
            line(`| Año | Total muestra | Anuladas | Tasa |`);
            line(`|-----|---------------|----------|------|`);
            añosConAnuladas.forEach(([año, s]) => {
                line(`| ${año} | ${s.total} | ${s.anuladas} | ${((s.anuladas / s.total) * 100).toFixed(1)}% |`);
            });
            line('');
        }

        // Por materia
        const matAnuladas = new Map<string, { total: number; anuladas: number }>();
        preguntas.forEach(p => {
            const m = p.materia.toString();
            if (!matAnuladas.has(m)) matAnuladas.set(m, { total: 0, anuladas: 0 });
            matAnuladas.get(m)!.total++;
            if (p.anulada) matAnuladas.get(m)!.anuladas++;
        });
        const matConAnuladas = Array.from(matAnuladas.entries())
            .filter(e => e[1].anuladas > 0)
            .sort((a, b) => b[1].anuladas - a[1].anuladas);
        if (matConAnuladas.length > 0) {
            line(`### Por materia\n`);
            line(`| Materia | Total muestra | Anuladas | Tasa |`);
            line(`|---------|---------------|----------|------|`);
            matConAnuladas.forEach(([m, s]) => {
                line(`| ${m} | ${s.total} | ${s.anuladas} | ${((s.anuladas / s.total) * 100).toFixed(1)}% |`);
            });
            line('');
        }

        // Listado de preguntas anuladas
        const listaAnuladas = preguntas.filter(p => p.anulada);
        if (listaAnuladas.length > 0) {
            line(`### Preguntas anuladas\n`);
            line(`| ID | Ejercicio | Materia | Tema |`);
            line(`|----|-----------|---------|------|`);
            listaAnuladas.forEach(p => {
                line(`| ${p.id} | ${ejercicioDe(p)} | ${p.materia} | ${p.tema || '—'} |`);
            });
            line('');
        }
    }

    // ——————— DISTRACTORES FRECUENTES ———————
    line(`## Trampas y Distractores Frecuentes\n`);
    const STOP_WORDS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'e', 'o', 'u', 'de', 'del', 'a', 'al', 'en', 'por', 'con', 'sin', 'para', 'segun', 'sobre', 'que', 'quien', 'cual', 'cuyo', 'donde', 'como', 'cuando', 'cuanto', 'su', 'sus', 'mi', 'tu', 'nuestro', 'vuestro', 'este', 'ese', 'aquel', 'es', 'son', 'ser', 'fue', 'ha', 'han', 'tiene', 'tienen', 'esta', 'estan', 'no', 'si', 'ni', 'mas', 'menos', 'muy', 'poco', 'todo', 'nada', 'algo', 'se', 'me', 'te', 'nos', 'os', 'le', 'les', 'lo', 'las', 'solo', 'entre', 'ley', 'artículo', 'leyes', 'real', 'decreto', 'disposición', 'general', 'art', 'capítulo', 'título', 'número', 'apartado', 'letra', 'párrafo', 'todas', 'todos', 'ninguna', 'ninguno', 'son', 'correctas', 'falsas', 'anteriores', 'ambas', 'a)', 'b)', 'c)', 'd)', 'opción', 'respuesta', 'puede', 'cambiar', 'tabla', 'permite', 'necesario', 'elementos', 'texto', 'pueden', 'diseño', 'opciones']);

    const tokenizar = (texto: string) => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 4 && !STOP_WORDS.has(w) && isNaN(Number(w)));

    const conteoDistr = new Map<string, number>();
    preguntas.forEach(p => {
        if (!p.correcta || !p.opciones[p.correcta as keyof typeof p.opciones]) return;
        const textoCorrecta = p.opciones[p.correcta as keyof typeof p.opciones] as string;
        const tokensCorrecta = new Set(tokenizar(textoCorrecta));
        (['A', 'B', 'C', 'D'] as const).forEach(letra => {
            if (letra !== p.correcta && p.opciones[letra as keyof typeof p.opciones]) {
                const tokensUnicos = Array.from(new Set(tokenizar(p.opciones[letra as keyof typeof p.opciones]!)));
                tokensUnicos.forEach(t => {
                    if (!tokensCorrecta.has(t)) conteoDistr.set(t, (conteoDistr.get(t) || 0) + 1);
                });
            }
        });
    });

    const topDistr = Array.from(conteoDistr.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);

    if (topDistr.length > 0) {
        line(`*Esta tabla recoge los conceptos o palabras más empleadas exclusivamente en respuestas falsas:*\n`);
        line(`| Concepto Trampa | Frecuencia |`);
        line(`|-----------------|------------|`);
        topDistr.forEach(([palabra, freq]) => line(`| **${palabra}** | ${freq} apariciones |`));
        line('');
    }

    // ——————— CHI-CUADRADO GLOBAL ———————
    line(`## Sesgo Chi-cuadrado (global)\n`);
    const chi = calcularChiCuadrado(preguntas);
    line(`| Opción | Frecuencia | % |`);
    line(`|--------|-----------|---|`);
    for (const l of chi.letras) {
        line(`| ${l} | ${chi.distribucion[l]} | ${(chi.distribucion[l] / chi.total * 100).toFixed(1)}% |`);
    }
    line(`\n- **χ² =** ${chi.chiSquare.toFixed(2)}, **p-valor =** ${chi.pValue < 0.001 ? '< 0,001' : chi.pValue.toFixed(3)}`);
    line(`- ${chi.pValue < 0.05 ? '⚠ Sesgo estadísticamente significativo' : '✓ Sin sesgo significativo'}\n`);

    // ——————— CHI² SEGMENTADO ———————
    const chiSeg = calcularChiCuadradoSegmentado(preguntas);
    const sesgados = chiSeg.filter(d => d.sesgado);
    if (sesgados.length > 0) {
        line(`## Convocatorias con sesgo significativo\n`);
        line(`| Convocatoria | χ² | p-valor | A | B | C | D |`);
        line(`|-------------|-----|---------|---|---|---|---|`);
        for (const d of sesgados) {
            line(`| ${d.ejercicio} | ${d.chiSquare.toFixed(2)} | ${d.pValue.toFixed(3)} | ${d.distribucion.A} | ${d.distribucion.B} | ${d.distribucion.C} | ${d.distribucion.D} |`);
        }
        line('');
    }

    // ——————— COBERTURA ———————
    line(`## Cobertura del temario\n`);
    const cob = analizarCobertura(preguntas);
    line(`- Cobertura sólida: **${cob.coberturaPorcentaje}%**`);
    line(`- Elementos con laguna: **${cob.elementosConLaguna}** de ${cob.totalElementos}\n`);
    const lagunas = cob.items.filter(i => i.esLaguna);
    if (lagunas.length > 0) {
        line(`### Lagunas detectadas\n`);
        line(`| Nivel | Nombre | Preguntas | Años |`);
        line(`|-------|--------|-----------|------|`);
        for (const l of lagunas.slice(0, 20)) {
            line(`| ${l.nivel} | ${l.nombre} | ${l.totalPreguntas} | ${l.añosPresente.join(', ') || '—'} |`);
        }
        line('');
    }

    // ——————— PREDICCIÓN DE TEMAS ———————
    line(`## Predicción de temas probables\n`);
    const predicciones = predecirTemas(preguntas).slice(0, 15);
    line(`| Nivel | Tema | Probabilidad | Tendencia |`);
    line(`|-------|------|-------------|-----------|`);
    for (const p of predicciones) {
        line(`| ${p.campo} | ${p.tema} | ${p.probabilidad}% | ${p.tendencia} |`);
    }
    line('');

    // ——————— DIFICULTAD ———————
    line(`## Dificultad estimada\n`);
    const difs = calcularDificultad(preguntas);
    const avg = difs.reduce((s, d) => s + d.score, 0) / (difs.length || 1);
    const max = difs.reduce((m, d) => Math.max(m, d.score), 0);
    const min = difs.reduce((m, d) => Math.min(m, d.score), 100);
    line(`- Media: **${avg.toFixed(1)}/100**`);
    line(`- Rango: **${min}** – **${max}**\n`);

    // ——————— DUPLICADOS ———————
    const dups = detectarDuplicados(preguntas, 0.6);
    if (dups.length > 0) {
        line(`## Duplicados detectados\n`);
        line(`Se han encontrado **${dups.length}** grupos de preguntas duplicadas o muy similares.\n`);
        for (const g of dups.slice(0, 10)) {
            line(`- ${g.tipo}: ${g.preguntas.map(p => p.id).join(', ')}`);
        }
        line('');
    }

    // ——————— SUGERENCIAS ———————
    const insights = generarInsights(preguntas);
    if (insights.length > 0) {
        line(`## Sugerencias de estudio\n`);
        for (const ins of insights) {
            line(`- **${ins.titulo}**: ${ins.descripcion}`);
        }
        line('');
    }

    line(`---\n*Fin del informe.*`);

    return lines.join('\n');
}

/**
 * Descarga el informe como archivo .md
 */
export function descargarInforme(preguntas: Pregunta[], nombreDataset: string): void {
    const md = generarInformeMarkdown(preguntas, nombreDataset);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_${nombreDataset.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
}
