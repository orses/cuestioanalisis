import React, { useMemo } from 'react';
import type { Pregunta } from '../types';
import { calcularChiCuadrado } from '../utils/analytics';
import { BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ChiCuadradoProps {
    preguntas: Pregunta[];
}

export const ChiCuadrado: React.FC<ChiCuadradoProps> = ({ preguntas }) => {
    const data = useMemo(() => calcularChiCuadrado(preguntas), [preguntas]);

    const maxVal = Math.max(...Object.values(data.distribucion));
    const sesgado = data.pValue < 0.05;

    return (
        <div style={{
            padding: '20px', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Distribución de Respuestas Correctas
                </h3>
            </div>

            {data.total === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>No hay datos.</p>
            ) : (
                <>
                    {/* Barras */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '140px', marginBottom: '16px' }}>
                        {data.letras.map(l => {
                            const valor = data.distribucion[l];
                            const pct = data.total > 0 ? (valor / data.total) * 100 : 0;
                            const h = maxVal > 0 ? (valor / maxVal) * 120 : 0;
                            const desviado = Math.abs(pct - 25) > 3; // >3pp de desviación
                            const colores: Record<string, string> = { A: '#3b82f6', B: '#10b981', C: '#f59e0b', D: '#8b5cf6' };
                            return (
                                <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <span style={{
                                        fontSize: '12px', fontWeight: 700,
                                        color: desviado ? 'var(--accent-danger)' : 'var(--text-primary)',
                                    }}>
                                        {pct.toFixed(1)}%
                                    </span>
                                    <div style={{
                                        width: '100%', maxWidth: '80px', height: `${h}px`,
                                        borderRadius: '6px 6px 4px 4px',
                                        backgroundColor: colores[l],
                                        opacity: desviado ? 1 : 0.7,
                                        transition: 'height 0.3s ease',
                                    }} />
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{l}</span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{valor}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Línea de referencia 25% */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        borderTop: '1px dashed var(--border-primary)', paddingTop: '12px',
                    }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            Esperado equitativo: {data.esperado.toFixed(0)} por letra (25%)
                        </span>
                    </div>

                    {/* Resultado chi² */}
                    <div style={{
                        marginTop: '12px', padding: '12px 16px', borderRadius: '8px',
                        backgroundColor: sesgado ? 'rgba(220,38,38,0.08)' : 'rgba(34,197,94,0.08)',
                        border: `1px solid ${sesgado ? 'var(--accent-danger)' : 'var(--accent-success)'}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                χ² = {data.chiSquare.toFixed(2)}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                p = {data.pValue < 0.001 ? '< 0,001' : data.pValue.toFixed(3).replace('.', ',')}
                            </span>
                            <span style={{
                                fontSize: '12px', fontWeight: 600,
                                color: sesgado ? 'var(--accent-danger)' : 'var(--accent-success)',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                                {sesgado
                                    ? <><AlertCircle className="w-4 h-4" /> Sesgo estadísticamente significativo (p &lt; 0,05)</>
                                    : <><CheckCircle2 className="w-4 h-4" /> Sin sesgo significativo — distribución equilibrada</>}
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
