import React, { useMemo } from 'react';
import type { Pregunta } from '../types';
import { analizarPosicion } from '../utils/analytics';
import { ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnalisisPosicionProps {
    preguntas: Pregunta[];
}

export const AnalisisPosicionComp: React.FC<AnalisisPosicionProps> = ({ preguntas }) => {
    const datos = useMemo(() => analizarPosicion(preguntas), [preguntas]);

    if (datos.puntos.length === 0) return null;

    const iconTendencia = datos.tendenciaDificultad === 'creciente' ? <TrendingUp className="w-4 h-4" style={{ color: '#dc2626' }} />
        : datos.tendenciaDificultad === 'decreciente' ? <TrendingDown className="w-4 h-4" style={{ color: '#22c55e' }} />
            : <Minus className="w-4 h-4" style={{ color: '#94a3b8' }} />;

    const tercioLabels = ['Primer tercio', 'Segundo tercio', 'Último tercio'];
    const tercioColores = ['#22c55e', '#f59e0b', '#dc2626'];

    return (
        <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="flex items-center gap-2 mb-4">
                <ArrowUpDown className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                <h2 className="text-lg font-bold text-heading">Posición vs. correcta y dificultad</h2>
            </div>

            {/* KPIs de dificultad por tercio */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {datos.mediaDificultadPorTercio.map((val, i) => (
                    <div key={i} className="p-3 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                        <div className="text-xs font-semibold text-muted uppercase mb-1">{tercioLabels[i]}</div>
                        <div className="text-2xl font-bold" style={{ color: tercioColores[i] }}>{val}</div>
                        <div className="text-xs text-muted">dificultad media</div>
                    </div>
                ))}
            </div>

            {/* Tendencia */}
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {iconTendencia}
                <span className="text-sm font-medium text-body">
                    {datos.tendenciaDificultad === 'creciente'
                        ? 'Las preguntas tienden a ser más difíciles al avanzar el examen.'
                        : datos.tendenciaDificultad === 'decreciente'
                            ? 'Las preguntas tienden a ser más fáciles al avanzar el examen.'
                            : 'La dificultad se mantiene estable a lo largo del examen.'}
                </span>
            </div>

            {/* Distribución de letras por tercio */}
            <h3 className="text-sm font-bold text-heading mb-2">Distribución de la correcta por posición</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th className="text-left text-xs font-semibold text-muted uppercase p-2">Tercio</th>
                            {['A', 'B', 'C', 'D'].map(l => (
                                <th key={l} className="text-center text-xs font-semibold text-muted uppercase p-2">{l}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tercioLabels.map(label => {
                            const dist = datos.distribucionPorPosicion[label] || {};
                            const total = Object.values(dist).reduce((a, b) => a + b, 0);
                            return (
                                <tr key={label} style={{ borderTop: '1px solid var(--border-secondary)' }}>
                                    <td className="text-xs font-medium text-body p-2">{label}</td>
                                    {['A', 'B', 'C', 'D'].map(l => {
                                        const cnt = dist[l] || 0;
                                        const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
                                        const esperado = 25;
                                        const desviado = Math.abs(pct - esperado) > 5;
                                        return (
                                            <td key={l} className="text-center p-2">
                                                <span className="text-xs font-bold" style={{ color: desviado ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
                                                    {pct}%
                                                </span>
                                                <span className="text-xs text-muted block">({cnt})</span>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-muted mt-4">
                Analiza si hay patrones psicométricos: ¿las preguntas del principio son más fáciles?, ¿la letra correcta se distribuye igual a lo largo del examen?
            </p>
        </div>
    );
};
