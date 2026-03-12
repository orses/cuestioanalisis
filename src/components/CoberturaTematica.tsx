import React, { useMemo, useState } from 'react';
import type { Pregunta } from '../types';
import { analizarCobertura, type CoberturaItem } from '../utils/analytics';
import { ShieldCheck, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface CoberturaTematicaProps {
    preguntas: Pregunta[];
}

const NIVEL_LABELS: Record<string, string> = {
    materia: 'Materias',
    bloque: 'Bloques',
    tema: 'Temas',
    aplicacion: 'Aplicaciones',
};

const NIVEL_COLORES: Record<string, string> = {
    materia: '#4f46e5',
    bloque: '#2563eb',
    tema: '#059669',
    aplicacion: '#d97706',
};

export const CoberturaTematica: React.FC<CoberturaTematicaProps> = ({ preguntas }) => {
    const data = useMemo(() => analizarCobertura(preguntas), [preguntas]);
    const [nivelesExpandidos, setNivelesExpandidos] = useState<Set<string>>(new Set(['bloque', 'tema']));
    const [soloLagunas, setSoloLagunas] = useState(false);

    const toggleNivel = (nivel: string) => {
        setNivelesExpandidos(prev => {
            const next = new Set(prev);
            next.has(nivel) ? next.delete(nivel) : next.add(nivel);
            return next;
        });
    };

    const itemsPorNivel = useMemo(() => {
        const grupos: Record<string, CoberturaItem[]> = {};
        for (const item of data.items) {
            if (!grupos[item.nivel]) grupos[item.nivel] = [];
            grupos[item.nivel].push(item);
        }
        return grupos;
    }, [data]);

    const itemsFiltrados = (items: CoberturaItem[]) =>
        soloLagunas ? items.filter(i => i.esLaguna) : items;

    return (
        <div style={{
            padding: '20px', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <ShieldCheck className="w-5 h-5" style={{ color: '#059669' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Cobertura del Temario
                </h3>
                <InfoTooltip texto="Analiza qué proporción del temario (materias, bloques, temas, aplicaciones) tiene representación sólida en el dataset. Los elementos marcados como «laguna» aparecen en 1 solo año o tienen menos de 3 preguntas." />
            </div>

            {/* KPIs */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{
                    padding: '10px 16px', borderRadius: '8px',
                    backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)',
                }}>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-success)' }}>{data.coberturaPorcentaje}%</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>cobertura sólida</span>
                </div>
                <div style={{
                    padding: '10px 16px', borderRadius: '8px',
                    backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)',
                }}>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{data.totalElementos}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>elementos</span>
                </div>
                <div style={{
                    padding: '10px 16px', borderRadius: '8px',
                    backgroundColor: data.elementosConLaguna > 0 ? 'rgba(239,68,68,0.06)' : 'var(--bg-tertiary)',
                    border: `1px solid ${data.elementosConLaguna > 0 ? 'rgba(239,68,68,0.2)' : 'var(--border-secondary)'}`,
                }}>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: data.elementosConLaguna > 0 ? '#ef4444' : 'var(--text-primary)' }}>
                        {data.elementosConLaguna}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>lagunas</span>
                </div>

                <label style={{
                    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                    color: 'var(--text-primary)', cursor: 'pointer', marginLeft: 'auto',
                }}>
                    <input type="checkbox" checked={soloLagunas} onChange={e => setSoloLagunas(e.target.checked)} />
                    Solo lagunas
                </label>
            </div>

            {/* Grupos por nivel */}
            {['bloque', 'tema', 'aplicacion'].map(nivel => {
                const items = itemsPorNivel[nivel];
                if (!items || items.length === 0) return null;
                const filtrados = itemsFiltrados(items);
                const expandido = nivelesExpandidos.has(nivel);
                const lagunasDelNivel = items.filter(i => i.esLaguna).length;
                return (
                    <div key={nivel} style={{ marginBottom: '8px' }}>
                        <button onClick={() => toggleNivel(nivel)} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                            padding: '8px 12px', borderRadius: '6px', border: 'none',
                            backgroundColor: 'var(--bg-tertiary)', cursor: 'pointer',
                            fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)',
                        }}>
                            {expandido ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                backgroundColor: NIVEL_COLORES[nivel],
                            }} />
                            {NIVEL_LABELS[nivel]}
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                                ({items.length} elementos{lagunasDelNivel > 0 ? `, ${lagunasDelNivel} lagunas` : ''})
                            </span>
                        </button>
                        {expandido && filtrados.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 0 0 20px' }}>
                                {filtrados.map(item => (
                                    <div key={`${item.nivel}-${item.nombre}`} style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '6px 12px', borderRadius: '6px',
                                        backgroundColor: item.esLaguna ? 'rgba(239,68,68,0.04)' : 'transparent',
                                        border: `1px solid ${item.esLaguna ? 'rgba(239,68,68,0.15)' : 'var(--border-secondary)'}`,
                                    }}>
                                        {item.esLaguna && <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#ef4444', flexShrink: 0 }} />}
                                        <span style={{
                                            fontSize: '12px', fontWeight: 600,
                                            color: item.esLaguna ? '#ef4444' : 'var(--text-primary)',
                                            flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>{item.nombre}</span>
                                        <span style={{
                                            fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)',
                                            minWidth: '40px', textAlign: 'right',
                                        }}>{item.totalPreguntas} preg.</span>
                                        <span style={{
                                            fontSize: '10px', color: 'var(--text-tertiary)',
                                            minWidth: '80px', textAlign: 'right',
                                        }}>
                                            {item.añosPresente.length > 0
                                                ? `${item.añosPresente.length} año${item.añosPresente.length > 1 ? 's' : ''} (${item.añosPresente[0]}–${item.añosPresente[item.añosPresente.length - 1]})`
                                                : 'sin año'
                                            }
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
