import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import type { Pregunta } from '../types';

interface Props {
    preguntas: Pregunta[];
}

export const AnalisisAnuladas: React.FC<Props> = ({ preguntas }) => {
    const [agrupacion, setAgrupacion] = useState<'bloque' | 'tema' | 'aplicacion' | 'organismo' | 'año' | 'escala'>('organismo');

    const { total, anuladas, dataGrafico, tasaGlobal } = useMemo(() => {
        const total = preguntas.length;
        const anuladas = preguntas.filter(p => p.anulada).length;
        const tasaGlobal = total > 0 ? ((anuladas / total) * 100).toFixed(2) : '0.00';

        const grupos = new Map<string, { total: number; anuladas: number }>();

        preguntas.forEach(p => {
            let clave = 'Desconocido';
            if (agrupacion === 'bloque') clave = p.bloque || 'Sin bloque';
            if (agrupacion === 'tema') clave = p.tema || 'Sin tema';
            if (agrupacion === 'aplicacion') clave = p.aplicacion || 'Sin aplicación';
            if (agrupacion === 'organismo') clave = p.metadatos?.organismo || 'Desconocido';
            if (agrupacion === 'año') clave = p.metadatos?.año?.toString() || 'N/A';
            if (agrupacion === 'escala') clave = p.metadatos?.escala || 'N/A';

            if (!grupos.has(clave)) grupos.set(clave, { total: 0, anuladas: 0 });
            const current = grupos.get(clave)!;
            current.total += 1;
            if (p.anulada) current.anuladas += 1;
        });

        const dataGrafico = Array.from(grupos.entries())
            .map(([name, stats]) => ({
                name: name.length > 25 ? name.substring(0, 25) + '...' : name,
                'Cant. Anuladas': stats.anuladas,
                'Tasa Impugnación (%)': stats.total > 0 ? parseFloat(((stats.anuladas / stats.total) * 100).toFixed(1)) : 0,
                Total: stats.total
            }))
            .filter(d => d['Cant. Anuladas'] > 0)
            .sort((a, b) => b['Cant. Anuladas'] - a['Cant. Anuladas'])
            .slice(0, 15);

        return { total, anuladas, dataGrafico, tasaGlobal };
    }, [preguntas, agrupacion]);

    if (total === 0) return null;

    return (
        <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-heading">Radiografía de Anulaciones e Impugnaciones</h2>
                    <p className="text-sm text-muted mt-1">
                        Análisis volumétrico y de tasa de impugnación exitosa dictaminada por los tribunales.
                    </p>
                </div>
                <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    {(['organismo', 'año', 'bloque', 'tema', 'aplicacion', 'escala'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setAgrupacion(t)}
                            className="px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize"
                            style={{
                                backgroundColor: agrupacion === t ? 'var(--bg-secondary)' : 'transparent',
                                color: agrupacion === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                                boxShadow: agrupacion === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                    <div className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Total de la muestra</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{total}</div>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                    <div className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Anuladas (Volumen)</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--accent-warning)' }}>{anuladas}</div>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                    <div className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Tasa Media</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--accent-danger)' }}>{tasaGlobal}%</div>
                </div>
            </div>

            {dataGrafico.length === 0 ? (
                <div className="text-center p-8 text-muted border border-dashed rounded-lg" style={{ borderColor: 'var(--border-secondary)' }}>
                    No se detectan preguntas anuladas bajo los actuales parámetros de segmentación y filtrado.
                </div>
            ) : (
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart data={dataGrafico} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} stroke="var(--border-secondary)" />
                            <XAxis
                                dataKey="name"
                                stroke="var(--text-tertiary)"
                                fontSize={11}
                                tickMargin={12}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke="var(--text-tertiary)"
                                fontSize={12}
                                orientation="left"
                            />
                            <YAxis
                                yAxisId="right"
                                stroke="var(--text-tertiary)"
                                fontSize={12}
                                orientation="right"
                                tickFormatter={(val) => `${val}%`}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--bg-tertiary)', opacity: 0.5 }}
                                contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '13px' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar yAxisId="left" dataKey="Cant. Anuladas" name="Volumen Total" radius={[4, 4, 0, 0]}>
                                {dataGrafico.map((_entry, index) => (
                                    <Cell key={`cell-vol-${index}`} fill={'var(--accent-danger)'} opacity={0.8} />
                                ))}
                            </Bar>
                            <Bar yAxisId="right" dataKey="Tasa Impugnación (%)" name="Tasa de Impugnación %" radius={[4, 4, 0, 0]}>
                                {dataGrafico.map((_entry, index) => (
                                    <Cell key={`cell-tasa-${index}`} fill={'var(--accent-warning)'} opacity={0.6} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};
