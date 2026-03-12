import React, { useMemo, useState, useRef } from 'react';
import type { Pregunta } from '../types';
import { calcularMapaCalor } from '../utils/analytics';
import { Flame } from 'lucide-react';

interface MapaCalorProps {
    preguntas: Pregunta[];
    onFiltrar?: (año: number, categoria: string) => void;
}

export const MapaCalor: React.FC<MapaCalorProps> = ({ preguntas, onFiltrar }) => {
    const [campo, setCampo] = useState<'bloque' | 'tema' | 'aplicacion'>('bloque');
    const data = useMemo(() => calcularMapaCalor(preguntas, campo), [preguntas, campo]);

    // Tooltip
    const [tooltip, setTooltip] = useState<{ x: number; y: number; año: number; cat: string; cantidad: number; pct: string } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const getColor = (cantidad: number): string => {
        if (cantidad === 0) return 'var(--bg-tertiary)';
        const ratio = data.max > 0 ? cantidad / data.max : 0;
        if (ratio < 0.25) return 'rgba(99, 102, 241, 0.15)';
        if (ratio < 0.5) return 'rgba(99, 102, 241, 0.35)';
        if (ratio < 0.75) return 'rgba(99, 102, 241, 0.6)';
        return 'rgba(79, 70, 229, 0.85)';
    };

    const getTextColor = (cantidad: number): string => {
        if (cantidad === 0) return 'var(--text-tertiary)';
        const ratio = data.max > 0 ? cantidad / data.max : 0;
        return ratio >= 0.6 ? '#ffffff' : 'var(--text-primary)';
    };

    const totalPreguntas = preguntas.length;

    const handleMouseEnter = (e: React.MouseEvent, año: number, cat: string, cantidad: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setTooltip({
            x: e.clientX - rect.left + 12,
            y: e.clientY - rect.top - 40,
            año, cat, cantidad,
            pct: totalPreguntas > 0 ? ((cantidad / totalPreguntas) * 100).toFixed(1) : '0',
        });
    };

    const handleClick = (año: number, cat: string) => {
        if (onFiltrar) onFiltrar(año, cat);
    };

    return (
        <div ref={containerRef} style={{
            padding: '20px', borderRadius: '10px', position: 'relative',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame className="w-5 h-5" style={{ color: '#ef4444' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Mapa de Calor
                    </h3>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {(['bloque', 'tema', 'aplicacion'] as const).map(c => (
                        <button key={c} onClick={() => setCampo(c)} style={{
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

            {data.categorias.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>
                    No hay datos suficientes para generar el mapa de calor.
                </p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{
                                    padding: '6px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 700,
                                    color: 'var(--text-tertiary)', textTransform: 'uppercase',
                                    position: 'sticky', left: 0, backgroundColor: 'var(--bg-secondary)', zIndex: 1,
                                }} />
                                {data.años.map(año => (
                                    <th key={año} style={{
                                        padding: '6px 4px', textAlign: 'center', fontSize: '11px', fontWeight: 700,
                                        color: 'var(--text-primary)', whiteSpace: 'nowrap',
                                    }}>
                                        {año}
                                    </th>
                                ))}
                                <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)' }}>
                                    ∑
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.categorias.map(cat => {
                                const total = data.celdas
                                    .filter(c => c.categoria === cat)
                                    .reduce((s, c) => s + c.cantidad, 0);
                                return (
                                    <tr key={cat}>
                                        <td style={{
                                            padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                                            color: 'var(--text-primary)', whiteSpace: 'nowrap',
                                            position: 'sticky', left: 0, backgroundColor: 'var(--bg-secondary)', zIndex: 1,
                                            maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {cat}
                                        </td>
                                        {data.años.map(año => {
                                            const celda = data.celdas.find(c => c.año === año && c.categoria === cat);
                                            const cantidad = celda?.cantidad || 0;
                                            return (
                                                <td key={año} style={{
                                                    padding: '4px', textAlign: 'center',
                                                }}>
                                                    <div
                                                        onMouseEnter={e => handleMouseEnter(e, año, cat, cantidad)}
                                                        onMouseLeave={() => setTooltip(null)}
                                                        onClick={() => handleClick(año, cat)}
                                                        style={{
                                                            width: '36px', height: '28px', margin: '0 auto',
                                                            borderRadius: '4px', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '11px', fontWeight: 700,
                                                            backgroundColor: getColor(cantidad),
                                                            color: getTextColor(cantidad),
                                                            cursor: onFiltrar ? 'pointer' : 'default',
                                                            transition: 'transform 0.1s, box-shadow 0.1s',
                                                        }}
                                                        onMouseOver={e => {
                                                            if (onFiltrar) {
                                                                (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)';
                                                                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                                                            }
                                                        }}
                                                        onMouseOut={e => {
                                                            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                                                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                                        }}
                                                    >
                                                        {cantidad || ''}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td style={{
                                            padding: '4px 10px', textAlign: 'right', fontSize: '12px',
                                            fontWeight: 800, color: 'var(--text-primary)',
                                        }}>
                                            {total}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tooltip flotante */}
            {tooltip && tooltip.cantidad > 0 && (
                <div style={{
                    position: 'absolute', left: Math.min(tooltip.x, 300), top: tooltip.y,
                    backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
                    borderRadius: '8px', padding: '8px 12px', fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10,
                    pointerEvents: 'none', whiteSpace: 'nowrap',
                    color: 'var(--text-primary)',
                }}>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>{tooltip.cat}</div>
                    <div>Año: <b>{tooltip.año}</b></div>
                    <div>Preguntas: <b>{tooltip.cantidad}</b> ({tooltip.pct}% del total)</div>
                    {onFiltrar && <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Clic para filtrar</div>}
                </div>
            )}

            {/* Leyenda */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Menos</span>
                {[0.1, 0.3, 0.5, 0.8].map((r, i) => (
                    <div key={i} style={{
                        width: '16px', height: '16px', borderRadius: '3px',
                        backgroundColor: getColor(data.max * r),
                    }} />
                ))}
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Más</span>
            </div>
        </div>
    );
};
