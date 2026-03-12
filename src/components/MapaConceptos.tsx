import React, { useMemo, useState } from 'react';
import type { Pregunta } from '../types';
import { mapaConceptosPorTema } from '../utils/analytics';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';

interface MapaConceptosProps {
    preguntas: Pregunta[];
    onVerPregunta?: (id: string) => void;
}

export const MapaConceptos: React.FC<MapaConceptosProps> = ({ preguntas, onVerPregunta }) => {
    const [campo, setCampo] = useState<'bloque' | 'tema' | 'aplicacion'>('bloque');
    const datos = useMemo(() => mapaConceptosPorTema(preguntas, campo), [preguntas, campo]);
    const [expandido, setExpandido] = useState<number | null>(null);
    const [conceptoExpandido, setConceptoExpandido] = useState<string | null>(null);
    const [verTodas, setVerTodas] = useState<Set<string>>(new Set());

    return (
        <div style={{
            padding: '20px', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Mapa de conceptos clave por tema
                    </h3>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {(['bloque', 'tema', 'aplicacion'] as const).map(c => (
                        <button key={c} onClick={() => { setCampo(c); setExpandido(null); }} style={{
                            padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                            border: '1px solid var(--border-primary)', cursor: 'pointer',
                            backgroundColor: campo === c ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                            color: campo === c ? '#fff' : 'var(--text-primary)',
                            textTransform: 'capitalize'
                        }}>
                            {c}
                        </button>
                    ))}
                </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Conceptos más preguntados dentro de cada tema. Sirve como índice de estudio para saber qué dominar prioritariamente.
            </p>

            {datos.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>No hay datos.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {datos.map((tema, i) => (
                        <div key={i} style={{
                            borderRadius: '8px', overflow: 'hidden',
                            border: `1px solid ${expandido === i ? 'var(--accent-primary)' : 'var(--border-secondary)'}`,
                        }}>
                            <button
                                onClick={() => setExpandido(expandido === i ? null : i)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px 14px', cursor: 'pointer', border: 'none', textAlign: 'left',
                                    backgroundColor: expandido === i ? 'var(--bg-tertiary)' : 'transparent',
                                }}
                            >
                                {expandido === i
                                    ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                    : <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                }
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
                                    {tema.tema}
                                </span>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700,
                                    padding: '2px 8px', borderRadius: '10px',
                                    backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                                }}>
                                    {tema.totalPreguntas} preg.
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                    {tema.conceptos.length} conceptos
                                </span>
                            </button>

                            {expandido === i && (
                                <div style={{ padding: '8px 14px 14px 38px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {tema.conceptos.map((c, j) => {
                                            const maxFreq = tema.conceptos[0].frecuencia;
                                            const barW = maxFreq > 0 ? (c.frecuencia / maxFreq) * 100 : 0;
                                            return (
                                                <div key={j}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', width: '16px', textAlign: 'right' }}>
                                                            {j + 1}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', minWidth: '150px',
                                                            cursor: c.preguntas?.length ? 'pointer' : 'default',
                                                        }}
                                                            onClick={() => c.preguntas?.length && setConceptoExpandido(conceptoExpandido === `${i}-${j}` ? null : `${i}-${j}`)}
                                                        >
                                                            {c.concepto}
                                                        </span>
                                                        <div style={{ flex: 1, height: '10px', borderRadius: '3px', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                                                            <div style={{
                                                                width: `${barW}%`, height: '100%', borderRadius: '3px',
                                                                backgroundColor: j < 3 ? 'var(--accent-primary)' : 'var(--accent-success)',
                                                                opacity: 0.6,
                                                            }} />
                                                        </div>
                                                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '24px', textAlign: 'right' }}>
                                                            {c.frecuencia}×
                                                        </span>
                                                        {c.preguntas && c.preguntas.length > 0 && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setConceptoExpandido(conceptoExpandido === `${i}-${j}` ? null : `${i}-${j}`); }}
                                                                style={{
                                                                    fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 600,
                                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                                    padding: '0 4px', display: 'flex', alignItems: 'center', gap: '2px',
                                                                }}
                                                                title={conceptoExpandido === `${i}-${j}` ? 'Ocultar preguntas' : 'Ver preguntas asociadas'}
                                                            >
                                                                {conceptoExpandido === `${i}-${j}`
                                                                    ? <ChevronDown className="w-3 h-3" />
                                                                    : <ChevronRight className="w-3 h-3" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                    {conceptoExpandido === `${i}-${j}` && c.preguntas && (
                                                        <div style={{ padding: '6px 0 6px 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {(verTodas.has(`${i}-${j}`) ? c.preguntas : c.preguntas.slice(0, 10)).map(p => (
                                                                <div key={p.id} style={{
                                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '11px',
                                                                    backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)',
                                                                    color: 'var(--text-primary)', lineHeight: 1.4,
                                                                    cursor: onVerPregunta ? 'pointer' : 'default',
                                                                    transition: 'border-color 0.15s',
                                                                }}
                                                                    onClick={() => onVerPregunta?.(p.id)}
                                                                    onMouseEnter={e => { if (onVerPregunta) e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                                                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
                                                                >
                                                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)', marginRight: '6px' }}>
                                                                        {p.metadatos.año}
                                                                    </span>
                                                                    {p.enunciado.substring(0, 100)}{p.enunciado.length > 100 ? '…' : ''}
                                                                </div>
                                                            ))}
                                                            {c.preguntas.length > 10 && !verTodas.has(`${i}-${j}`) && (
                                                                <button
                                                                    onClick={() => setVerTodas(prev => new Set(prev).add(`${i}-${j}`))}
                                                                    style={{
                                                                        fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600,
                                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                                        padding: '4px 0', textAlign: 'left',
                                                                    }}
                                                                >
                                                                    + {c.preguntas.length - 10} preguntas más
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
