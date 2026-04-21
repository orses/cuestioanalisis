import React, { useMemo, useState, useEffect } from 'react';
import type { Pregunta } from '../types';
import { TrendingUp, TrendingDown, Minus, AlertCircle, BarChart3, PieChart, Layers, Target, Zap } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { ListaPopover, type ListaPopoverItem } from './ListaPopover';
import { getMateriaColor as getColorMateria } from '../utils/colores';

export interface FiltroTabla {
    materias?: string[];
    bloques?: string[];
    temas?: string[];
    aplicaciones?: string[];
    anulada?: string[];
}

interface ResumenProps {
    preguntas: Pregunta[];
    onVerEjercicio?: (organismo: string, escala: string, año: string, acceso: string, tipo: string) => void;
    onFiltrarYVerTabla?: (filtro: FiltroTabla) => void;
}

type PopoverTipo = 'materias' | 'bloques' | 'temas' | 'aplicaciones';

export const Resumen: React.FC<ResumenProps> = ({ preguntas, onVerEjercicio, onFiltrarYVerTabla }) => {
    // ——— Popover activo para KPIs listables ———
    const [popoverActivo, setPopoverActivo] = useState<PopoverTipo | null>(null);
    // ——— Sección activa del sidebar ———
    const [seccionActivaRes, setSeccionActivaRes] = useState<string>('sec-kpis');

    useEffect(() => {
        const ids = ['sec-kpis', 'sec-ejercicios', 'sec-materias', 'sec-frecuencias', 'sec-patron', 'sec-tendencias'];
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setSeccionActivaRes(entry.target.id);
                    }
                });
            },
            { rootMargin: '-120px 0px -60% 0px', threshold: 0.1 }
        );
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    // ——— KPIs ———
    const totalPreguntas = preguntas.length;
    const ejerciciosUnicos = useMemo(() => new Set(preguntas.map(p => p.id.split('_').slice(0, -1).join('_'))).size, [preguntas]);
    const materiasUnicas = useMemo(() => new Set(preguntas.map(p => p.materia.toString())).size, [preguntas]);

    // KPIs nuevos
    const bloquesUnicos = useMemo(() => new Set(preguntas.map(p => p.bloque).filter(b => b && b.trim() !== '')).size, [preguntas]);
    const temasUnicos = useMemo(() => new Set(preguntas.map(p => p.tema).filter(t => t && t.trim() !== '')).size, [preguntas]);
    const aplicacionesUnicas = useMemo(() => new Set(
        preguntas.map(p => p.aplicacion ? p.aplicacion.replace(/\s*\b\d+.*$/i, '').trim() : '')
            .filter(a => a && a !== '')
    ).size, [preguntas]);

    const totalAnuladas = useMemo(() => preguntas.filter(p => p.anulada).length, [preguntas]);

    // ——— Distribución por ejercicio (tabla con metadatos) ———
    type EjCol = 'organismo' | 'escala' | 'año' | 'acceso' | 'tipo' | 'count' | 'porcentaje' | 'anuladas';
    const [ejSortCol, setEjSortCol] = useState<EjCol>('organismo');
    const [ejSortAsc, setEjSortAsc] = useState(true);

    const ejerciciosBase = useMemo(() => {
        const conteo: Record<string, { count: number; organismo: string; escala: string; año: number; acceso: string; tipo: string; anuladas: number }> = {};
        preguntas.forEach(p => {
            const ej = p.id.split('_').slice(0, -1).join('_') || '(sin ejercicio)';
            if (!conteo[ej]) {
                conteo[ej] = {
                    count: 0,
                    organismo: p.metadatos.organismo,
                    escala: p.metadatos.escala,
                    año: p.metadatos.año,
                    acceso: p.metadatos.acceso,
                    tipo: p.metadatos.tipo,
                    anuladas: 0,
                };
            }
            conteo[ej].count += 1;
            if (p.anulada) conteo[ej].anuladas += 1;
        });
        return Object.entries(conteo)
            .map(([ejercicio, d]) => ({ ejercicio, ...d, porcentaje: parseFloat(((d.count / totalPreguntas) * 100).toFixed(1)) }));
    }, [preguntas, totalPreguntas]);

    const distribucionEjercicios = useMemo(() => {
        const arr = [...ejerciciosBase];
        const dir = ejSortAsc ? 1 : -1;
        arr.sort((a, b) => {
            const va = a[ejSortCol];
            const vb = b[ejSortCol];
            if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
            return String(va).localeCompare(String(vb)) * dir;
        });
        // Desempate multicolumna cuando se ordena por la columna principal
        if (ejSortCol === 'organismo') {
            arr.sort((a, b) => {
                const d = a.organismo.localeCompare(b.organismo) * dir;
                if (d !== 0) return d;
                const d2 = a.escala.localeCompare(b.escala) * dir;
                if (d2 !== 0) return d2;
                const d3 = (a.año - b.año) * dir;
                if (d3 !== 0) return d3;
                return a.acceso.localeCompare(b.acceso) * dir;
            });
        }
        return arr;
    }, [ejerciciosBase, ejSortCol, ejSortAsc]);

    const toggleEjSort = (col: EjCol) => {
        if (ejSortCol === col) setEjSortAsc(!ejSortAsc);
        else { setEjSortCol(col); setEjSortAsc(true); }
    };

    // ——— Distribución por materia (barras horizontales) ———
    const distribucionMaterias = useMemo(() => {
        const conteo: Record<string, number> = {};
        preguntas.forEach(p => {
            const m = p.materia.toString();
            conteo[m] = (conteo[m] || 0) + 1;
        });
        return Object.entries(conteo)
            .sort((a, b) => b[1] - a[1])
            .map(([materia, count]) => ({
                materia,
                count,
                porcentaje: ((count / totalPreguntas) * 100).toFixed(1),
            }));
    }, [preguntas, totalPreguntas]);

    const distribucionBloques = useMemo(() => {
        const conteo: Record<string, number> = {};
        preguntas.forEach(p => {
            const b = p.bloque || '(sin bloque)';
            conteo[b] = (conteo[b] || 0) + 1;
        });
        return Object.entries(conteo)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([bloque, count]) => ({
                bloque,
                count,
                porcentaje: ((count / totalPreguntas) * 100).toFixed(1),
            }));
    }, [preguntas, totalPreguntas]);

    // ——— Frecuencia de temas ———
    const distribucionTemas = useMemo(() => {
        const conteo: Record<string, number> = {};
        preguntas.forEach(p => {
            const t = p.tema || '(sin tema)';
            conteo[t] = (conteo[t] || 0) + 1;
        });
        return Object.entries(conteo)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tema, count]) => ({
                tema,
                count,
                porcentaje: ((count / totalPreguntas) * 100).toFixed(1),
            }));
    }, [preguntas, totalPreguntas]);

    // ——— Frecuencia de aplicaciones ———
    const distribucionAplicaciones = useMemo(() => {
        const conteo: Record<string, number> = {};
        preguntas.forEach(p => {
            const app = p.aplicacion ? p.aplicacion.replace(/\s*\b\d+.*$/i, '').trim() : '(sin aplicación)';
            conteo[app] = (conteo[app] || 0) + 1;
        });
        return Object.entries(conteo)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([app, count]) => ({
                app,
                count,
                porcentaje: ((count / totalPreguntas) * 100).toFixed(1),
            }));
    }, [preguntas, totalPreguntas]);

    // ——— Patrón de respuestas correctas ———
    const distribucionRespuestas = useMemo(() => {
        const conteo: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
        let total = 0;
        preguntas.forEach(p => {
            if (p.correcta && conteo[p.correcta] !== undefined) {
                conteo[p.correcta]++;
                total++;
            }
        });

        const esperado = total / 4;
        const sesgos: string[] = [];
        const colores = { A: '#3b82f6', B: '#10b981', C: '#f59e0b', D: '#8b5cf6' };

        const datos = Object.entries(conteo).map(([letra, count]) => {
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
            const desviacion = total > 0 ? Math.abs(count - esperado) / esperado : 0;
            if (desviacion > 0.15) {
                sesgos.push(`${letra}: ${pct}% (${count > esperado ? 'más frecuente' : 'menos frecuente'})`);
            }
            return { letra, count, pct, color: colores[letra as keyof typeof colores] || '#6b7280' };
        });

        return { datos, total, sesgos };
    }, [preguntas]);

    // ——— Tendencias temporales conjuntas ———
    const tendencias = useMemo(() => {
        const porAñoMateri: Record<number, Record<string, number>> = {};
        const porAñoBloque: Record<number, Record<string, number>> = {};
        const porAñoTema: Record<number, Record<string, number>> = {};
        const porAñoApp: Record<number, Record<string, number>> = {};

        preguntas.forEach(p => {
            const año = p.metadatos.año;
            if (!año) return;

            if (!porAñoMateri[año]) porAñoMateri[año] = {};
            if (!porAñoBloque[año]) porAñoBloque[año] = {};
            if (!porAñoTema[año]) porAñoTema[año] = {};
            if (!porAñoApp[año]) porAñoApp[año] = {};

            const m = p.materia.toString();
            const b = p.bloque || '(sin bloque)';
            const t = p.tema || '(sin tema)';
            const a = p.aplicacion ? p.aplicacion.replace(/\s*\b\d+.*$/i, '').trim() : '(sin aplicación)';

            porAñoMateri[año][m] = (porAñoMateri[año][m] || 0) + 1;
            porAñoBloque[año][b] = (porAñoBloque[año][b] || 0) + 1;
            porAñoTema[año][t] = (porAñoTema[año][t] || 0) + 1;
            porAñoApp[año][a] = (porAñoApp[año][a] || 0) + 1;
        });

        const años = Object.keys(porAñoMateri).map(Number).sort((a, b) => a - b);
        if (años.length < 2) return [];

        const materiasSet = new Set<string>();
        const bloquesSet = new Set<string>();
        const temasSet = new Set<string>();
        const appsSet = new Set<string>();

        preguntas.forEach(p => {
            materiasSet.add(p.materia.toString());
            bloquesSet.add(p.bloque || '(sin bloque)');
            temasSet.add(p.tema || '(sin tema)');
            appsSet.add(p.aplicacion ? p.aplicacion.replace(/\s*\b\d+.*$/i, '').trim() : '(sin aplicación)');
        });

        const tendenciasGlobales: Record<string, { tipo: string, nombre: string, cambio: string, tendencia: 'up' | 'down' | 'stable', mediaReciente: string, mediaAntigua: string }> = {};

        const calcularTendencia = (porAño: Record<number, Record<string, number>>, tipo: string, lista: string[]) => {
            lista.forEach(item => {
                const valores = años.map(v => porAño[v]?.[item] || 0);
                const mitad = Math.floor(valores.length / 2);
                const primeros = valores.slice(0, Math.max(mitad, 1));
                const ultimos = valores.slice(-Math.max(mitad, 1));

                const mediaAntigua = primeros.reduce((a, b) => a + b, 0) / primeros.length;
                const mediaReciente = ultimos.reduce((a, b) => a + b, 0) / ultimos.length;

                let cambio = 0;
                let tendencia: 'up' | 'down' | 'stable' = 'stable';
                if (mediaAntigua > 0) {
                    cambio = ((mediaReciente - mediaAntigua) / mediaAntigua) * 100;
                    if (cambio > 20) tendencia = 'up';
                    else if (cambio < -20) tendencia = 'down';
                }
                if (mediaAntigua > 0 || mediaReciente > 0) {
                    tendenciasGlobales[`${tipo} -${item} `] = { tipo, nombre: item, cambio: cambio.toFixed(1), tendencia, mediaReciente: mediaReciente.toFixed(1), mediaAntigua: mediaAntigua.toFixed(1) };
                }
            });
        };

        const extraerLista = (conjunto: Set<string>) => Array.from(conjunto).filter(x => x && x !== '' && !x.includes('(sin'));

        calcularTendencia(porAñoMateri, 'Materia', extraerLista(materiasSet));
        calcularTendencia(porAñoBloque, 'Bloque', extraerLista(bloquesSet));
        calcularTendencia(porAñoTema, 'Tema', extraerLista(temasSet));
        calcularTendencia(porAñoApp, 'Programa', extraerLista(appsSet));

        return Object.values(tendenciasGlobales).sort((a, b) => Math.abs(parseFloat(b.cambio)) - Math.abs(parseFloat(a.cambio)));
    }, [preguntas]);

    const itemsEnAumento = tendencias
        .filter(t => t.tendencia === 'up')
        .slice(0, 5); // Mostrar top 5 subidas globales

    // ——— Listas completas para popovers (ordenadas por frecuencia) ———
    const listaMateriasCompleta = useMemo(() => {
        const c: Record<string, number> = {};
        preguntas.forEach(p => { const m = p.materia.toString(); c[m] = (c[m] || 0) + 1; });
        return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
    }, [preguntas]);

    const listaBloquesCompleta = useMemo(() => {
        const c: Record<string, number> = {};
        preguntas.forEach(p => { const b = p.bloque; if (b && b.trim() !== '') c[b] = (c[b] || 0) + 1; });
        return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
    }, [preguntas]);

    const listaTemasCompleta = useMemo(() => {
        const c: Record<string, number> = {};
        preguntas.forEach(p => { const t = p.tema; if (t && t.trim() !== '') c[t] = (c[t] || 0) + 1; });
        return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
    }, [preguntas]);

    const listaAplicacionesCompleta = useMemo(() => {
        const c: Record<string, number> = {};
        preguntas.forEach(p => {
            const a = p.aplicacion ? p.aplicacion.replace(/\s*\b\d+.*$/i, '').trim() : '';
            if (a) c[a] = (c[a] || 0) + 1;
        });
        return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
    }, [preguntas]);

    const scrollASeccion = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const construirItemsPopover = (tipo: PopoverTipo): ListaPopoverItem[] => {
        const fuente = tipo === 'materias' ? listaMateriasCompleta
            : tipo === 'bloques' ? listaBloquesCompleta
                : tipo === 'temas' ? listaTemasCompleta
                    : listaAplicacionesCompleta;
        return fuente.map(({ label, count }) => ({
            label,
            count,
            onClick: onFiltrarYVerTabla ? () => {
                const filtro: FiltroTabla = {};
                if (tipo === 'materias') filtro.materias = [label];
                else if (tipo === 'bloques') filtro.bloques = [label];
                else if (tipo === 'temas') filtro.temas = [label];
                else filtro.aplicaciones = [label];
                onFiltrarYVerTabla(filtro);
                setPopoverActivo(null);
            } : undefined,
        }));
    };

    const tituloPopover = (tipo: PopoverTipo) => ({
        materias: 'Materias', bloques: 'Bloques', temas: 'Temas', aplicaciones: 'Aplicaciones',
    }[tipo]);

    // ——— Handlers de KPIs ———
    const handleKpiClick = (etiqueta: string) => {
        if (etiqueta === 'Ejercicios') {
            scrollASeccion('sec-ejercicios');
        } else if (etiqueta === 'Anuladas' && onFiltrarYVerTabla) {
            onFiltrarYVerTabla({ anulada: ['Sí'] });
        } else if (etiqueta === 'Materias') {
            setPopoverActivo('materias');
        } else if (etiqueta === 'Bloques') {
            setPopoverActivo('bloques');
        } else if (etiqueta === 'Temas') {
            setPopoverActivo('temas');
        } else if (etiqueta === 'Aplicaciones') {
            setPopoverActivo('aplicaciones');
        }
    };

    const kpiEsClicable = (etiqueta: string) => {
        if (etiqueta === 'Preguntas') return false;
        if (etiqueta === 'Ejercicios') return true;
        if (etiqueta === 'Anuladas') return !!onFiltrarYVerTabla && totalAnuladas > 0;
        return !!onFiltrarYVerTabla; // Materias, Bloques, Temas, Aplicaciones
    };

    // ——— Handler de Elementos al alza ———
    const handleElementoAlzaClick = (tipo: string, nombre: string) => {
        if (!onFiltrarYVerTabla) return;
        const filtro: FiltroTabla = {};
        if (tipo === 'Materia') filtro.materias = [nombre];
        else if (tipo === 'Bloque') filtro.bloques = [nombre];
        else if (tipo === 'Tema') filtro.temas = [nombre];
        else if (tipo === 'Programa') filtro.aplicaciones = [nombre];
        onFiltrarYVerTabla(filtro);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'start' }}>
            {/* Sidebar de navegación dentro de Resumen */}
            <nav style={{
                position: 'sticky', top: '140px',
                display: 'flex', flexDirection: 'column', gap: '2px',
                padding: '12px', borderRadius: '10px',
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                fontSize: '13px',
            }}>
                {[
                    { id: 'sec-kpis', label: 'KPIs', icon: <Target className="w-3.5 h-3.5" /> },
                    { id: 'sec-ejercicios', label: 'Ejercicios', icon: <Layers className="w-3.5 h-3.5" /> },
                    { id: 'sec-materias', label: 'Materias', icon: <PieChart className="w-3.5 h-3.5" /> },
                    { id: 'sec-frecuencias', label: 'Frecuencias', icon: <BarChart3 className="w-3.5 h-3.5" /> },
                    { id: 'sec-patron', label: 'Patrones', icon: <Zap className="w-3.5 h-3.5" /> },
                    { id: 'sec-tendencias', label: 'Tendencias', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                ].map(s => (
                    <a key={s.id} href={`#${s.id} `}
                        onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '6px 8px', borderRadius: '6px',
                            color: seccionActivaRes === s.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                            textDecoration: 'none',
                            fontWeight: seccionActivaRes === s.id ? 800 : 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                            backgroundColor: seccionActivaRes === s.id ? 'var(--bg-tertiary)' : 'transparent',
                            borderLeft: seccionActivaRes === s.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                        }}
                        onMouseEnter={e => { if (seccionActivaRes !== s.id) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                        onMouseLeave={e => { if (seccionActivaRes !== s.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <span style={{ color: seccionActivaRes === s.id ? 'var(--accent-primary)' : 'var(--primary)', display: 'flex' }}>{s.icon}</span>
                        {s.label}
                    </a>
                ))}
            </nav>

            {/* Contenido principal de Resumen */}
            <div className="space-y-6 animate-fade-slide">

                {/* ════ KPIs ════ */}
                <div id="sec-kpis" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4" role="region" aria-label="Indicadores clave">
                    {[
                        { valor: totalPreguntas, etiqueta: 'Preguntas', icono: <Layers className="w-5 h-5" />, color: '#6366f1' },
                        { valor: ejerciciosUnicos, etiqueta: 'Ejercicios', icono: <Target className="w-5 h-5" />, color: '#0ea5e9' },
                        { valor: materiasUnicas, etiqueta: 'Materias', icono: <PieChart className="w-5 h-5" />, color: '#10b981' },
                        { valor: bloquesUnicos, etiqueta: 'Bloques', icono: <BarChart3 className="w-5 h-5" />, color: '#f59e0b' },
                        { valor: temasUnicos, etiqueta: 'Temas', icono: <Zap className="w-5 h-5" />, color: '#8b5cf6' },
                        { valor: aplicacionesUnicas, etiqueta: 'Aplicaciones', icono: <Target className="w-5 h-5" />, color: '#ec4899', titulo: 'Sin tener en cuenta la versión' },
                        { valor: totalAnuladas, etiqueta: 'Anuladas', icono: <AlertCircle className="w-5 h-5" />, color: '#ef4444' },
                    ].map((kpi, i) => {
                        const clicable = kpiEsClicable(kpi.etiqueta);
                        const tituloAccion = kpi.etiqueta === 'Ejercicios' ? 'Ir a la tabla de ejercicios'
                            : kpi.etiqueta === 'Anuladas' ? 'Ver anuladas en tabla'
                                : ['Materias', 'Bloques', 'Temas', 'Aplicaciones'].includes(kpi.etiqueta) ? `Ver lista de ${kpi.etiqueta.toLowerCase()}`
                                    : '';
                        const Wrapper: React.ElementType = clicable ? 'button' : 'div';
                        return (
                            <Wrapper
                                key={i}
                                onClick={clicable ? () => handleKpiClick(kpi.etiqueta) : undefined}
                                className={`bg-card rounded-xl border overflow-hidden transition-shadow hover:shadow-md text-left w-full ${clicable ? 'cursor-pointer hover:-translate-y-0.5 transition-transform' : ''}`}
                                style={{ borderColor: 'var(--border-secondary)' }}
                                title={tituloAccion || kpi.titulo || ''}
                                aria-label={clicable ? tituloAccion : undefined}
                            >
                                <div style={{ height: '3px', background: kpi.color }} />
                                <div className="px-4 py-3 flex items-center gap-3">
                                    <div className="flex-shrink-0 rounded-lg p-2" style={{ backgroundColor: `${kpi.color} 15`, color: kpi.color }}>
                                        {kpi.icono}
                                    </div>
                                    <div>
                                        <p className="text-2xl font-extrabold text-heading leading-none">{kpi.valor}</p>
                                        <p className="text-xs text-muted mt-0.5">{kpi.etiqueta}</p>
                                    </div>
                                </div>
                            </Wrapper>
                        );
                    })}
                </div>

                {/* ════ Tabla de ejercicios ════ */}
                {distribucionEjercicios.length > 0 && (
                    <div id="sec-ejercicios" className="bg-card border border-card rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
                        <h3 className="text-lg font-bold text-heading mb-4">
                            Ejercicios <span className="text-sm font-normal text-muted">({distribucionEjercicios.length})</span>
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-secondary)' }}>
                                        {([['Organismo', 'organismo'], ['Escala', 'escala'], ['Año', 'año'], ['Acceso', 'acceso'], ['Ejercicio', 'tipo'], ['Preguntas', 'count'], ['%', 'porcentaje'], ['Anuladas', 'anuladas']] as [string, EjCol][]).map(([label, col]) => (
                                            <th key={col}
                                                onClick={() => toggleEjSort(col)}
                                                style={{
                                                    padding: '6px 10px',
                                                    textAlign: col === 'count' || col === 'porcentaje' || col === 'anuladas' ? 'right' : 'left',
                                                    fontWeight: 700, color: ejSortCol === col ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                                                    fontSize: '10px', textTransform: 'uppercase', whiteSpace: 'nowrap',
                                                    cursor: 'pointer', userSelect: 'none',
                                                }}>
                                                {label} {ejSortCol === col ? (ejSortAsc ? '▲' : '▼') : ''}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {distribucionEjercicios.map((d, i) => (
                                        <tr
                                            key={d.ejercicio}
                                            className="table-row-hover"
                                            onClick={onVerEjercicio ? () => onVerEjercicio(d.organismo, d.escala, String(d.año), d.acceso, d.tipo) : undefined}
                                            style={{
                                                borderBottom: '1px solid var(--border-secondary)',
                                                backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)',
                                                cursor: onVerEjercicio ? 'pointer' : 'default',
                                            }}
                                        >
                                            <td style={{ padding: '5px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>{d.organismo || '—'}</td>
                                            <td style={{ padding: '5px 10px', color: 'var(--text-primary)' }}>
                                                {({ AUX: 'Auxiliar', ADV: 'Administrativo', PSX: 'Servicios Grales.' } as Record<string, string>)[d.escala] || d.escala || '—'}
                                            </td>
                                            <td style={{ padding: '5px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>{d.año > 0 ? d.año : '—'}</td>
                                            <td style={{ padding: '5px 10px', color: 'var(--text-primary)' }}>
                                                {({ LI: 'Libre', PI: 'Prom. int.', PC: 'Prom. cruz.' } as Record<string, string>)[d.acceso] || d.acceso || '—'}
                                            </td>
                                            <td style={{ padding: '5px 10px', color: 'var(--text-primary)' }}>
                                                {({ PRI: 'Primero', SEG: 'Segundo', UNI: 'Único' } as Record<string, string>)[d.tipo] || d.tipo || '—'}
                                            </td>
                                            <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{d.count}</td>
                                            <td style={{ padding: '5px 10px', textAlign: 'right', color: 'var(--text-tertiary)', fontSize: '12px' }}>{d.porcentaje}%</td>
                                            <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: d.anuladas > 0 ? 700 : 400, color: d.anuladas > 0 ? 'var(--accent-danger)' : 'var(--text-tertiary)' }}>
                                                {d.anuladas > 0 ? d.anuladas : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ════ Materias y Bloques (fila 1) ════ */}
                <div id="sec-materias" className="grid grid-cols-1 xl:grid-cols-2 gap-6" style={{ scrollMarginTop: '120px' }}>
                    <div className="bg-card border border-card rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
                        <h3 className="text-lg font-bold text-heading mb-4">Materias</h3>
                        <div className="space-y-3">
                            {distribucionMaterias.map(({ materia, count, porcentaje }) => (
                                <div key={materia} className="flex items-center gap-3">
                                    <span
                                        className="category-chip flex-shrink-0"
                                        style={{ backgroundColor: getColorMateria(materia) }}
                                    >
                                        {materia.charAt(0).toUpperCase() + materia.slice(1)}
                                    </span>
                                    <div className="flex-1 progress-bar-track">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${porcentaje}% `, backgroundColor: getColorMateria(materia) }}
                                            role="progressbar"
                                            aria-valuenow={count}
                                            aria-valuemax={totalPreguntas}
                                            aria-label={`${materia}: ${porcentaje}% `}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-heading w-12 text-right">{count}</span>
                                    <span className="text-xs text-muted w-14 text-right">({porcentaje}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {distribucionBloques.length > 0 && (
                        <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
                            <h3 className="text-lg font-bold text-heading mb-4">Frecuencia de bloques</h3>
                            <div className="space-y-2">
                                {distribucionBloques.map(({ bloque, count, porcentaje }) => (
                                    <div key={bloque} className="flex items-center gap-3">
                                        <span className="text-sm text-body truncate w-32 flex-shrink-0" title={bloque}>{bloque}</span>
                                        <div className="flex-1 progress-bar-track">
                                            <div
                                                className="progress-bar-fill"
                                                style={{ width: `${porcentaje}% `, backgroundColor: 'var(--accent-primary)' }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-heading w-8 text-right">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ════ Temas y Programas (fila 2) ════ */}
                <div id="sec-frecuencias" className="grid grid-cols-1 xl:grid-cols-2 gap-6" style={{ scrollMarginTop: '120px' }}>
                    {distribucionTemas.length > 0 && (
                        <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
                            <h3 className="text-lg font-bold text-heading mb-4">Frecuencia de temas</h3>
                            <div className="space-y-2">
                                {distribucionTemas.map(({ tema, count, porcentaje }) => (
                                    <div key={tema} className="flex items-center gap-3">
                                        <span className="text-sm text-body truncate w-32 flex-shrink-0" title={tema}>{tema}</span>
                                        <div className="flex-1 progress-bar-track">
                                            <div
                                                className="progress-bar-fill"
                                                style={{ width: `${porcentaje}% `, backgroundColor: 'var(--accent-primary)' }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-heading w-8 text-right">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {distribucionAplicaciones.length > 0 && (
                        <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
                            <h3 className="text-lg font-bold text-heading mb-4">Frecuencia de programas</h3>
                            <div className="space-y-2">
                                {distribucionAplicaciones.map(({ app, count, porcentaje }) => (
                                    <div key={app} className="flex items-center gap-3">
                                        <span className="text-sm text-body truncate w-32 flex-shrink-0" title={app}>{app}</span>
                                        <div className="flex-1 progress-bar-track">
                                            <div
                                                className="progress-bar-fill"
                                                style={{ width: `${porcentaje}% `, backgroundColor: 'var(--accent-primary)' }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-heading w-8 text-right">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ════ Conceptos en aumento (Globales) ════ */}
                {itemsEnAumento.length > 0 && (
                    <div className="stat-insight" role="region" aria-label="Conceptos en aumento">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Elementos al alza</h3>
                            <InfoTooltip texto="Se compara la media de apariciones por año en la primera mitad cronológica de los ejercicios con la media en la segunda mitad. Si un elemento (bloque, tema o programa) aparece más del 20% en la mitad reciente respecto a la antigua, se marca como «al alza». El porcentaje indica cuánto ha crecido la frecuencia reciente frente a la antigua." size={16} />
                        </div>
                        <p className="text-sm opacity-90 mb-3">Estas clasificaciones han incrementado su frecuencia significativamente globalmente</p>
                        <div className="space-y-2">
                            {itemsEnAumento.map(t => {
                                const clicable = !!onFiltrarYVerTabla;
                                const Wrapper: React.ElementType = clicable ? 'button' : 'div';
                                return (
                                    <Wrapper
                                        key={`${t.tipo} -${t.nombre} `}
                                        onClick={clicable ? () => handleElementoAlzaClick(t.tipo, t.nombre) : undefined}
                                        className={`w-full flex items-center justify-between bg-white/10 rounded-md px-4 py-2 text-left ${clicable ? 'cursor-pointer hover:bg-white/20 transition-colors' : ''}`}
                                        title={clicable ? `Filtrar por ${t.tipo.toLowerCase()} «${t.nombre}» en la tabla` : undefined}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="category-chip" style={{ backgroundColor: t.tipo === 'Materia' ? getColorMateria(t.nombre) : '#475569' }}>
                                                {t.tipo}
                                            </span>
                                            <span className="text-sm font-medium" style={{ color: "white" }}>{t.nombre.charAt(0).toUpperCase() + t.nombre.slice(1)}</span>
                                        </div>
                                        <span className="font-bold">+{t.cambio}% vs. media ant.</span>
                                    </Wrapper>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ════ Patrón de respuestas correctas ════ */}
                {distribucionRespuestas.total > 0 && (
                    <div className={distribucionRespuestas.sesgos.length > 0 ? 'stat-insight' : 'bg-card border rounded-xl p-6'} style={distribucionRespuestas.sesgos.length === 0 ? { borderColor: 'var(--border-secondary)' } : undefined}>
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Patrón en respuestas correctas</h3>
                        </div>
                        {distribucionRespuestas.sesgos.length > 0 && (
                            <p className="text-sm opacity-90 mb-3">Se detecta desviación de la distribución uniforme esperada</p>
                        )}
                        <div className="flex items-center gap-4 flex-wrap">
                            {distribucionRespuestas.datos.map(d => (
                                <div key={d.letra} className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: d.color }}>
                                        {d.letra}
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold">{d.pct}%</span>
                                        <span className="text-xs opacity-75 ml-1">({d.count})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {distribucionRespuestas.sesgos.length > 0 && (
                            <div className="mt-3 bg-white/10 rounded-md px-4 py-2 text-sm">
                                {distribucionRespuestas.sesgos.join(' · ')}
                            </div>
                        )}
                    </div>
                )}

                {/* ════ Tendencias temporales ════ */}
                {tendencias.length > 0 && (
                    <div id="sec-tendencias" className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-lg font-bold text-heading">Tendencias temporales</h3>
                            <InfoTooltip texto="Cada tarjeta muestra un elemento (materia, bloque, tema o programa) con su variación porcentual. Se divide la cronología de los ejercicios en dos mitades y se compara la media de apariciones por año en cada mitad. 'Reciente' y 'Antigua' indican la media de apariciones en cada periodo. El color verde indica incremento (+20% o más), rojo descenso (-20% o más) y gris estabilidad." />
                        </div>
                        {(() => {
                            const alAlza = tendencias.filter(t => t.tendencia === 'up').sort((a, b) => parseFloat(b.cambio) - parseFloat(a.cambio));
                            const estables = tendencias.filter(t => t.tendencia === 'stable').sort((a, b) => parseFloat(b.cambio) - parseFloat(a.cambio));
                            const aLaBaja = tendencias.filter(t => t.tendencia === 'down').sort((a, b) => parseFloat(b.cambio) - parseFloat(a.cambio));

                            const renderGrupo = (titulo: string, items: typeof tendencias, color: string) => items.length === 0 ? null : (
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold mb-2" style={{ color }}>{titulo} ({items.length})</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {items.map(t => (
                                            <div key={`${t.tipo}-${t.nombre}`} className="bg-muted rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: t.tipo === 'Materia' ? getColorMateria(t.nombre) : '#64748b' }}>
                                                        {t.tipo}
                                                    </span>
                                                    <h4 className="text-sm font-semibold text-heading truncate" title={t.nombre}>
                                                        {t.nombre.charAt(0).toUpperCase() + t.nombre.slice(1)}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {t.tendencia === 'up' && <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-success)' }} />}
                                                    {t.tendencia === 'down' && <TrendingDown className="w-4 h-4" style={{ color: 'var(--accent-danger)' }} />}
                                                    {t.tendencia === 'stable' && <Minus className="w-4 h-4 text-muted" />}
                                                    <span className={`text-sm font-bold ${t.tendencia === 'up' ? 'text-green-600' : t.tendencia === 'down' ? 'text-red-600' : 'text-muted'}`}>
                                                        {parseFloat(t.cambio) > 0 ? '+' : ''}{t.cambio}%
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted mt-1">Reciente: {t.mediaReciente} | Antigua: {t.mediaAntigua}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );

                            return (
                                <>
                                    {renderGrupo('Al alza', alAlza, 'var(--accent-success)')}
                                    {renderGrupo('Sin cambios significativos', estables, 'var(--text-tertiary)')}
                                    {renderGrupo('A la baja', aLaBaja, 'var(--accent-danger)')}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            {popoverActivo && (
                <ListaPopover
                    titulo={tituloPopover(popoverActivo)}
                    items={construirItemsPopover(popoverActivo)}
                    total={construirItemsPopover(popoverActivo).length}
                    onCerrar={() => setPopoverActivo(null)}
                />
            )}
        </div>
    );
};
