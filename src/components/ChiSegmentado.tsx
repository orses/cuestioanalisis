import React, { useMemo } from 'react';
import type { Pregunta } from '../types';
import { calcularChiCuadradoSegmentado } from '../utils/analytics';
import { BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface ChiSegmentadoProps {
    preguntas: Pregunta[];
}

export const ChiSegmentado: React.FC<ChiSegmentadoProps> = ({ preguntas }) => {
    const datos = useMemo(() => calcularChiCuadradoSegmentado(preguntas), [preguntas]);

    if (datos.length === 0) return null;

    const sesgados = datos.filter(d => d.sesgado).length;

    return (
        <div style={{
            padding: '20px', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Sesgo por Convocatoria (χ² Segmentado)
                </h3>
                <InfoTooltip texto="Analiza la distribución de respuestas correctas (A/B/C/D) de forma independiente para cada convocatoria. Un semáforo rojo indica que esa convocatoria tiene un sesgo estadísticamente significativo (p < 0,05)." />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: 1.5 }}>
                {sesgados} de {datos.length} convocatorias presentan sesgo significativo en la distribución de respuestas correctas.
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-primary)' }}>
                            {['Convocatoria', 'Año', 'N', 'A', 'B', 'C', 'D', 'χ²', 'p-valor', 'Estado'].map(h => (
                                <th key={h} style={{
                                    padding: '8px 10px', textAlign: h === 'Convocatoria' ? 'left' : 'center',
                                    fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)',
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                    backgroundColor: 'var(--bg-tertiary)',
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {datos.map((d, i) => {
                            const maxLetra = Object.entries(d.distribucion)
                                .sort(([, a], [, b]) => b - a)[0][0];
                            return (
                                <tr key={d.ejercicio} style={{
                                    borderBottom: '1px solid var(--border-secondary)',
                                    backgroundColor: i % 2 === 1 ? 'var(--bg-tertiary)' : 'transparent',
                                }}>
                                    <td style={{
                                        padding: '8px 10px', fontWeight: 600,
                                        color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '11px',
                                    }}>{d.ejercicio}</td>
                                    <td style={{ padding: '8px 6px', textAlign: 'center', color: 'var(--text-primary)' }}>{d.año}</td>
                                    <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>{d.totalPreguntas}</td>
                                    {['A', 'B', 'C', 'D'].map(l => {
                                        const val = d.distribucion[l];
                                        const pct = d.totalPreguntas > 0 ? ((val / d.totalPreguntas) * 100).toFixed(0) : '0';
                                        const esMax = l === maxLetra && d.sesgado;
                                        return (
                                            <td key={l} style={{
                                                padding: '8px 6px', textAlign: 'center',
                                                fontWeight: esMax ? 800 : 500,
                                                color: esMax ? 'var(--accent-danger)' : 'var(--text-primary)',
                                            }}>
                                                {val} <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>({pct}%)</span>
                                            </td>
                                        );
                                    })}
                                    <td style={{
                                        padding: '8px 6px', textAlign: 'center', fontWeight: 700,
                                        color: d.sesgado ? 'var(--accent-danger)' : 'var(--text-primary)',
                                    }}>{d.chiSquare.toFixed(2)}</td>
                                    <td style={{
                                        padding: '8px 6px', textAlign: 'center', fontWeight: 600,
                                        color: d.sesgado ? 'var(--accent-danger)' : 'var(--text-tertiary)',
                                    }}>{d.pValue < 0.001 ? '< 0,001' : d.pValue.toFixed(3).replace('.', ',')}</td>
                                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                                        {d.sesgado
                                            ? <AlertCircle className="w-4 h-4" style={{ color: 'var(--accent-danger)', display: 'inline' }} />
                                            : <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-success)', display: 'inline' }} />
                                        }
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
