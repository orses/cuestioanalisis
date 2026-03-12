import React, { useMemo, useState } from 'react';
import type { Pregunta } from '../types';
import { simularPuntuacion } from '../utils/analytics';
import { Calculator, CheckCircle2, XCircle } from 'lucide-react';

interface SimuladorPuntuacionProps {
    preguntas: Pregunta[];
}

export const SimuladorPuntuacion: React.FC<SimuladorPuntuacionProps> = ({ preguntas }) => {
    const [campo, setCampo] = useState<'materia' | 'bloque' | 'tema' | 'aplicacion'>('bloque');

    // Extraer categorías únicas
    const categorias = useMemo(() => {
        const set = new Set<string>();
        for (const p of preguntas) {
            let cat = '';
            if (campo === 'materia') cat = p.materia?.toString().toLowerCase() || '';
            if (campo === 'bloque') cat = p.bloque?.toLowerCase() || '';
            if (campo === 'tema') cat = p.tema?.toLowerCase() || '';
            if (campo === 'aplicacion') cat = p.aplicacion?.toLowerCase() || '';
            if (cat) set.add(cat);
        }
        return Array.from(set).sort();
    }, [preguntas, campo]);

    const [dominados, setDominados] = useState<Set<string>>(new Set());

    const toggleDominado = (cat: string) => {
        setDominados(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const seleccionarTodos = () => setDominados(new Set(categorias));
    const deseleccionarTodos = () => setDominados(new Set());

    const resultado = useMemo(
        () => simularPuntuacion(preguntas, Array.from(dominados), campo),
        [preguntas, dominados, campo]
    );

    if (categorias.length === 0) return null;

    const pctDominado = categorias.length > 0 ? Math.round((dominados.size / categorias.length) * 100) : 0;

    return (
        <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <h2 className="text-lg font-bold text-heading">Simulador de puntuación esperada</h2>
                </div>
                <div className="flex gap-1">
                    {(['bloque', 'tema', 'aplicacion', 'materia'] as const).map(c => (
                        <button key={c} onClick={() => { setCampo(c); setDominados(new Set()); }}
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

            <p className="text-sm text-muted mb-3">
                Seleccionar las categorías que se dominan. Se estimará la puntuación neta (con penalización −⅓).
            </p>

            {/* Botones rápidos */}
            <div className="flex gap-2 mb-3">
                <button onClick={seleccionarTodos} className="text-xs font-medium px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                    Seleccionar todos
                </button>
                <button onClick={deseleccionarTodos} className="text-xs font-medium px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                    Ninguno
                </button>
                <span className="text-xs text-muted ml-auto">{pctDominado}% del temario dominado</span>
            </div>

            {/* Grid de categorías */}
            <div className="flex flex-wrap gap-2 mb-6" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {categorias.map(cat => {
                    const isDom = dominados.has(cat);
                    return (
                        <button key={cat} onClick={() => toggleDominado(cat)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                            style={{
                                backgroundColor: isDom ? 'rgba(34,197,94,0.12)' : 'var(--bg-tertiary)',
                                borderColor: isDom ? 'rgba(34,197,94,0.4)' : 'var(--border-secondary)',
                                color: isDom ? 'var(--accent-success)' : 'var(--text-secondary)',
                            }}>
                            {isDom ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1 opacity-30" />}
                            {cat}
                        </button>
                    );
                })}
            </div>

            {/* Resultados */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                    <div className="text-xs font-semibold text-muted uppercase mb-1">Aciertos estimados</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--accent-success)' }}>{resultado.aciertosEstimados}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                    <div className="text-xs font-semibold text-muted uppercase mb-1">Fallos estimados</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--accent-danger)' }}>{resultado.fallosEstimados}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                    <div className="text-xs font-semibold text-muted uppercase mb-1">En blanco</div>
                    <div className="text-xl font-bold text-muted">{resultado.blancosEstimados}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                    <div className="text-xs font-semibold text-muted uppercase mb-1">Puntuación neta</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                        {resultado.puntuacionNeta} / {resultado.preguntasEsperadas}
                    </div>
                    <div className="text-xs text-muted">{resultado.porcentajeAcierto}% acierto</div>
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="h-4 rounded-full overflow-hidden flex" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div style={{ width: `${(resultado.aciertosEstimados / resultado.preguntasEsperadas) * 100}%`, backgroundColor: '#22c55e' }} title={`${resultado.aciertosEstimados} aciertos`} />
                <div style={{ width: `${(resultado.blancosEstimados / resultado.preguntasEsperadas) * 100}%`, backgroundColor: '#94a3b8' }} title={`${resultado.blancosEstimados} en blanco`} />
                <div style={{ width: `${(resultado.fallosEstimados / resultado.preguntasEsperadas) * 100}%`, backgroundColor: '#dc2626' }} title={`${resultado.fallosEstimados} fallos`} />
            </div>
            <div className="flex justify-between text-xs text-muted mt-1">
                <span>Aciertos: {resultado.aciertosEstimados}</span>
                <span>Blancos: {resultado.blancosEstimados}</span>
                <span>Fallos: {resultado.fallosEstimados}</span>
            </div>

            <p className="text-xs text-muted mt-4">
                Dominado = 85% acierto, 10% blanco, 5% fallo. No dominado = 25% acierto (azar), 40% blanco, 35% fallo.
            </p>
        </div>
    );
};
