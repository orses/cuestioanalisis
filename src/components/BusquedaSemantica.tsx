import React, { useMemo, useState } from 'react';
import type { Pregunta } from '../types';
import { agruparPorConcepto, calcularDificultad } from '../utils/analytics';
import { Search, ChevronDown, ChevronRight, Gauge } from 'lucide-react';

interface BusquedaSemanticaProps {
    preguntas: Pregunta[];
    onVerPregunta?: (id: string) => void;
}

export const BusquedaSemantica: React.FC<BusquedaSemanticaProps> = ({ preguntas, onVerPregunta }) => {
    const grupos = useMemo(() => agruparPorConcepto(preguntas, 3), [preguntas]);
    const dificultades = useMemo(() => {
        const map = new Map<string, number>();
        calcularDificultad(preguntas).forEach(d => map.set(d.pregunta.id, d.score));
        return map;
    }, [preguntas]);

    const [busqueda, setBusqueda] = useState('');
    const [expandido, setExpandido] = useState<number | null>(null);

    const gruposFiltrados = useMemo(() => {
        if (!busqueda.trim()) return grupos;
        const q = busqueda.toLowerCase();
        return grupos.filter(g =>
            g.concepto.toLowerCase().includes(q) ||
            g.preguntas.some(p => p.enunciado.toLowerCase().includes(q))
        );
    }, [grupos, busqueda]);

    const getDiffColor = (score: number): string => {
        if (score < 25) return 'var(--accent-success)';
        if (score < 50) return 'var(--accent-warning)';
        if (score < 75) return '#f97316'; // naranja oscuro
        return 'var(--accent-danger)';
    };

    const getDiffLabel = (score: number): string => {
        if (score < 25) return 'Fácil';
        if (score < 50) return 'Media';
        if (score < 75) return 'Difícil';
        return 'Muy difícil';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Barra de búsqueda */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
            }}>
                <Search className="w-4 h-4" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <input
                    type="text"
                    placeholder="Buscar por concepto o texto de pregunta…"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    style={{
                        flex: 1, border: 'none', outline: 'none', fontSize: '14px',
                        backgroundColor: 'transparent', color: 'var(--text-primary)',
                    }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {gruposFiltrados.length} conceptos
                </span>
            </div>

            {/* Info */}
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                Los conceptos se extraen automáticamente de los enunciados agrupando preguntas que comparten vocabulario técnico.
                El índice de dificultad (0-100) se estima por longitud, complejidad léxica, similitud entre opciones y tasa de anulación.
            </div>

            {/* Lista de grupos */}
            {gruposFiltrados.length === 0 ? (
                <div style={{
                    padding: '40px', textAlign: 'center', borderRadius: '10px',
                    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                    color: 'var(--text-tertiary)',
                }}>
                    No se encontraron conceptos que coincidan.
                </div>
            ) : (
                gruposFiltrados.map((g, idx) => {
                    const avgDiff = g.preguntas.reduce((s, p) => s + (dificultades.get(p.id) || 0), 0) / g.preguntas.length;
                    return (
                        <div key={idx} style={{
                            borderRadius: '8px', overflow: 'hidden',
                            border: `1px solid ${expandido === idx ? 'var(--accent-primary)' : 'var(--border-secondary)'}`,
                            backgroundColor: 'var(--bg-secondary)',
                        }}>
                            <button
                                onClick={() => setExpandido(expandido === idx ? null : idx)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 16px', cursor: 'pointer',
                                    border: 'none', textAlign: 'left',
                                    backgroundColor: expandido === idx ? 'var(--bg-tertiary)' : 'transparent',
                                }}
                            >
                                {expandido === idx
                                    ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                    : <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                }
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
                                    {g.concepto}
                                </span>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700,
                                    padding: '2px 8px', borderRadius: '10px',
                                    backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                                }}>
                                    {g.preguntas.length} preg.
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                    {g.años[0]}–{g.años[g.años.length - 1]}
                                </span>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700,
                                    backgroundColor: `${getDiffColor(avgDiff)}15`,
                                    color: getDiffColor(avgDiff),
                                }}>
                                    <Gauge className="w-3 h-3" />
                                    {getDiffLabel(avgDiff)} ({Math.round(avgDiff)})
                                </div>
                            </button>

                            {expandido === idx && (
                                <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {g.preguntas.map(p => {
                                        const diff = dificultades.get(p.id) || 0;
                                        return (
                                            <div key={p.id} style={{
                                                padding: '10px 12px', borderRadius: '6px',
                                                backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)',
                                                cursor: onVerPregunta ? 'pointer' : 'default',
                                                transition: 'border-color 0.15s',
                                            }}
                                                onClick={() => onVerPregunta?.(p.id)}
                                                onMouseEnter={e => { if (onVerPregunta) e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <span style={{
                                                        fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
                                                        color: 'var(--accent-primary)',
                                                    }}>
                                                        {p.id.replace(/_\d+$/, '')} N.º{p.numero_original}
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                                        {p.metadatos.año}
                                                    </span>
                                                    {p.materia && (
                                                        <span style={{
                                                            fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                                                            padding: '1px 6px', borderRadius: '4px',
                                                            backgroundColor: 'var(--bg-active)', color: 'var(--text-primary)',
                                                        }}>
                                                            {p.materia}
                                                        </span>
                                                    )}
                                                    <div style={{
                                                        marginLeft: 'auto', width: '40px', height: '4px', borderRadius: '2px',
                                                        backgroundColor: 'var(--bg-hover)',
                                                    }}>
                                                        <div style={{
                                                            width: `${diff}%`, height: '100%', borderRadius: '2px',
                                                            backgroundColor: getDiffColor(diff),
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '10px', fontWeight: 600, color: getDiffColor(diff) }}>
                                                        {diff}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                                                    {p.enunciado}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};
