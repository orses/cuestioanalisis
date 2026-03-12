import React, { useMemo } from 'react';
import type { Pregunta } from '../types';
import { analizarConfusion } from '../utils/analytics';
import { AlertTriangle, Zap, Lightbulb, ArrowLeftRight } from 'lucide-react';

interface AnalisisConfusionProps {
    preguntas: Pregunta[];
}

export const AnalisisConfusion: React.FC<AnalisisConfusionProps> = ({ preguntas }) => {
    const patrones = useMemo(() => analizarConfusion(preguntas), [preguntas]);

    return (
        <div style={{
            padding: '20px', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Análisis de confusión — distractores recurrentes
                    </h3>
                </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Pares de conceptos que los tribunales usan como confusores mutuos (aparecen simultáneamente en la opción correcta y en los distractores).
                Estudiar estos pares juntos es clave.
            </p>

            {patrones.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>
                    No se detectaron patrones de confusión con suficiente frecuencia.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {patrones.map((p, i) => (
                        <div key={i} style={{
                            padding: '12px 16px', borderRadius: '8px',
                            border: '1px solid var(--border-secondary)',
                            backgroundColor: i < 3 ? 'rgba(245,158,11,0.05)' : 'transparent',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                {/* Conceptos */}
                                <span style={{
                                    fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)',
                                    padding: '2px 8px', borderRadius: '4px',
                                    backgroundColor: 'rgba(99,102,241,0.1)',
                                }}>
                                    {p.conceptoA}
                                </span>
                                {p.conceptoA !== p.conceptoB && (
                                    <>
                                        <span style={{ color: 'var(--text-tertiary)', display: 'flex' }}><ArrowLeftRight className="w-3.5 h-3.5" /></span>
                                        <span style={{
                                            fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)',
                                            padding: '2px 8px', borderRadius: '4px',
                                            backgroundColor: 'rgba(245,158,11,0.1)',
                                        }}>
                                            {p.conceptoB}
                                        </span>
                                    </>
                                )}
                                <span style={{
                                    fontSize: '11px', fontWeight: 800,
                                    padding: '2px 6px', borderRadius: '10px',
                                    backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                                    marginLeft: 'auto',
                                }}>
                                    {p.frecuencia}×
                                </span>
                            </div>

                            {/* Consejo */}
                            <p style={{
                                fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600,
                                lineHeight: 1.5, margin: '0 0 6px 0', fontStyle: 'italic',
                                display: 'flex', alignItems: 'flex-start', gap: '6px'
                            }}>
                                <Lightbulb className="w-4 h-4 flex-shrink-0" />
                                <span>{p.consejo}</span>
                            </p>

                            {/* Ejemplos */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {p.ejemplos.map((ej, j) => (
                                    <span key={j} style={{
                                        fontSize: '10px', color: 'var(--text-tertiary)',
                                        padding: '2px 6px', borderRadius: '4px',
                                        backgroundColor: 'var(--bg-tertiary)', lineHeight: 1.4,
                                    }}>
                                        [{ej.año}] {ej.enunciado}…
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
