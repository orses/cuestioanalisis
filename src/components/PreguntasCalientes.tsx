import React, { useMemo, useState } from 'react';
import type { Pregunta } from '../types';
import { detectarPreguntasCalientes } from '../utils/analytics';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react';

interface PreguntasCalientesProps {
    preguntas: Pregunta[];
    onVerPregunta?: (id: string) => void;
}

export const PreguntasCalientes: React.FC<PreguntasCalientesProps> = ({ preguntas, onVerPregunta }) => {
    const conceptos = useMemo(() => detectarPreguntasCalientes(preguntas, 25), [preguntas]);
    const [expandido, setExpandido] = useState<number | null>(null);
    const [verTodas, setVerTodas] = useState<Set<number>>(new Set());

    const tendenciaIcon = (t: string) => {
        if (t === 'creciente') return <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--accent-success)' }} />;
        if (t === 'decreciente') return <TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--accent-danger)' }} />;
        return <Minus className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />;
    };

    const tendenciaTexto = (t: string) => {
        if (t === 'creciente') return 'Tendencia creciente — alto riesgo de repetición';
        if (t === 'decreciente') return 'Tendencia decreciente';
        return 'Estable a lo largo del tiempo';
    };

    const maxFreq = conceptos.length > 0 ? conceptos[0].frecuencia : 1;

    return (
        <div style={{
            padding: '20px', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Flame className="w-5 h-5" style={{ color: 'var(--accent-danger)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Conceptos Calientes — Temas Más Repetidos
                </h3>
            </div>

            {conceptos.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>
                    No se detectaron conceptos recurrentes con suficiente frecuencia.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {conceptos.map((c, i) => {
                        const barWidth = (c.frecuencia / maxFreq) * 100;
                        const esCreciente = c.tendencia === 'creciente';
                        return (
                            <div key={i}>
                                <button
                                    onClick={() => setExpandido(expandido === i ? null : i)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                                        border: 'none', textAlign: 'left',
                                        backgroundColor: expandido === i ? 'var(--bg-tertiary)' : 'transparent',
                                    }}
                                >
                                    {expandido === i
                                        ? <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                        : <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                    }
                                    <span style={{
                                        fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)',
                                        minWidth: '160px',
                                    }}>
                                        {c.concepto}
                                    </span>
                                    {tendenciaIcon(c.tendencia)}
                                    <div style={{ flex: 1, position: 'relative', height: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                                        <div style={{
                                            position: 'absolute', left: 0, top: 0, bottom: 0,
                                            width: `${barWidth}%`, borderRadius: '4px',
                                            backgroundColor: esCreciente ? 'var(--accent-danger)' : 'var(--accent-primary)',
                                            opacity: 0.6,
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', minWidth: '30px', textAlign: 'right' }}>
                                        {c.frecuencia}
                                    </span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', minWidth: '80px' }}>
                                        {c.años[0]}–{c.años[c.años.length - 1]}
                                    </span>
                                </button>

                                {expandido === i && (
                                    <div style={{
                                        padding: '8px 12px 12px 36px',
                                        display: 'flex', flexDirection: 'column', gap: '6px',
                                    }}>
                                        <div style={{
                                            fontSize: '11px', fontWeight: 600,
                                            color: esCreciente ? 'var(--accent-danger)' : 'var(--text-tertiary)',
                                            marginBottom: '4px',
                                        }}>
                                            {tendenciaTexto(c.tendencia)} · Aparece en {c.años.length} convocatorias
                                        </div>
                                        {(verTodas.has(i) ? c.preguntas : c.preguntas.slice(0, 5)).map(p => (
                                            <div key={p.id} style={{
                                                padding: '6px 10px', borderRadius: '4px', fontSize: '12px',
                                                backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)',
                                                color: 'var(--text-primary)', lineHeight: 1.5,
                                                cursor: onVerPregunta ? 'pointer' : 'default',
                                                transition: 'border-color 0.15s',
                                            }}
                                                onClick={() => onVerPregunta?.(p.id)}
                                                onMouseEnter={e => { if (onVerPregunta) e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
                                            >
                                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)', marginRight: '8px' }}>
                                                    {p.metadatos.año}
                                                </span>
                                                {p.enunciado.substring(0, 120)}{p.enunciado.length > 120 ? '…' : ''}
                                            </div>
                                        ))}
                                        {c.preguntas.length > 5 && !verTodas.has(i) && (
                                            <button
                                                onClick={() => setVerTodas(prev => new Set(prev).add(i))}
                                                style={{
                                                    fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600,
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    padding: '4px 0', textAlign: 'left',
                                                }}
                                            >
                                                + {c.preguntas.length - 5} preguntas más
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
