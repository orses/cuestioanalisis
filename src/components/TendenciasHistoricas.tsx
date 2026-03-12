import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Pregunta } from '../types';

interface Props {
    preguntas: Pregunta[];
}

export const TendenciasHistoricas: React.FC<Props> = ({ preguntas }) => {
    const [agrupacion, setAgrupacion] = useState<'bloque' | 'tema' | 'aplicacion'>('bloque');
    const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

    const toggleLine = (dataKey: string) => {
        setHiddenLines(prev => {
            const next = new Set(prev);
            if (next.has(dataKey)) next.delete(dataKey);
            else next.add(dataKey);
            return next;
        });
    };

    const { data, lineas } = useMemo(() => {
        // Filtrar preguntas con año numérico válido o bien formateado
        const validas = preguntas.filter(p => {
            const a = p.metadatos?.año;
            if (!a) return false;
            const str = a.toString();
            return str !== 'N/A' && str !== 'Varios' && str.match(/^\d{4}$/);
        });

        // Encontrar el top 5 históricas del set según la agrupación elegida
        const conteoGlobal = new Map<string, number>();
        validas.forEach(p => {
            let m = 'Desconocido';
            if (agrupacion === 'bloque') m = p.bloque || 'Sin bloque';
            if (agrupacion === 'tema') m = p.tema || 'Sin tema';
            if (agrupacion === 'aplicacion') m = p.aplicacion || 'Sin aplicación';
            conteoGlobal.set(m, (conteoGlobal.get(m) || 0) + 1);
        });
        const top5 = Array.from(conteoGlobal.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(e => e[0]);

        // Agrupar por año
        const porAno = new Map<string, Pregunta[]>();
        validas.forEach(p => {
            const ano = p.metadatos.año.toString();
            if (!porAno.has(ano)) porAno.set(ano, []);
            porAno.get(ano)!.push(p);
        });

        // Construir data para Recharts
        const anosOrdenados = Array.from(porAno.keys()).sort();
        const chartData = anosOrdenados.map(ano => {
            const pregs = porAno.get(ano)!;
            const total = pregs.length;

            const conteoLocal = new Map<string, number>();
            pregs.forEach(p => {
                let m = 'Desconocido';
                if (agrupacion === 'bloque') m = p.bloque || 'Sin bloque';
                if (agrupacion === 'tema') m = p.tema || 'Sin tema';
                if (agrupacion === 'aplicacion') m = p.aplicacion || 'Sin aplicación';
                conteoLocal.set(m, (conteoLocal.get(m) || 0) + 1);
            });

            const punto: Record<string, any> = { name: ano };
            top5.forEach(mat => {
                const cant = conteoLocal.get(mat) || 0;
                punto[mat] = parseFloat(((cant / total) * 100).toFixed(1));
                punto[`${mat}_abs`] = cant;
            });
            return punto;
        });

        return { data: chartData, lineas: top5 };
    }, [preguntas, agrupacion]);

    const colores = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

    if (data.length === 0) {
        return (
            <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
                <h2 className="text-lg font-bold text-heading mb-4">Tendencias Temporales</h2>
                <div className="text-center text-muted p-4">
                    No hay suficientes preguntas con un "Año" definido para proyectar tendencias históricas.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-heading mb-2">Evolución Histórica de Temáticas</h2>
                    <p className="text-sm text-muted">
                        Porcentaje que representa cada {agrupacion} sobre el total de preguntas de cada año.
                        Muestra el top 5 dominante para el contexto actual.
                    </p>
                </div>
                <div className="flex gap-2 p-1 rounded-lg shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    {(['bloque', 'tema', 'aplicacion'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => { setAgrupacion(t); setHiddenLines(new Set()); }}
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

            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" opacity={0.5} vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--text-tertiary)"
                            fontSize={12}
                            tickMargin={12}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="var(--text-tertiary)"
                            fontSize={12}
                            tickFormatter={(val) => `${val}%`}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border-secondary)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)'
                            }}
                            itemStyle={{ fontSize: '13px' }}
                            labelStyle={{ fontWeight: 800, marginBottom: '4px', color: 'var(--text-primary)' }}
                            formatter={(value: any, name: any, props: any) => {
                                const absValue = props.payload[`${name}_abs`];
                                return [`${value}% (${absValue} pregs.)`, name];
                            }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: '13px', paddingTop: '20px', cursor: 'pointer' }}
                            iconType="circle"
                            onClick={(e: any) => { if (e && e.dataKey) toggleLine(e.dataKey); }}
                        />
                        {lineas.map((materia, i) => (
                            <Line
                                key={materia}
                                hide={hiddenLines.has(materia)}
                                type="monotone"
                                dataKey={materia}
                                stroke={colores[i % colores.length]}
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-secondary)' }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: colores[i % colores.length] }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
