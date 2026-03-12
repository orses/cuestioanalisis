import React, { useMemo, useState, useRef } from 'react';
import type { Pregunta } from '../types';
import { construirGrafoCoocurrencia } from '../utils/analytics';
import { Network } from 'lucide-react';

interface GrafoCoocurrenciaProps {
    preguntas: Pregunta[];
}

interface NodoPosicion {
    id: string;
    label: string;
    frecuencia: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

/**
 * Grafo de co-ocurrencia interactivo con SVG.
 * Layout force-directed simplificado sin librerías externas.
 */
export const GrafoCoocurrenciaViz: React.FC<GrafoCoocurrenciaProps> = ({ preguntas }) => {
    const grafo = useMemo(() => construirGrafoCoocurrencia(preguntas, 20), [preguntas]);

    // Nodo seleccionado
    const [nodoSeleccionado, setNodoSeleccionado] = useState<string | null>(null);

    // Dimensiones del SVG
    const WIDTH = 700;
    const HEIGHT = 450;

    // Layout force-directed
    const nodosPosRef = useRef<NodoPosicion[]>([]);

    const nodos = useMemo(() => {
        // Inicializar posiciones en un círculo
        const result: NodoPosicion[] = grafo.nodos.map((n, i) => {
            const angle = (i / grafo.nodos.length) * 2 * Math.PI;
            const r = Math.min(WIDTH, HEIGHT) * 0.35;
            return {
                id: n.id,
                label: n.label,
                frecuencia: n.frecuencia,
                x: WIDTH / 2 + Math.cos(angle) * r,
                y: HEIGHT / 2 + Math.sin(angle) * r,
                vx: 0,
                vy: 0,
            };
        });

        // Simular fuerzas (100 iteraciones)
        const nodeMap = new Map(result.map(n => [n.id, n]));
        for (let iter = 0; iter < 120; iter++) {
            const damping = 0.85;
            const repulsion = 3000;
            const attraction = 0.005;
            const centerForce = 0.01;

            // Repulsión entre todos los nodos
            for (let i = 0; i < result.length; i++) {
                for (let j = i + 1; j < result.length; j++) {
                    const dx = result[i].x - result[j].x;
                    const dy = result[i].y - result[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = repulsion / (dist * dist);
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    result[i].vx += fx;
                    result[i].vy += fy;
                    result[j].vx -= fx;
                    result[j].vy -= fy;
                }
            }

            // Atracción por arcos
            for (const arco of grafo.arcos) {
                const src = nodeMap.get(arco.source);
                const tgt = nodeMap.get(arco.target);
                if (!src || !tgt) continue;
                const dx = tgt.x - src.x;
                const dy = tgt.y - src.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = attraction * arco.peso * dist;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                src.vx += fx;
                src.vy += fy;
                tgt.vx -= fx;
                tgt.vy -= fy;
            }

            // Fuerza central
            for (const n of result) {
                n.vx += (WIDTH / 2 - n.x) * centerForce;
                n.vy += (HEIGHT / 2 - n.y) * centerForce;
            }

            // Aplicar velocidades con damping
            for (const n of result) {
                n.vx *= damping;
                n.vy *= damping;
                n.x += n.vx;
                n.y += n.vy;
                // Mantener dentro de los límites
                n.x = Math.max(40, Math.min(WIDTH - 40, n.x));
                n.y = Math.max(40, Math.min(HEIGHT - 40, n.y));
            }
        }

        nodosPosRef.current = result;
        return result;
    }, [grafo, WIDTH, HEIGHT]);

    const maxFreq = Math.max(...nodos.map(n => n.frecuencia), 1);
    const arcosConPos = useMemo(() => {
        const nodeMap = new Map(nodos.map(n => [n.id, n]));
        return grafo.arcos.map(a => ({
            ...a,
            x1: nodeMap.get(a.source)?.x || 0,
            y1: nodeMap.get(a.source)?.y || 0,
            x2: nodeMap.get(a.target)?.x || 0,
            y2: nodeMap.get(a.target)?.y || 0,
        }));
    }, [nodos, grafo.arcos]);

    const maxPeso = Math.max(...grafo.arcos.map(a => a.peso), 1);

    // Conexiones del nodo seleccionado
    const conexionesSeleccionadas = useMemo(() => {
        if (!nodoSeleccionado) return new Set<string>();
        const set = new Set<string>();
        for (const a of grafo.arcos) {
            if (a.source === nodoSeleccionado || a.target === nodoSeleccionado) {
                set.add(a.source);
                set.add(a.target);
            }
        }
        return set;
    }, [nodoSeleccionado, grafo.arcos]);

    const isHighlighted = (nodoId: string) => {
        if (!nodoSeleccionado) return true;
        return conexionesSeleccionadas.has(nodoId);
    };

    const isArcoHighlighted = (source: string, target: string) => {
        if (!nodoSeleccionado) return true;
        return source === nodoSeleccionado || target === nodoSeleccionado;
    };

    if (grafo.nodos.length === 0) {
        return (
            <div style={{
                padding: '20px', borderRadius: '10px',
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Network className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Grafo de co-ocurrencia de conceptos
                    </h3>
                </div>
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>
                    No hay datos suficientes.
                </p>
            </div>
        );
    }

    return (
        <div style={{
            padding: '20px', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Network className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Grafo de co-ocurrencia de conceptos
                </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Conceptos que aparecen juntos en las mismas preguntas. Clic en un nodo para resaltar sus conexiones.
                {nodoSeleccionado && (
                    <button
                        onClick={() => setNodoSeleccionado(null)}
                        style={{
                            marginLeft: '8px', fontSize: '11px', color: 'var(--accent-primary)',
                            background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline',
                        }}
                    >Limpiar selección</button>
                )}
            </p>

            <div style={{
                borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)',
                overflow: 'hidden', border: '1px solid var(--border-secondary)',
            }}>
                <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ display: 'block' }}>
                    {/* Arcos */}
                    {arcosConPos.map((a, i) => (
                        <line
                            key={i}
                            x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                            stroke={isArcoHighlighted(a.source, a.target) ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.08)'}
                            strokeWidth={Math.max(1, (a.peso / maxPeso) * 4)}
                            style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                        />
                    ))}
                    {/* Nodos */}
                    {nodos.map(n => {
                        const r = 8 + (n.frecuencia / maxFreq) * 18;
                        const highlighted = isHighlighted(n.id);
                        const isSelected = n.id === nodoSeleccionado;
                        return (
                            <g key={n.id} style={{ cursor: 'pointer' }} onClick={() => setNodoSeleccionado(prev => prev === n.id ? null : n.id)}>
                                <circle
                                    cx={n.x} cy={n.y} r={r}
                                    fill={isSelected ? '#4f46e5' : highlighted ? 'rgba(99,102,241,0.7)' : 'rgba(99,102,241,0.15)'}
                                    stroke={isSelected ? '#312e81' : 'rgba(99,102,241,0.4)'}
                                    strokeWidth={isSelected ? 3 : 1.5}
                                    style={{ transition: 'fill 0.2s, r 0.2s' }}
                                />
                                <text
                                    x={n.x} y={n.y + r + 12}
                                    textAnchor="middle"
                                    fontSize={Math.max(8, 10 - (nodos.length > 15 ? 2 : 0))}
                                    fontWeight={isSelected ? 800 : 600}
                                    fill={highlighted ? 'var(--text-primary)' : 'var(--text-tertiary)'}
                                    style={{ transition: 'fill 0.2s' }}
                                >
                                    {n.label.length > 12 ? n.label.substring(0, 11) + '…' : n.label}
                                </text>
                                <title>{n.label}: {n.frecuencia} apariciones</title>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Info del nodo seleccionado */}
            {nodoSeleccionado && (() => {
                const nodo = nodos.find(n => n.id === nodoSeleccionado);
                const arcsDelNodo = grafo.arcos.filter(a => a.source === nodoSeleccionado || a.target === nodoSeleccionado)
                    .sort((a, b) => b.peso - a.peso);
                if (!nodo) return null;
                return (
                    <div style={{
                        marginTop: '12px', padding: '12px 16px', borderRadius: '8px',
                        backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)',
                    }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                            «{nodo.label}» — {nodo.frecuencia} apariciones, {arcsDelNodo.length} conexiones
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {arcsDelNodo.slice(0, 10).map((a, i) => {
                                const otro = a.source === nodoSeleccionado ? a.target : a.source;
                                return (
                                    <span key={i} style={{
                                        fontSize: '10px', fontWeight: 600,
                                        padding: '2px 8px', borderRadius: '4px',
                                        backgroundColor: a.peso >= 4 ? 'rgba(99,102,241,0.15)' : 'var(--bg-secondary)',
                                        color: a.peso >= 4 ? 'var(--accent-primary)' : 'var(--text-primary)',
                                    }}>{otro} ({a.peso})</span>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
