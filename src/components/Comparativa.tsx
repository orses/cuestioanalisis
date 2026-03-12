import React, { useMemo, useState } from 'react';
import type { Pregunta } from '../types';
import { generarComparativa } from '../utils/analytics';
import { GitCompare, Check } from 'lucide-react';
import {
    ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LabelList,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface ComparativaProps {
    preguntas: Pregunta[];
}

export const Comparativa: React.FC<ComparativaProps> = ({ preguntas }) => {
    const datos = useMemo(() => generarComparativa(preguntas), [preguntas]);
    const [seleccionados, setSeleccionados] = useState<string[]>([]);
    const [vistaRadar, setVistaRadar] = useState(false);
    const [radarAgrupacion, setRadarAgrupacion] = useState<'materias' | 'bloques' | 'temas' | 'programas'>('materias');

    const toggleSeleccion = (ej: string) => {
        setSeleccionados(prev =>
            prev.includes(ej)
                ? prev.filter(e => e !== ej)
                : prev.length < 4 ? [...prev, ej] : prev  // máx 4
        );
    };

    const datosSeleccionados = useMemo(
        () => datos.filter(d => seleccionados.includes(d.ejercicio)),
        [datos, seleccionados]
    );

    // Todas las materias y bloques presentes
    const todasMaterias = useMemo(() => {
        const set = new Set<string>();
        datosSeleccionados.forEach(d => Object.keys(d.materias).forEach(m => set.add(m)));
        return Array.from(set).sort();
    }, [datosSeleccionados]);

    const todosBloques = useMemo(() => {
        const set = new Set<string>();
        datosSeleccionados.forEach(d => Object.keys(d.bloques).forEach(b => set.add(b)));
        return Array.from(set).sort();
    }, [datosSeleccionados]);

    const todosTemas = useMemo(() => {
        const set = new Set<string>();
        datosSeleccionados.forEach(d => Object.keys(d.temas).forEach(t => set.add(t)));
        return Array.from(set).sort();
    }, [datosSeleccionados]);

    const todosProgramas = useMemo(() => {
        const set = new Set<string>();
        datosSeleccionados.forEach(d => Object.keys(d.programas).forEach(p => set.add(p)));
        return Array.from(set).sort();
    }, [datosSeleccionados]);

    // Colores fijos para hasta 4 convocatorias (los de los KPIs generales)
    const COLORES_CONVO = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    // Funciones para generar la data plana que Reactharts necesita
    const formatData = (itemSet: string[], type: 'materias' | 'bloques' | 'temas' | 'programas') => {
        return itemSet.map(item => {
            const row: any = { name: item, _total: 0 };
            datosSeleccionados.forEach(d => {
                const val = d[type][item] || 0;
                row[d.ejercicio] = val;
                row._total += val;
            });
            return row;
        }).sort((a, b) => b._total - a._total); // Orden descendente por sumatorio total
    };

    const dataMaterias = useMemo(() => formatData(todasMaterias, 'materias'), [todasMaterias, datosSeleccionados]);
    const dataBloques = useMemo(() => formatData(todosBloques, 'bloques'), [todosBloques, datosSeleccionados]);
    const dataTemas = useMemo(() => formatData(todosTemas, 'temas'), [todosTemas, datosSeleccionados]);
    const dataProgramas = useMemo(() => formatData(todosProgramas, 'programas'), [todosProgramas, datosSeleccionados]);

    // Renderizador genérico de gráfico de barras agrupado (Layout Horizontal)
    const renderChart = (title: string, data: any[]) => {
        if (!data || data.length === 0) return null;

        // Calcular altura dinámica base en la cantidad de elementos (mínimo 300px)
        const chartHeight = Math.max(300, data.length * 50);

        return (
            <div style={{
                padding: '16px', borderRadius: '10px',
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
            }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
                    {title}
                </h4>
                <div style={{ width: '100%', height: chartHeight, fontSize: '12px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-secondary)" />
                            <XAxis
                                type="number"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                tickLine={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={160}
                                tick={{ fill: 'var(--text-primary)', fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--bg-tertiary)' }}
                                contentStyle={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-secondary)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            {datosSeleccionados.map((d, index) => (
                                <Bar
                                    key={d.ejercicio}
                                    dataKey={d.ejercicio}
                                    fill={COLORES_CONVO[index % COLORES_CONVO.length]}
                                    radius={[0, 4, 4, 0]}
                                    animationDuration={1000}
                                >
                                    <LabelList
                                        dataKey={d.ejercicio}
                                        position="right"
                                        fill="var(--text-primary)"
                                        fontSize={11}
                                        fontWeight={600}
                                        formatter={(val: any) => (typeof val === 'number' && val > 0) ? val : ''}
                                    />
                                </Bar>
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Selector de ejercicios */}
            <div style={{
                padding: '16px', borderRadius: '10px',
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <GitCompare className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Seleccionar convocatorias a comparar
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                        (máximo 4)
                    </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                    {[...datos].sort((a, b) => a.ejercicio.localeCompare(b.ejercicio)).map(d => {
                        const sel = seleccionados.includes(d.ejercicio);
                        const disabled = !sel && seleccionados.length >= 4;
                        return (
                            <div
                                key={d.ejercicio}
                                onClick={() => {
                                    if (!disabled) toggleSeleccion(d.ejercicio);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '10px 14px', borderRadius: '8px',
                                    border: `1px solid ${sel ? 'var(--accent-primary)' : 'var(--border-secondary)'}`,
                                    backgroundColor: sel ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                    opacity: disabled ? 0.6 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{
                                    width: '18px', height: '18px', borderRadius: '4px',
                                    border: `2px solid ${sel ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                                    backgroundColor: sel ? 'var(--accent-primary)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, transition: 'all 0.2s ease'
                                }}>
                                    {sel && <Check className="w-3 h-3" style={{ color: '#fff', strokeWidth: 3 }} />}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                        {d.ejercicio}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                        {d.totalPreguntas} preguntas
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {datosSeleccionados.length < 2 ? (
                <div style={{
                    padding: '40px', textAlign: 'center', borderRadius: '10px',
                    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                    color: 'var(--text-tertiary)',
                }}>
                    Es necesario seleccionar al menos 2 convocatorias para comparar.
                </div>
            ) : (
                <>
                    {/* KPIs comparativas */}
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${datosSeleccionados.length}, 1fr)`, gap: '12px' }}>
                        {datosSeleccionados.map(d => (
                            <div key={d.ejercicio} style={{
                                padding: '16px', borderRadius: '10px',
                                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'monospace', marginBottom: '8px' }}>
                                    {d.ejercicio}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'var(--text-tertiary)' }}>Preguntas</span>
                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.totalPreguntas}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ color: 'var(--text-tertiary)' }}>Anuladas</span>
                                        <span style={{ fontWeight: 700, color: d.tasaAnulacion > 0.05 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                                            {Math.round(d.tasaAnulacion * d.totalPreguntas)} <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-tertiary)' }}>({(d.tasaAnulacion * 100).toFixed(1)}%)</span>
                                        </span>
                                    </div>
                                    <div style={{ marginTop: '6px' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Distribución correcta</span>
                                        {(() => {
                                            const colores: Record<string, string> = { A: '#3b82f6', B: '#10b981', C: '#f59e0b', D: '#8b5cf6' };
                                            const maxVal = Math.max(d.distribucionCorrecta.A, d.distribucionCorrecta.B, d.distribucionCorrecta.C, d.distribucionCorrecta.D, 1);
                                            const entries = Object.entries(d.distribucionCorrecta)
                                                .sort(([, a], [, b]) => b - a);
                                            return entries.map(([letra, val]) => {
                                                const pct = d.totalPreguntas > 0 ? ((val / d.totalPreguntas) * 100).toFixed(0) : '0';
                                                return (
                                                    <div key={letra} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: 800, color: colores[letra], width: '14px' }}>{letra}</span>
                                                        <div style={{ flex: 1, height: '12px', borderRadius: '3px', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                                                            <div style={{
                                                                width: `${(val / maxVal) * 100}%`, height: '100%',
                                                                borderRadius: '3px', backgroundColor: colores[letra],
                                                                opacity: 0.7, transition: 'width 0.3s ease',
                                                            }} />
                                                        </div>
                                                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '20px', textAlign: 'right' }}>{val}</span>
                                                        <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', minWidth: '28px' }}>{pct}%</span>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Gráficos comparativos generados por Recharts */}

                    {/* Toggle Barras / Radar */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        {(['barras', 'radar'] as const).map(v => (
                            <button key={v} onClick={() => setVistaRadar(v === 'radar')} style={{
                                padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                border: '1px solid var(--border-primary)', cursor: 'pointer',
                                backgroundColor: (v === 'radar') === vistaRadar ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                color: (v === 'radar') === vistaRadar ? '#fff' : 'var(--text-primary)',
                            }}>{v === 'barras' ? 'Barras' : 'Radar'}</button>
                        ))}
                    </div>

                    {vistaRadar ? (
                        <div style={{
                            padding: '16px', borderRadius: '10px',
                            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Perfil temático (radar)
                                </h4>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {(['materias', 'bloques', 'temas', 'programas'] as const).map(ag => (
                                        <button key={ag} onClick={() => setRadarAgrupacion(ag)} style={{
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                                            border: '1px solid var(--border-primary)', cursor: 'pointer',
                                            backgroundColor: radarAgrupacion === ag ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                            color: radarAgrupacion === ag ? '#fff' : 'var(--text-primary)',
                                        }}>
                                            {ag.charAt(0).toUpperCase() + ag.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={(
                                        radarAgrupacion === 'materias' ? dataMaterias :
                                        radarAgrupacion === 'bloques' ? dataBloques :
                                        radarAgrupacion === 'temas' ? dataTemas :
                                        dataProgramas
                                    ).map(d => {
                                        const row: any = { name: d.name };
                                        datosSeleccionados.forEach(ds => {
                                            const total = ds.totalPreguntas || 1;
                                            row[ds.ejercicio] = Math.round(((d[ds.ejercicio] as number) || 0) / total * 100);
                                        });
                                        return row;
                                    })}>
                                        <PolarGrid stroke="var(--border-secondary)" />
                                        <PolarAngleAxis
                                            dataKey="name"
                                            tick={{ fill: 'var(--text-primary)', fontSize: 11 }}
                                            tickFormatter={(name: string) => name.length > 18 ? name.substring(0, 18) + '...' : name}
                                        />
                                        <PolarRadiusAxis
                                            angle={30}
                                            tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }}
                                            tickFormatter={(v: number) => `${v}%`}
                                        />
                                        {datosSeleccionados.map((d, i) => (
                                            <Radar
                                                key={d.ejercicio}
                                                name={d.ejercicio}
                                                dataKey={d.ejercicio}
                                                stroke={COLORES_CONVO[i % COLORES_CONVO.length]}
                                                fill={COLORES_CONVO[i % COLORES_CONVO.length]}
                                                fillOpacity={0.15}
                                                strokeWidth={2}
                                            />
                                        ))}
                                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-secondary)',
                                                borderRadius: '8px',
                                                color: 'var(--text-primary)',
                                            }}
                                            formatter={(val: number | undefined) => `${val ?? 0}%`}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        <>
                            {renderChart("Distribución por bloque", dataBloques)}
                            {renderChart("Distribución por tema", dataTemas)}
                            {renderChart("Distribución por programa", dataProgramas)}
                            {renderChart("Distribución por materia", dataMaterias)}
                        </>
                    )}
                </>
            )}
        </div>
    );
};
