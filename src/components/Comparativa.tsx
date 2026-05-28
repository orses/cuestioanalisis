import React, { useCallback, useMemo, useState } from 'react';
import type { Pregunta } from '../types';
import { generarComparativa } from '../utils/analytics';
import {
    ANSWER_DISTRIBUTION_COLORS,
    COMPARISON_SERIES_COLORS,
} from '../utils/colorPalettes';
import { buildOrganismBrandColorMap } from '../utils/organismBrandColors';
import {
    formatAccessLabel,
    formatCallTypeLabel,
    formatExerciseTypeLabel,
    formatModelLabel,
    formatQuotaLabel,
    formatScaleLabel,
    formatVariantLabel,
} from '../utils/metadata';
import { GitCompare, Check } from 'lucide-react';
import {
    ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LabelList,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface ComparativaProps {
    preguntas: Pregunta[];
}

type AgrupacionComparativa = 'materias' | 'bloques' | 'temas' | 'programas';
type ChartRow = Record<string, string | number> & { name: string; _total: number };
const TARJETAS_POR_FILA = [1, 2, 3, 4, 5] as const;
type TarjetasPorFila = typeof TARJETAS_POR_FILA[number];

export const Comparativa: React.FC<ComparativaProps> = ({ preguntas }) => {
    const datos = useMemo(() => generarComparativa(preguntas), [preguntas]);
    const [seleccionados, setSeleccionados] = useState<string[]>([]);
    const [vistaRadar, setVistaRadar] = useState(false);
    const [radarAgrupacion, setRadarAgrupacion] = useState<AgrupacionComparativa>('materias');
    const [tarjetasPorFila, setTarjetasPorFila] = useState<TarjetasPorFila>(3);

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

    // Funciones para generar la data plana que Reactharts necesita
    const formatData = useCallback((itemSet: string[], type: AgrupacionComparativa): ChartRow[] => {
        return itemSet.map(item => {
            const row: ChartRow = { name: item, _total: 0 };
            datosSeleccionados.forEach(d => {
                const val = d[type][item] || 0;
                row[d.ejercicio] = val;
                row._total += val;
            });
            return row;
        }).sort((a, b) => b._total - a._total); // Orden descendente por sumatorio total
    }, [datosSeleccionados]);

    const dataMaterias = useMemo(() => formatData(todasMaterias, 'materias'), [todasMaterias, formatData]);
    const dataBloques = useMemo(() => formatData(todosBloques, 'bloques'), [todosBloques, formatData]);
    const dataTemas = useMemo(() => formatData(todosTemas, 'temas'), [todosTemas, formatData]);
    const dataProgramas = useMemo(() => formatData(todosProgramas, 'programas'), [todosProgramas, formatData]);

    // Renderizador genérico de gráfico de barras agrupado (Layout Horizontal)
    const renderChart = (title: string, data: ChartRow[]) => {
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
                                    fill={COMPARISON_SERIES_COLORS[index % COMPARISON_SERIES_COLORS.length]}
                                    radius={[0, 4, 4, 0]}
                                    animationDuration={1000}
                                >
                                    <LabelList
                                        dataKey={d.ejercicio}
                                        position="right"
                                        fill="var(--text-primary)"
                                        fontSize={11}
                                        fontWeight={600}
                                        formatter={(val: unknown) => (typeof val === 'number' && val > 0) ? val : ''}
                                    />
                                </Bar>
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    const organismColorMap = useMemo(
        () => buildOrganismBrandColorMap(datos.map(d => d.organismo)),
        [datos]
    );

    const getOrganismColor = (organismo: string) => organismColorMap.get(organismo) || 'var(--border-primary)';
    const minGridWidth = tarjetasPorFila === 1 ? '0' : `${tarjetasPorFila * 220 + (tarjetasPorFila - 1) * 12}px`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Selector de ejercicios */}
            <div style={{
                padding: '16px', borderRadius: '10px',
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GitCompare className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Seleccionar convocatorias a comparar
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                            (máximo 4)
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div
                            role="group"
                            aria-label="Tarjetas por fila"
                            data-testid="comparison-cards-per-row"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', marginRight: '2px' }}>
                                Tarjetas por fila
                            </span>
                            {TARJETAS_POR_FILA.map(valor => (
                                <button
                                    key={valor}
                                    type="button"
                                    aria-label={`${valor} tarjetas por fila`}
                                    aria-pressed={tarjetasPorFila === valor}
                                    onClick={() => setTarjetasPorFila(valor)}
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        border: `1px solid ${tarjetasPorFila === valor ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                                        backgroundColor: tarjetasPorFila === valor ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                        color: tarjetasPorFila === valor ? '#fff' : 'var(--text-primary)',
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {valor}
                                </button>
                            ))}
                        </div>

                        {seleccionados.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSeleccionados([])}
                                style={{
                                    fontSize: '11px', fontWeight: 600, color: 'var(--accent-danger)',
                                    backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                                    padding: '4px 8px', borderRadius: '4px'
                                }}
                            >
                                Desmarcar todo
                            </button>
                        )}
                    </div>
                </div>
                <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
                    <div
                        data-testid="comparison-exercise-grid"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${tarjetasPorFila}, minmax(0, 1fr))`,
                            gap: '12px',
                            minWidth: minGridWidth,
                        }}
                    >
                        {datos.map(d => {
                            const sel = seleccionados.includes(d.ejercicio);
                            const disabled = !sel && seleccionados.length >= 4;
                            const organismColor = getOrganismColor(d.organismo);
                            const metadataItems = [
                                { label: 'Organismo', value: d.organismo },
                                { label: 'Escala', value: formatScaleLabel(d.escala, 'short') },
                                { label: 'Año', value: d.año > 0 ? String(d.año) : 'Sin año' },
                                { label: 'Acceso', value: formatAccessLabel(d.acceso, 'short') },
                                d.tipoConvocatoria ? { label: 'Conv.', value: formatCallTypeLabel(d.tipoConvocatoria, 'short') } : null,
                                d.cupo ? { label: 'Cupo', value: formatQuotaLabel(d.cupo) } : null,
                                d.tipo ? { label: 'Ejerc.', value: formatExerciseTypeLabel(d.tipo) } : null,
                                d.modelo ? { label: 'Modelo', value: formatModelLabel(d.modelo) } : null,
                                d.variante ? { label: 'Var.', value: formatVariantLabel(d.variante) } : null,
                                { label: 'Preguntas', value: String(d.totalPreguntas) },
                            ].filter((item): item is { label: string; value: string } => Boolean(item));

                            return (
                                <button
                                    key={d.ejercicio}
                                    type="button"
                                    data-testid="comparison-exercise-card"
                                    data-organism={d.organismo}
                                    data-scale={d.escala}
                                    data-year={String(d.año)}
                                    data-access={d.acceso}
                                    data-call-type={d.tipoConvocatoria}
                                    data-exercise-type={d.tipo}
                                    data-exercise={d.ejercicio}
                                    data-selected={sel ? 'true' : 'false'}
                                    aria-pressed={sel}
                                    disabled={disabled}
                                    onClick={() => toggleSeleccion(d.ejercicio)}
                                    style={{
                                        width: '100%',
                                        minHeight: '112px',
                                        display: 'grid',
                                        gridTemplateColumns: '24px minmax(0, 1fr)',
                                        alignItems: 'start',
                                        gap: '12px',
                                        padding: '12px 14px',
                                        borderRadius: '8px',
                                        borderTop: `1px solid ${sel ? 'var(--accent-primary)' : 'var(--border-secondary)'}`,
                                        borderRight: `1px solid ${sel ? 'var(--accent-primary)' : 'var(--border-secondary)'}`,
                                        borderBottom: `1px solid ${sel ? 'var(--accent-primary)' : 'var(--border-secondary)'}`,
                                        borderLeft: `4px solid ${organismColor}`,
                                        backgroundColor: sel ? 'var(--bg-active)' : 'var(--bg-primary)',
                                        boxShadow: sel ? '0 0 0 2px var(--accent-primary), 0 8px 18px rgba(15, 23, 42, 0.12)' : 'none',
                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                        opacity: disabled ? 0.55 : 1,
                                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                                        textAlign: 'left',
                                        font: 'inherit',
                                    }}
                                >
                                    <span style={{
                                        width: '22px', height: '22px', borderRadius: '6px',
                                        border: `2px solid ${sel ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                                        backgroundColor: sel ? 'var(--accent-primary)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, transition: 'all 0.2s ease'
                                    }}>
                                        {sel && <Check className="w-3.5 h-3.5" style={{ color: '#fff', strokeWidth: 3 }} />}
                                    </span>
                                    <span style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                                        <span style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                            <span
                                                data-testid="comparison-exercise-title"
                                                title={d.ejercicio}
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: 800,
                                                    color: 'var(--text-primary)',
                                                    lineHeight: 1.35,
                                                    overflowWrap: 'anywhere',
                                                    whiteSpace: 'normal',
                                                }}
                                            >
                                                {d.ejercicio}
                                            </span>
                                            {sel && (
                                                <span
                                                    data-testid="comparison-selected-badge"
                                                    style={{
                                                        flexShrink: 0,
                                                        fontSize: '10px',
                                                        fontWeight: 800,
                                                        color: '#fff',
                                                        backgroundColor: 'var(--accent-primary)',
                                                        borderRadius: '999px',
                                                        padding: '2px 7px',
                                                        lineHeight: 1.4,
                                                    }}
                                                >
                                                    Seleccionada
                                                </span>
                                            )}
                                        </span>
                                        <span style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                            {metadataItems.map(item => (
                                                <span
                                                    key={`${item.label}-${item.value}`}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        minHeight: '22px',
                                                        maxWidth: '100%',
                                                        padding: '2px 7px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--border-secondary)',
                                                        backgroundColor: sel ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                                                        color: 'var(--text-secondary)',
                                                        fontSize: '11px',
                                                        lineHeight: 1.25,
                                                    }}
                                                >
                                                    <span style={{ fontWeight: 700, color: 'var(--text-tertiary)' }}>{item.label}</span>
                                                    <span style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{item.value}</span>
                                                </span>
                                            ))}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
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
                                            const maxVal = Math.max(d.distribucionCorrecta.A, d.distribucionCorrecta.B, d.distribucionCorrecta.C, d.distribucionCorrecta.D, 1);
                                            const entries = Object.entries(d.distribucionCorrecta)
                                                .sort(([, a], [, b]) => b - a);
                                            return entries.map(([letra, val]) => {
                                                const pct = d.totalPreguntas > 0 ? ((val / d.totalPreguntas) * 100).toFixed(0) : '0';
                                                return (
                                                    <div key={letra} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: 800, color: ANSWER_DISTRIBUTION_COLORS[letra], width: '14px' }}>{letra}</span>
                                                        <div style={{ flex: 1, height: '12px', borderRadius: '3px', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                                                            <div style={{
                                                                width: `${(val / maxVal) * 100}%`, height: '100%',
                                                                borderRadius: '3px', backgroundColor: ANSWER_DISTRIBUTION_COLORS[letra],
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
                                        const row: Record<string, string | number> = { name: d.name };
                                        datosSeleccionados.forEach(ds => {
                                            const total = ds.totalPreguntas || 1;
                                            const valor = d[ds.ejercicio];
                                            row[ds.ejercicio] = Math.round(((typeof valor === 'number' ? valor : 0) / total) * 100);
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
                                                stroke={COMPARISON_SERIES_COLORS[i % COMPARISON_SERIES_COLORS.length]}
                                                fill={COMPARISON_SERIES_COLORS[i % COMPARISON_SERIES_COLORS.length]}
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
                                            formatter={(val: unknown) => `${typeof val === 'number' ? val : Number(val) || 0}%`}
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
