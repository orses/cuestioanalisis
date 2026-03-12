import React, { useMemo } from 'react';
import type { Pregunta } from '../types';
import { detectarVocabularioEmergente } from '../utils/analytics';
import { Sparkles, Star, TrendingUp } from 'lucide-react';

interface VocabularioEmergenteProps {
    preguntas: Pregunta[];
}

export const VocabularioEmergente: React.FC<VocabularioEmergenteProps> = ({ preguntas }) => {
    const terminos = useMemo(() => detectarVocabularioEmergente(preguntas), [preguntas]);

    if (terminos.length === 0) return null;

    const nuevos = terminos.filter(t => t.esNuevo);
    const crecientes = terminos.filter(t => !t.esNuevo);

    return (
        <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                <h2 className="text-lg font-bold text-heading">Vocabulario técnico emergente</h2>
            </div>
            <p className="text-sm text-muted mb-4">
                Términos que han aparecido por primera vez en convocatorias recientes o cuya frecuencia ha crecido significativamente. Son candidatos probables para futuras convocatorias.
            </p>

            {/* Términos nuevos */}
            {nuevos.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4" style={{ color: '#f59e0b' }} />
                        <h3 className="text-sm font-bold text-heading">Conceptos nuevos</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontWeight: 700 }}>
                            {nuevos.length}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {nuevos.map(t => (
                            <div key={t.termino} className="group relative px-3 py-2 rounded-lg border cursor-default transition-colors"
                                style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
                                <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>{t.termino}</span>
                                <span className="text-xs text-muted ml-2">desde {t.primeraAparicion}</span>
                                <span className="text-xs text-muted ml-1">({t.frecuenciaTotal}×)</span>
                                {/* Tooltip */}
                                <div className="hidden group-hover:block absolute bottom-full left-0 mb-1 p-2 rounded-md shadow-lg text-xs z-20"
                                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', width: '280px' }}>
                                    <div className="text-body mb-1">«{t.ejemploEnunciado}…»</div>
                                    <div className="text-muted">Años: {t.añosPresente.join(', ')}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Términos con frecuencia creciente */}
            {crecientes.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4" style={{ color: '#2563eb' }} />
                        <h3 className="text-sm font-bold text-heading">Frecuencia creciente</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(37,99,235,0.12)', color: '#2563eb', fontWeight: 700 }}>
                            {crecientes.length}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {crecientes.map(t => {
                            const pctReciente = t.frecuenciaTotal > 0 ? Math.round((t.frecuenciaReciente / t.frecuenciaTotal) * 100) : 0;
                            return (
                                <div key={t.termino} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                    <span className="text-xs font-bold text-heading" style={{ minWidth: '160px' }}>{t.termino}</span>
                                    <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <div className="h-full rounded-sm" style={{ width: `${pctReciente}%`, backgroundColor: '#2563eb', opacity: 0.7 }} />
                                    </div>
                                    <span className="text-xs text-muted" style={{ minWidth: '80px' }}>
                                        {t.frecuenciaReciente}/{t.frecuenciaTotal} recientes
                                    </span>
                                    <span className="text-xs text-muted" style={{ minWidth: '60px' }}>
                                        desde {t.primeraAparicion}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
