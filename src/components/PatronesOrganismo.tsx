import React, { useMemo } from 'react';
import type { Pregunta } from '../types';
import { analizarPatronesOrganismoEscala } from '../utils/analytics';
import { Building2 } from 'lucide-react';

interface PatronesOrganismoProps {
    preguntas: Pregunta[];
}

export const PatronesOrganismo: React.FC<PatronesOrganismoProps> = ({ preguntas }) => {
    const patrones = useMemo(() => analizarPatronesOrganismoEscala(preguntas), [preguntas]);

    if (patrones.length === 0) return null;

    return (
        <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                <h2 className="text-lg font-bold text-heading">Patrones por organismo y escala</h2>
            </div>
            <p className="text-sm text-muted mb-4">
                ¿Cómo varía el «estilo» de los exámenes según quién los convoca y para qué escala?
            </p>

            <div className="space-y-4">
                {patrones.map(p => {
                    const totalCorrectas = Object.values(p.distribucionCorrecta).reduce((a, b) => a + b, 0);
                    const bloquesOrd = Object.entries(p.distribucionBloques).sort((a, b) => b[1] - a[1]);
                    const maxBlq = bloquesOrd.length > 0 ? bloquesOrd[0][1] : 1;

                    return (
                        <div key={p.clave} className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <span className="text-sm font-bold text-heading">{p.organismo}</span>
                                    <span className="text-xs font-medium text-muted ml-2 px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        {p.escala}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-muted">{p.totalPreguntas} preguntas · {p.totalEjercicios} ejercicios</span>
                                    <span className="text-xs font-medium block" style={{ color: p.tasaAnulacion > 0.03 ? 'var(--accent-danger)' : 'var(--text-tertiary)' }}>
                                        {Math.round(p.tasaAnulacion * 100)}% anulación
                                    </span>
                                </div>
                            </div>

                            {/* Distribución de bloques */}
                            <div className="mb-3">
                                <div className="text-xs font-semibold text-muted uppercase mb-1">Distribución por bloques</div>
                                <div className="space-y-1">
                                    {bloquesOrd.slice(0, 8).map(([blq, cnt]) => (
                                        <div key={blq} className="flex items-center gap-2">
                                            <span className="text-xs text-body truncate" style={{ minWidth: '100px', maxWidth: '180px' }} title={blq}>{blq}</span>
                                            <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                                <div className="h-full rounded-sm" style={{ width: `${(cnt / maxBlq) * 100}%`, backgroundColor: 'var(--accent-primary)', opacity: 0.7 }} />
                                            </div>
                                            <span className="text-xs text-muted" style={{ minWidth: '30px', textAlign: 'right' }}>{cnt}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Distribución de correctas */}
                            <div>
                                <div className="text-xs font-semibold text-muted uppercase mb-1">Distribución de correcta</div>
                                <div className="flex gap-2">
                                    {['A', 'B', 'C', 'D'].map(letra => {
                                        const cnt = p.distribucionCorrecta[letra] || 0;
                                        const pct = totalCorrectas > 0 ? Math.round((cnt / totalCorrectas) * 100) : 0;
                                        return (
                                            <div key={letra} className="flex-1 text-center p-1.5 rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                                <div className="text-xs font-bold text-heading">{letra}</div>
                                                <div className="text-xs text-muted">{pct}%</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="text-xs text-muted mt-2">
                                Años: {p.añosPresentados.join(', ')}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
