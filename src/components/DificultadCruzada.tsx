import React, { useMemo, useState } from 'react';
import type { Pregunta } from '../types';
import { dificultadPorCategoria } from '../utils/analytics';
import { BarChart3 } from 'lucide-react';

interface DificultadCruzadaProps {
    preguntas: Pregunta[];
}

export const DificultadCruzada: React.FC<DificultadCruzadaProps> = ({ preguntas }) => {
    const [campo, setCampo] = useState<'materia' | 'bloque' | 'tema' | 'aplicacion'>('bloque');

    const datos = useMemo(() => dificultadPorCategoria(preguntas, campo), [preguntas, campo]);
    const max = Math.max(...datos.map(d => d.dificultadMedia), 1);

    if (datos.length === 0) return null;

    return (
        <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <h2 className="text-lg font-bold text-heading">Dificultad por categoría</h2>
                </div>
                <div className="flex gap-1">
                    {(['bloque', 'tema', 'aplicacion', 'materia'] as const).map(c => (
                        <button key={c} onClick={() => setCampo(c)}
                            className="px-3 py-1 rounded-md text-xs font-semibold transition-colors"
                            style={{
                                backgroundColor: campo === c ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                color: campo === c ? '#fff' : 'var(--text-primary)',
                            }}>
                            {c === 'aplicacion' ? 'Aplicación' : c.charAt(0).toUpperCase() + c.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                {datos.map(d => (
                    <div key={d.categoria} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-body truncate" style={{ minWidth: '160px', maxWidth: '200px' }} title={d.categoria}>
                            {d.categoria}
                        </span>
                        <div className="flex-1 relative h-6 rounded-md overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <div className="h-full rounded-md transition-all" style={{
                                width: `${(d.dificultadMedia / max) * 100}%`,
                                backgroundColor: d.dificultadMedia > 60 ? '#dc2626'
                                    : d.dificultadMedia > 40 ? '#f59e0b'
                                        : '#22c55e',
                                opacity: 0.8,
                            }} />
                            <span className="absolute inset-0 flex items-center px-2 text-xs font-bold"
                                style={{ color: 'var(--text-primary)' }}>
                                {d.dificultadMedia}
                            </span>
                        </div>
                        <span className="text-xs text-muted" style={{ minWidth: '55px', textAlign: 'right' }}>
                            {d.totalPreguntas} preg.
                        </span>
                        {d.tasaAnulacion > 0 && (
                            <span className="text-xs font-medium" style={{ color: 'var(--accent-danger)', minWidth: '40px' }}>
                                {Math.round(d.tasaAnulacion * 100)}% anul.
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <p className="text-xs text-muted mt-4">
                Índice de dificultad compuesto (0 = fácil, 100 = difícil). Combina longitud del enunciado, complejidad del vocabulario, similitud entre distractores, tasa de anulación y rareza temática.
            </p>
        </div>
    );
};
