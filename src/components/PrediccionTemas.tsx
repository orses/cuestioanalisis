import React, { useMemo } from 'react';
import type { Pregunta } from '../types';
import { predecirTemas, type PrediccionTema } from '../utils/analytics';
import { Target, TrendingUp, TrendingDown, Minus, Layers, BookOpen, Monitor } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface PrediccionTemasProps {
    preguntas: Pregunta[];
}

const tendenciaIcon = (t: string) => {
    if (t === 'creciente') return <TrendingUp className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />;
    if (t === 'decreciente') return <TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />;
    return <Minus className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />;
};

const getProbColor = (prob: number): string => {
    if (prob >= 70) return '#ef4444';
    if (prob >= 50) return '#f59e0b';
    if (prob >= 30) return 'var(--accent-primary)';
    return 'var(--text-tertiary)';
};

const FilaPrediccion: React.FC<{ p: PrediccionTema; i: number }> = ({ p, i }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', borderRadius: '8px',
        backgroundColor: i < 3 ? 'rgba(239,68,68,0.05)' : 'transparent',
        border: i < 3 ? '1px solid rgba(239,68,68,0.15)' : '1px solid transparent',
    }}>
        <span style={{
            fontSize: '11px', fontWeight: 900, color: i < 3 ? '#ef4444' : 'var(--text-tertiary)',
            width: '22px', textAlign: 'center',
        }}>
            {i + 1}
        </span>
        <div style={{ width: '50px', position: 'relative' }}>
            <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-tertiary)' }}>
                <div style={{
                    width: `${p.probabilidad}%`, height: '100%', borderRadius: '3px',
                    backgroundColor: getProbColor(p.probabilidad),
                    transition: 'width 0.3s ease',
                }} />
            </div>
        </div>
        <span style={{
            fontSize: '13px', fontWeight: 800, color: getProbColor(p.probabilidad),
            minWidth: '36px',
        }}>
            {p.probabilidad}%
        </span>
        <span style={{
            fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)',
            flex: 1,
        }}>
            {p.tema}
        </span>
        {tendenciaIcon(p.tendencia)}
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '28px', textAlign: 'right' }}>
            {p.frecuenciaTotal}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', minWidth: '70px', textAlign: 'right' }}>
            {p.añosPresente[0]}–{p.añosPresente[p.añosPresente.length - 1]}
        </span>
    </div>
);

const SeccionPrediccion: React.FC<{
    titulo: string;
    icono: React.ReactNode;
    items: PrediccionTema[];
    topN: number;
    tooltipTexto: string;
}> = ({ titulo, icono, items, topN, tooltipTexto }) => {
    const visibles = items.slice(0, topN);
    if (visibles.length === 0) return null;

    return (
        <div style={{
            padding: '16px', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                {icono}
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {titulo}
                </h4>
                <InfoTooltip texto={tooltipTexto} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {visibles.map((p, i) => (
                    <FilaPrediccion key={`${p.campo}-${p.tema}`} p={p} i={i} />
                ))}
            </div>
        </div>
    );
};

export const PrediccionTemas: React.FC<PrediccionTemasProps> = ({ preguntas }) => {
    const todasPredicciones = useMemo(() => predecirTemas(preguntas), [preguntas]);

    const porBloques = useMemo(() => todasPredicciones.filter(p => p.campo === 'bloque'), [todasPredicciones]);
    const porTemas = useMemo(() => todasPredicciones.filter(p => p.campo === 'tema'), [todasPredicciones]);
    const porProgramas = useMemo(() => todasPredicciones.filter(p => p.campo === 'aplicacion'), [todasPredicciones]);

    const hayDatos = porBloques.length > 0 || porTemas.length > 0 || porProgramas.length > 0;

    return (
        <div style={{
            padding: '20px', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Target className="w-5 h-5" style={{ color: '#ef4444' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Predicción de elementos probables
                </h3>
                <InfoTooltip texto="Ranking de bloques, temas y programas según su probabilidad de aparecer en futuras convocatorias. Se calcula combinando 4 factores: frecuencia histórica (cuántas veces ha aparecido), cobertura temporal (en cuántos años aparece), aparición reciente (si salió en el último ejercicio) y tendencia (si su frecuencia sube o baja con el tiempo). Un porcentaje mayor indica mayor riesgo de aparición." />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Ranking basado en frecuencia, aparición reciente, cobertura temporal y tendencia. Mayor porcentaje = mayor probabilidad de aparición en próximas convocatorias.
            </p>

            {!hayDatos ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>
                    No hay datos suficientes para generar predicciones.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <SeccionPrediccion
                        titulo="Predicción de bloques"
                        icono={<Layers className="w-4 h-4" style={{ color: '#f59e0b' }} />}
                        items={porBloques}
                        topN={10}
                        tooltipTexto="Bloques temáticos ordenados por probabilidad de aparición. Se basa en cuántas veces ha salido cada bloque, en cuántos años aparece, si apareció recientemente y si su tendencia es creciente."
                    />
                    <SeccionPrediccion
                        titulo="Predicción de temas"
                        icono={<BookOpen className="w-4 h-4" style={{ color: '#8b5cf6' }} />}
                        items={porTemas}
                        topN={15}
                        tooltipTexto="Temas específicos dentro de cada bloque ordenados por probabilidad. Un tema con alta frecuencia, presente en muchos años y con tendencia creciente obtiene mayor puntuación."
                    />
                    <SeccionPrediccion
                        titulo="Predicción de programas"
                        icono={<Monitor className="w-4 h-4" style={{ color: '#0ea5e9' }} />}
                        items={porProgramas}
                        topN={15}
                        tooltipTexto="Programas o aplicaciones informáticas (por ejemplo: Word, Windows, Excel) ordenados por probabilidad de aparición futura, siguiendo los mismos criterios de frecuencia, cobertura, aparición reciente y tendencia."
                    />
                </div>
            )}

            {/* Leyenda */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} /> ≥70% Alta probabilidad
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} /> ≥50% Probable
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} /> ≥30% Posible
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-tertiary)' }} /> &lt;30% Menor riesgo
                </span>
            </div>
        </div>
    );
};
