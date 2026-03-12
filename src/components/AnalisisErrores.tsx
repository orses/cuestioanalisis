import React, { useMemo } from 'react';
import type { Pregunta } from '../types';
import { AlertCircle } from 'lucide-react';

interface RespuestaExamen {
    preguntaId: string;
    respuesta: string | null;
    correcta: boolean;
}

interface AnalisisErroresProps {
    preguntas: Pregunta[];
    respuestas: RespuestaExamen[];
}

interface ErrorPorTema {
    tema: string;
    total: number;
    falladas: number;
    sinResponder: number;
    tasa: number;
    prioridad: 'alta' | 'media' | 'baja';
}

/**
 * Panel de análisis de errores tras un examen simulado.
 * Agrupa los errores por tema/bloque y muestra prioridades de estudio.
 */
export const AnalisisErrores: React.FC<AnalisisErroresProps> = ({ preguntas, respuestas }) => {
    const analisis = useMemo(() => {
        const pregMap = new Map<string, Pregunta>();
        preguntas.forEach(p => pregMap.set(p.id, p));

        const porTema = new Map<string, { total: number; falladas: number; sinResponder: number }>();

        respuestas.forEach(r => {
            const p = pregMap.get(r.preguntaId);
            if (!p) return;
            const tema = p.materia?.toString() || p.bloque || '(sin tema)';
            if (!porTema.has(tema)) porTema.set(tema, { total: 0, falladas: 0, sinResponder: 0 });
            const entry = porTema.get(tema)!;
            entry.total++;
            if (r.respuesta === null) entry.sinResponder++;
            else if (!r.correcta) entry.falladas++;
        });

        const resultado: ErrorPorTema[] = [];
        for (const [tema, data] of porTema) {
            const tasa = data.total > 0 ? (data.falladas + data.sinResponder) / data.total : 0;
            resultado.push({
                tema,
                ...data,
                tasa,
                prioridad: tasa >= 0.6 ? 'alta' : tasa >= 0.3 ? 'media' : 'baja',
            });
        }

        resultado.sort((a, b) => b.tasa - a.tasa);
        return resultado;
    }, [preguntas, respuestas]);

    const totalFalladas = respuestas.filter(r => r.respuesta !== null && !r.correcta).length;
    const totalSinResponder = respuestas.filter(r => r.respuesta === null).length;

    const prioridadColor = (p: string) => {
        if (p === 'alta') return '#ef4444';
        if (p === 'media') return '#f59e0b';
        return 'var(--accent-success)';
    };

    return (
        <div style={{
            padding: '20px', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <AlertCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    📋 Análisis de errores — prioridades de estudio
                </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                {totalFalladas} error{totalFalladas !== 1 ? 'es' : ''} y {totalSinResponder} sin responder en {respuestas.length} preguntas.
            </p>

            {analisis.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>
                    No hay datos de examen para analizar.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {analisis.map((item, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 14px', borderRadius: '8px',
                            border: `1px solid ${item.prioridad === 'alta' ? 'rgba(239,68,68,0.2)' : 'var(--border-secondary)'}`,
                            backgroundColor: item.prioridad === 'alta' ? 'rgba(239,68,68,0.04)' : 'transparent',
                        }}>
                            {/* Prioridad */}
                            <div style={{
                                padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800,
                                textTransform: 'uppercase',
                                backgroundColor: `${prioridadColor(item.prioridad)}15`,
                                color: prioridadColor(item.prioridad),
                            }}>
                                {item.prioridad}
                            </div>

                            {/* Tema */}
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                                {item.tema}
                            </span>

                            {/* Barra de error */}
                            <div style={{ width: '80px', position: 'relative' }}>
                                <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${item.tasa * 100}%`, height: '100%', borderRadius: '4px',
                                        backgroundColor: prioridadColor(item.prioridad),
                                        opacity: 0.7,
                                    }} />
                                </div>
                            </div>

                            {/* Stats */}
                            <span style={{ fontSize: '12px', fontWeight: 700, color: prioridadColor(item.prioridad), minWidth: '36px', textAlign: 'right' }}>
                                {(item.tasa * 100).toFixed(0)}%
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', minWidth: '60px' }}>
                                {item.falladas}✗ · {item.sinResponder}○ / {item.total}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
