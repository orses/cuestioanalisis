import React, { useMemo, useState } from 'react';
import type { Pregunta } from '../types';
import { calcularCorrelacionMaterias } from '../utils/analytics';
import { GitBranch } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface MatrizCorrelacionProps {
    preguntas: Pregunta[];
}

export const MatrizCorrelacion: React.FC<MatrizCorrelacionProps> = ({ preguntas }) => {
    const [campo, setCampo] = useState<'bloque' | 'tema' | 'aplicacion'>('bloque');
    const data = useMemo(() => calcularCorrelacionMaterias(preguntas, campo), [preguntas, campo]);

    const getColor = (val: number): string => {
        if (val === 1) return 'rgba(99, 102, 241, 0.15)'; // diagonal
        if (val > 0.5) return 'rgba(37, 99, 235, 0.6)';
        if (val > 0.2) return 'rgba(37, 99, 235, 0.3)';
        if (val > -0.2) return 'transparent';
        if (val > -0.5) return 'rgba(220, 38, 38, 0.25)';
        return 'rgba(220, 38, 38, 0.5)';
    };

    const getTextColor = (val: number): string => {
        if (Math.abs(val) > 0.5) return '#fff';
        return 'var(--text-primary)';
    };

    if (data.etiquetas.length < 2 || data.valores.length === 0) {
        return (
            <div style={{
                padding: '20px', borderRadius: '10px',
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GitBranch className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Correlación entre Categorías
                    </h3>
                </div>
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px', fontSize: '13px' }}>
                    Se necesitan al menos 2 categorías y múltiples convocatorias para calcular correlaciones.
                </p>
            </div>
        );
    }

    return (
        <div style={{
            padding: '20px', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GitBranch className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Correlación entre Categorías
                    </h3>
                    <InfoTooltip texto="Correlación de Pearson entre categorías a través de las convocatorias. Valores positivos (azul) indican que cuando una categoría tiene más preguntas, la otra también tiende a tenerlas. Valores negativos (rojo) indican que cuando una sube la otra baja." />
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
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Coeficiente de Pearson entre pares de {campo} basado en {data.etiquetas.length} categorías.
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
                    <thead>
                        <tr>
                            <th style={{
                                padding: '6px 10px', fontSize: '10px', fontWeight: 700,
                                color: 'var(--text-tertiary)', textTransform: 'uppercase',
                            }} />
                            {data.etiquetas.map(et => (
                                <th key={et} style={{
                                    padding: '6px 4px', fontSize: '10px', fontWeight: 700,
                                    color: 'var(--text-primary)', whiteSpace: 'nowrap',
                                    maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis',
                                    writingMode: data.etiquetas.length > 6 ? 'vertical-rl' : undefined,
                                    textOrientation: data.etiquetas.length > 6 ? 'mixed' : undefined,
                                    height: data.etiquetas.length > 6 ? '90px' : undefined,
                                }} title={et}>{et}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.etiquetas.map((et, i) => (
                            <tr key={et}>
                                <td style={{
                                    padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                                    color: 'var(--text-primary)', whiteSpace: 'nowrap',
                                    maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis',
                                }} title={et}>{et}</td>
                                {data.valores[i].map((val, j) => (
                                    <td key={j} style={{ padding: '2px' }}>
                                        <div
                                            title={`${data.etiquetas[i]} × ${data.etiquetas[j]}: r = ${val.toFixed(2)}`}
                                            style={{
                                                width: '40px', height: '32px', margin: '0 auto',
                                                borderRadius: '4px', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: '10px', fontWeight: 700,
                                                backgroundColor: getColor(val),
                                                color: getTextColor(val),
                                                cursor: 'default',
                                            }}
                                        >
                                            {i === j ? '—' : val.toFixed(2)}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Leyenda */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', justifyContent: 'center', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'rgba(220,38,38,0.5)' }} />
                    <span>Neg. fuerte</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'rgba(220,38,38,0.25)' }} />
                    <span>Neg. débil</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }} />
                    <span>Neutral</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'rgba(37,99,235,0.3)' }} />
                    <span>Pos. débil</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'rgba(37,99,235,0.6)' }} />
                    <span>Pos. fuerte</span>
                </div>
            </div>
        </div>
    );
};
