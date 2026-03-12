import React, { useState, useMemo } from 'react';
import type { Pregunta } from '../types';
import { detectarDuplicados } from '../utils/similarity';
import type { GrupoDuplicados } from '../utils/similarity';
import { ChevronDown, ChevronRight, Copy, Layers } from 'lucide-react';

interface DuplicadosProps {
    preguntas: Pregunta[];
}

export const Duplicados: React.FC<DuplicadosProps> = ({ preguntas }) => {
    const [umbral, setUmbral] = useState(0.6);
    const [expandido, setExpandido] = useState<number | null>(null);
    const [filtroTipo, setFiltroTipo] = useState<'todos' | 'exacto' | 'similar'>('todos');

    const grupos = useMemo(() => detectarDuplicados(preguntas, umbral), [preguntas, umbral]);

    const gruposFiltrados = useMemo(() => {
        if (filtroTipo === 'todos') return grupos;
        return grupos.filter(g => g.tipo === filtroTipo);
    }, [grupos, filtroTipo]);

    const totalExactos = grupos.filter(g => g.tipo === 'exacto').length;
    const totalSimilares = grupos.filter(g => g.tipo === 'similar').length;
    const preguntasAfectadas = grupos.reduce((s, g) => s + g.preguntas.length, 0);

    const toggleGrupo = (idx: number) => {
        setExpandido(expandido === idx ? null : idx);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{
                    padding: '16px', borderRadius: '10px',
                    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Grupos totales</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{grupos.length}</div>
                </div>
                <div style={{
                    padding: '16px', borderRadius: '10px',
                    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Duplicados exactos</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-danger)' }}>{totalExactos}</div>
                </div>
                <div style={{
                    padding: '16px', borderRadius: '10px',
                    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Similares agrupados</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-warning)' }}>{totalSimilares}</div>
                </div>
                <div style={{
                    padding: '16px', borderRadius: '10px',
                    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Preguntas afectadas</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{preguntasAfectadas}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        de {preguntas.length} ({preguntas.length > 0 ? Math.round(preguntasAfectadas / preguntas.length * 100) : 0}%)
                    </div>
                </div>
            </div>

            {/* Controles */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                padding: '12px 16px', borderRadius: '8px',
                backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Tipo:</label>
                    {(['todos', 'exacto', 'similar'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setFiltroTipo(t)}
                            style={{
                                padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                border: '1px solid var(--border-primary)',
                                cursor: 'pointer',
                                backgroundColor: filtroTipo === t ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                color: filtroTipo === t ? '#fff' : 'var(--text-primary)',
                            }}
                        >
                            {t === 'todos' ? 'Todos' : t === 'exacto' ? 'Exactos' : 'Similares'}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Umbral similitud: {Math.round(umbral * 100)}%
                    </label>
                    <input
                        type="range" min="0.3" max="0.95" step="0.05"
                        value={umbral}
                        onChange={e => setUmbral(parseFloat(e.target.value))}
                        style={{ width: '120px', accentColor: 'var(--accent-primary)' }}
                    />
                </div>
            </div>

            {/* Lista de grupos */}
            {gruposFiltrados.length === 0 ? (
                <div style={{
                    padding: '40px', textAlign: 'center',
                    backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-secondary)',
                    color: 'var(--text-tertiary)',
                }}>
                    No se han detectado duplicados ni similares con el umbral actual.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {gruposFiltrados.map((grupo, idx) => (
                        <GrupoCard
                            key={idx}
                            grupo={grupo}
                            index={idx}
                            expandido={expandido === idx}
                            onToggle={() => toggleGrupo(idx)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ───────── Componente de grupo ─────────
interface GrupoCardProps {
    grupo: GrupoDuplicados;
    index: number;
    expandido: boolean;
    onToggle: () => void;
}

const GrupoCard: React.FC<GrupoCardProps> = ({ grupo, expandido, onToggle }) => {
    const esExacto = grupo.tipo === 'exacto';
    const colorBorde = esExacto ? 'var(--accent-danger)' : 'var(--accent-warning)';
    const [preguntasAbiertas, setPreguntasAbiertas] = useState<Set<string>>(new Set());

    const togglePregunta = (id: string) => {
        setPreguntasAbiertas(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div style={{
            borderRadius: '8px', overflow: 'hidden',
            border: `1px solid ${expandido ? colorBorde : 'var(--border-secondary)'}`,
            backgroundColor: 'var(--bg-secondary)',
        }}>
            {/* Cabecera del grupo */}
            <button
                onClick={onToggle}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', cursor: 'pointer',
                    backgroundColor: expandido ? 'var(--bg-tertiary)' : 'transparent',
                    border: 'none', textAlign: 'left',
                }}
            >
                {expandido
                    ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    : <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                }

                {/* Badge tipo */}
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                    backgroundColor: esExacto ? 'rgba(220,38,38,0.12)' : 'rgba(217,119,6,0.12)',
                    color: colorBorde, textTransform: 'uppercase', flexShrink: 0,
                }}>
                    {esExacto ? <Copy className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                    {esExacto ? 'Exacto' : `${Math.round(grupo.similitud * 100)}%`}
                </span>

                {/* Cantidad */}
                <span style={{
                    fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '10px',
                    flexShrink: 0,
                }}>
                    {grupo.preguntas.length} preguntas
                </span>

                {/* Texto representativo (truncado) */}
                <span style={{
                    fontSize: '13px', color: 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1,
                }}>
                    {grupo.textoRepresentativo}
                </span>
            </button>

            {/* Contenido expandido */}
            {expandido && (
                <div style={{
                    padding: '0 16px 16px 16px',
                    display: 'flex', flexDirection: 'column', gap: '6px',
                }}>
                    {grupo.preguntas.map((p, pIdx) => {
                        const abierta = preguntasAbiertas.has(p.id);
                        return (
                            <div
                                key={p.id}
                                style={{
                                    borderRadius: '6px',
                                    backgroundColor: pIdx === 0 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                    border: `1px solid ${pIdx === 0 ? colorBorde : 'var(--border-secondary)'}`,
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Cabecera de la pregunta — siempre visible y clicable */}
                                <button
                                    onClick={() => togglePregunta(p.id)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '10px 14px', cursor: 'pointer',
                                        backgroundColor: 'transparent', border: 'none', textAlign: 'left',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {abierta
                                        ? <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                        : <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                    }
                                    <span style={{
                                        fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                                        color: 'var(--accent-primary)',
                                    }}>
                                        {p.id.replace(/_\d+$/, '')}
                                    </span>
                                    <span style={{
                                        fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        backgroundColor: 'var(--bg-hover)',
                                        padding: '1px 6px', borderRadius: '4px',
                                    }}>
                                        N.º {p.numero_original}
                                    </span>
                                    {p.materia && (
                                        <span style={{
                                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                            padding: '1px 6px', borderRadius: '4px',
                                            backgroundColor: 'var(--bg-active)', color: 'var(--text-primary)',
                                        }}>
                                            {p.materia}
                                        </span>
                                    )}
                                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                        Año: {p.metadatos.año}
                                    </span>
                                    {p.correcta && (
                                        <span style={{
                                            fontSize: '10px', fontWeight: 700,
                                            color: 'var(--accent-success)',
                                        }}>
                                            Correcta: {p.correcta}
                                        </span>
                                    )}
                                    {/* Enunciado truncado cuando está cerrada */}
                                    {!abierta && (
                                        <span style={{
                                            fontSize: '12px', color: 'var(--text-tertiary)',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            flex: 1, minWidth: 0,
                                        }}>
                                            {p.enunciado}
                                        </span>
                                    )}
                                </button>

                                {/* Cuerpo desplegable de la pregunta */}
                                {abierta && (
                                    <div style={{ padding: '0 14px 12px 38px' }}>
                                        <p style={{
                                            fontSize: '13px', color: 'var(--text-primary)',
                                            lineHeight: 1.6, margin: '0 0 8px 0',
                                        }}>
                                            {p.enunciado}
                                        </p>

                                        {/* Opciones */}
                                        {p.opciones && Object.keys(p.opciones).length > 0 && (
                                            <div style={{
                                                display: 'flex', flexDirection: 'column', gap: '4px',
                                                marginBottom: p.observaciones ? '8px' : 0,
                                            }}>
                                                {Object.entries(p.opciones).map(([letra, texto]) => {
                                                    const esCorrecta = p.correcta?.toUpperCase() === letra.toUpperCase();
                                                    return (
                                                        <div
                                                            key={letra}
                                                            style={{
                                                                display: 'flex', gap: '6px',
                                                                padding: '4px 8px', borderRadius: '4px',
                                                                backgroundColor: esCorrecta ? 'rgba(34,197,94,0.10)' : 'transparent',
                                                                border: esCorrecta ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent',
                                                            }}
                                                        >
                                                            <span style={{
                                                                fontSize: '12px', fontWeight: 700,
                                                                color: esCorrecta ? 'var(--accent-success)' : 'var(--text-tertiary)',
                                                                minWidth: '18px',
                                                            }}>
                                                                {letra.toUpperCase()})
                                                            </span>
                                                            <span style={{
                                                                fontSize: '12px',
                                                                color: esCorrecta ? 'var(--accent-success)' : 'var(--text-secondary)',
                                                                lineHeight: 1.5,
                                                            }}>
                                                                {texto}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Observaciones */}
                                        {p.observaciones && (
                                            <div style={{
                                                fontSize: '11px', color: 'var(--text-tertiary)',
                                                fontStyle: 'italic', marginTop: '4px',
                                            }}>
                                                {p.observaciones}
                                            </div>
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
