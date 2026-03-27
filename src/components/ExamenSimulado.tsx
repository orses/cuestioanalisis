import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Pregunta } from '../types';
import { Play, StopCircle, RotateCcw, Clock, CheckCircle2, XCircle, Trophy, ChevronDown } from 'lucide-react';
import { AnalisisErrores } from './AnalisisErrores';

interface ExamenSimuladoProps {
    preguntas: Pregunta[];
}

interface RespuestaExamen {
    preguntaId: string;
    respuesta: string | null;
    correcta: boolean;
}

type EstadoExamen = 'configurar' | 'en-curso' | 'finalizado';

const COLORES_LETRA: Record<string, string> = { A: '#3b82f6', B: '#10b981', C: '#f59e0b', D: '#8b5cf6' };

const RevisionRespuestas: React.FC<{ preguntasExamen: Pregunta[]; respuestas: RespuestaExamen[] }> = ({ preguntasExamen, respuestas }) => {
    const [expandidas, setExpandidas] = useState<Set<number>>(new Set());

    const toggle = (i: number) => setExpandidas(prev => {
        const next = new Set(prev);
        next.has(i) ? next.delete(i) : next.add(i);
        return next;
    });

    return (
        <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Revisión de respuestas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {preguntasExamen.map((p, i) => {
                    const r = respuestas[i];
                    const acerto = r.correcta;
                    const respondio = r.respuesta !== null;
                    const abierta = expandidas.has(i);
                    const borderColor = !respondio ? 'var(--border-secondary)' : acerto ? 'var(--accent-success)' : 'var(--accent-danger)';
                    const bgColor = !respondio ? 'var(--bg-tertiary)' : acerto ? 'rgba(34,197,94,0.06)' : 'rgba(220,38,38,0.06)';

                    return (
                        <div key={p.id} style={{ borderRadius: '6px', border: `1px solid ${borderColor}`, backgroundColor: bgColor, overflow: 'hidden' }}>
                            {/* Cabecera clicable */}
                            <button
                                onClick={() => toggle(i)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px',
                                    padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                                }}
                            >
                                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                                    {!respondio
                                        ? <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>○</span>
                                        : acerto
                                            ? <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-success)' }} />
                                            : <XCircle className="w-4 h-4" style={{ color: 'var(--accent-danger)' }} />
                                    }
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '3px' }}>
                                        <span style={{ fontWeight: 700 }}>{i + 1}.</span> {p.enunciado.substring(0, 120)}{p.enunciado.length > 120 ? '…' : ''}
                                    </div>
                                    <div style={{ fontSize: '11px', display: 'flex', gap: '12px' }}>
                                        {respondio && !acerto && (
                                            <span style={{ color: 'var(--accent-danger)' }}>Tu respuesta: {r.respuesta}</span>
                                        )}
                                        <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>Correcta: {p.correcta}</span>
                                    </div>
                                </div>
                                <ChevronDown className="w-4 h-4 flex-shrink-0 mt-0.5" style={{
                                    color: 'var(--text-tertiary)',
                                    transform: abierta ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s',
                                }} />
                            </button>

                            {/* Detalle expandido */}
                            {abierta && (
                                <div style={{ padding: '0 14px 14px 34px', borderTop: `1px solid ${borderColor}` }}>
                                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.7, margin: '10px 0 12px' }}>
                                        {p.enunciado}
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {(['A', 'B', 'C', 'D'] as const).map(letra => {
                                            const texto = p.opciones[letra];
                                            if (!texto) return null;
                                            const esCorrecta = letra === p.correcta;
                                            const esSeleccion = letra === r.respuesta;
                                            const color = esCorrecta ? 'var(--accent-success)' : (esSeleccion && !esCorrecta) ? 'var(--accent-danger)' : 'var(--border-secondary)';
                                            return (
                                                <div key={letra} style={{
                                                    display: 'flex', gap: '8px', alignItems: 'flex-start',
                                                    padding: '7px 10px', borderRadius: '6px',
                                                    border: `1.5px solid ${color}`,
                                                    backgroundColor: esCorrecta ? 'rgba(34,197,94,0.08)' : (esSeleccion && !esCorrecta) ? 'rgba(220,38,38,0.08)' : 'transparent',
                                                }}>
                                                    <span style={{
                                                        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '10px', fontWeight: 800,
                                                        backgroundColor: esCorrecta ? 'var(--accent-success)' : (esSeleccion && !esCorrecta) ? 'var(--accent-danger)' : COLORES_LETRA[letra],
                                                        color: '#fff',
                                                    }}>{letra}</span>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{texto}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const ExamenSimulado: React.FC<ExamenSimuladoProps> = ({ preguntas }) => {
    const [estado, setEstado] = useState<EstadoExamen>('configurar');
    const [numPreguntas, setNumPreguntas] = useState(30);
    const [tiempoMinutos, setTiempoMinutos] = useState(45);
    const [modoPonderado, setModoPonderado] = useState(true);
    const [preguntasExamen, setPreguntasExamen] = useState<Pregunta[]>([]);
    const [respuestas, setRespuestas] = useState<RespuestaExamen[]>([]);
    const [actual, setActual] = useState(0);
    const [segundosRestantes, setSegundosRestantes] = useState(0);
    const timerRef = useRef<number | null>(null);

    // Generar examen aleatorio ponderado por materia o 100% aleatorio
    const iniciarExamen = useCallback(() => {
        const disponibles = preguntas.filter(p => p.correcta); // solo con respuesta
        if (disponibles.length === 0) return;

        const n = Math.min(numPreguntas, disponibles.length);
        let seleccion: Pregunta[] = [];

        if (modoPonderado) {
            // Calcular frecuencias relativas de bloques (usamos 'materia-bloque' o solo 'materia' como fallback)
            const frecuencias = new Map<string, number>();
            disponibles.forEach(p => {
                const clave = p.bloque ? `${p.materia} - ${p.bloque}` : p.materia.toString();
                frecuencias.set(clave, (frecuencias.get(clave) || 0) + 1);
            });

            // Agrupar preguntas por esa clave
            const agrupadas = new Map<string, Pregunta[]>();
            disponibles.forEach(p => {
                const clave = p.bloque ? `${p.materia} - ${p.bloque}` : p.materia.toString();
                if (!agrupadas.has(clave)) agrupadas.set(clave, []);
                agrupadas.get(clave)!.push(p);
            });

            // Barajar cada grupo
            agrupadas.forEach(grupo => grupo.sort(() => Math.random() - 0.5));

            // Distribuir n preguntas según frecuencia
            const cupos = new Map<string, number>();
            let asignadas = 0;
            frecuencias.forEach((count, clave) => {
                const proporcion = count / disponibles.length;
                const cupo = Math.floor(proporcion * n);
                cupos.set(clave, cupo);
                asignadas += cupo;
            });

            // Asignar el resto (n - asignadas) a los grupos que más decimales perdieron
            const faltantes = n - asignadas;
            const clavesOrdenadas = Array.from(frecuencias.keys()).sort((a, b) => {
                const propA = (frecuencias.get(a)! / disponibles.length) * n;
                const propB = (frecuencias.get(b)! / disponibles.length) * n;
                const restoA = propA - Math.floor(propA);
                const restoB = propB - Math.floor(propB);
                return restoB - restoA; // Mayor resto primero
            });

            for (let i = 0; i < faltantes && i < clavesOrdenadas.length; i++) {
                cupos.set(clavesOrdenadas[i], cupos.get(clavesOrdenadas[i])! + 1);
            }

            // Extraer las preguntas
            cupos.forEach((cupo, clave) => {
                const grupo = agrupadas.get(clave)!;
                seleccion.push(...grupo.slice(0, cupo));
            });

            // Barajar la selección final para que no salgan ordenadas por bloque
            seleccion.sort(() => Math.random() - 0.5);

            // Red de seguridad por si faltasen o sobrasen por redondeos extremos
            if (seleccion.length < n) {
                const sobrantes = disponibles.filter(p => !seleccion.includes(p)).sort(() => Math.random() - 0.5);
                seleccion.push(...sobrantes.slice(0, n - seleccion.length));
            } else if (seleccion.length > n) {
                seleccion = seleccion.slice(0, n);
            }
        } else {
            const shuffled = [...disponibles].sort(() => Math.random() - 0.5);
            seleccion = shuffled.slice(0, n);
        }

        setPreguntasExamen(seleccion);
        setRespuestas(seleccion.map(p => ({ preguntaId: p.id, respuesta: null, correcta: false })));
        setActual(0);
        setSegundosRestantes(tiempoMinutos * 60);
        setEstado('en-curso');
    }, [preguntas, numPreguntas, tiempoMinutos, modoPonderado]);

    // Timer
    useEffect(() => {
        if (estado !== 'en-curso') return;

        timerRef.current = window.setInterval(() => {
            setSegundosRestantes(prev => {
                if (prev <= 1) {
                    setEstado('finalizado');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [estado]);

    const finalizarExamen = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setEstado('finalizado');
    }, []);

    const responder = useCallback((letra: string) => {
        const p = preguntasExamen[actual];
        setRespuestas(prev => {
            const nueva = [...prev];
            nueva[actual] = {
                preguntaId: p.id,
                respuesta: letra,
                correcta: letra === p.correcta,
            };
            return nueva;
        });
    }, [actual, preguntasExamen]);

    // Estadísticas de resultado
    const stats = useMemo(() => {
        const contestadas = respuestas.filter(r => r.respuesta !== null);
        const correctas = contestadas.filter(r => r.correcta);
        const incorrectas = contestadas.filter(r => !r.correcta);
        const sinResponder = respuestas.filter(r => r.respuesta === null);
        // Puntuación tipo oposición: +1 correcta, -0.33 incorrecta
        const puntuacion = correctas.length - (incorrectas.length * 0.33);
        const maxPuntuacion = respuestas.length;
        return { contestadas: contestadas.length, correctas: correctas.length, incorrectas: incorrectas.length, sinResponder: sinResponder.length, puntuacion, maxPuntuacion };
    }, [respuestas]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    // ═══ PANTALLA DE CONFIGURACIÓN ═══
    if (estado === 'configurar') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '500px', margin: '0 auto' }}>
                <div style={{
                    padding: '32px', borderRadius: '12px', textAlign: 'center',
                    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                }}>
                    <Trophy className="w-12 h-12" style={{ color: 'var(--accent-primary)', margin: '0 auto 16px' }} />
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Examen Simulado</h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Prueba en condiciones reales. Puntuación: +1 acierto, −0,33 error.
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '24px', lineHeight: 1.5 }}>
                        Las preguntas se seleccionan aleatoriamente del dataset cargado (preguntas reales de convocatorias anteriores, no generadas).
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                Número de preguntas
                            </label>
                            <input
                                type="number" min={5} max={Math.min(preguntas.length, 200)} value={numPreguntas}
                                onChange={e => setNumPreguntas(parseInt(e.target.value) || 30)}
                                style={{
                                    width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '14px',
                                    border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                Tiempo (minutos)
                            </label>
                            <input
                                type="number" min={5} max={180} value={tiempoMinutos}
                                onChange={e => setTiempoMinutos(parseInt(e.target.value) || 45)}
                                style={{
                                    width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '14px',
                                    border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)' }}>
                            <input
                                type="checkbox"
                                checked={modoPonderado}
                                onChange={e => setModoPonderado(e.target.checked)}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                            />
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Simulacro Inteligente Ponderado</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Selecciona las preguntas respetando el peso histórico (frecuencia) de cada tema o bloque en el set de datos filtrado actual.</div>
                            </div>
                        </label>
                    </div>

                    <button
                        onClick={iniciarExamen}
                        disabled={preguntas.filter(p => p.correcta).length === 0}
                        style={{
                            marginTop: '24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', padding: '12px', borderRadius: '8px', fontSize: '16px', fontWeight: 700,
                            border: 'none', cursor: 'pointer',
                            backgroundColor: 'var(--accent-primary)', color: '#fff',
                        }}
                    >
                        <Play className="w-5 h-5" /> Comenzar examen
                    </button>
                </div>
            </div>
        );
    }

    // ═══ PANTALLA DE EXAMEN EN CURSO ═══
    if (estado === 'en-curso') {
        const p = preguntasExamen[actual];
        const respActual = respuestas[actual];
        const tiempoBajo = segundosRestantes < 120;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Barra superior */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: '10px',
                    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Pregunta {actual + 1} de {preguntasExamen.length}
                        </span>
                        <div style={{ width: '200px', height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-tertiary)' }}>
                            <div style={{
                                width: `${((actual + 1) / preguntasExamen.length) * 100}%`,
                                height: '100%', borderRadius: '3px', backgroundColor: 'var(--accent-primary)',
                                transition: 'width 0.3s ease',
                            }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '4px 12px', borderRadius: '6px', fontSize: '16px', fontWeight: 800,
                            fontFamily: 'monospace',
                            backgroundColor: tiempoBajo ? 'rgba(220,38,38,0.1)' : 'var(--bg-tertiary)',
                            color: tiempoBajo ? 'var(--accent-danger)' : 'var(--text-primary)',
                        }}>
                            <Clock className="w-4 h-4" />
                            {formatTime(segundosRestantes)}
                        </div>
                        <button
                            onClick={finalizarExamen}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                border: '1px solid var(--accent-danger)', backgroundColor: 'transparent',
                                color: 'var(--accent-danger)', cursor: 'pointer',
                            }}
                        >
                            <StopCircle className="w-4 h-4" /> Finalizar
                        </button>
                    </div>
                </div>

                {/* Pregunta */}
                <div style={{
                    padding: '24px', borderRadius: '10px',
                    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px' }}>
                            Año: {p.metadatos.año}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px' }}>
                            Escala: {p.metadatos.escala === 'AUX' ? 'Auxiliar administrativo' : p.metadatos.escala === 'ADV' ? 'Administrativo' : p.metadatos.escala === 'PSX' ? 'Personal de Servicios Generales' : p.metadatos.escala}
                        </span>
                    </div>
                    <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.8, marginBottom: '20px' }}>
                        {p.enunciado}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(['A', 'B', 'C', 'D'] as const).map(letra => {
                            const texto = p.opciones[letra];
                            if (!texto) return null;
                            const sel = respActual.respuesta === letra;
                            const coloresLetra: Record<string, string> = { A: '#3b82f6', B: '#10b981', C: '#f59e0b', D: '#8b5cf6' };
                            return (
                                <button
                                    key={letra}
                                    onClick={() => responder(letra)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '12px 16px', borderRadius: '8px',
                                        border: `2px solid ${sel ? coloresLetra[letra] : 'var(--border-secondary)'}`,
                                        backgroundColor: sel ? `${coloresLetra[letra]}15` : 'var(--bg-secondary)',
                                        cursor: 'pointer', textAlign: 'left',
                                    }}
                                >
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '12px', fontWeight: 800, flexShrink: 0,
                                        backgroundColor: sel ? coloresLetra[letra] : 'var(--bg-tertiary)',
                                        color: sel ? '#fff' : 'var(--text-primary)',
                                    }}>
                                        {letra}
                                    </div>
                                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                        {texto}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Navegación */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                        disabled={actual === 0}
                        onClick={() => setActual(a => a - 1)}
                        style={{
                            padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                            border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)', cursor: actual === 0 ? 'not-allowed' : 'pointer',
                            opacity: actual === 0 ? 0.5 : 1,
                        }}
                    >
                        ← Anterior
                    </button>

                    {/* Mini-mapa de preguntas */}
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', maxWidth: '400px', justifyContent: 'center' }}>
                        {respuestas.map((r, i) => (
                            <button
                                key={i}
                                onClick={() => setActual(i)}
                                style={{
                                    width: '20px', height: '20px', borderRadius: '3px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '8px', fontWeight: 700, border: 'none', cursor: 'pointer',
                                    backgroundColor: i === actual ? 'var(--accent-primary)'
                                        : r.respuesta ? 'var(--accent-success)' : 'var(--bg-tertiary)',
                                    color: (i === actual || r.respuesta) ? '#fff' : 'var(--text-tertiary)',
                                }}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        disabled={actual === preguntasExamen.length - 1}
                        onClick={() => setActual(a => a + 1)}
                        style={{
                            padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                            border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)', cursor: actual === preguntasExamen.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: actual === preguntasExamen.length - 1 ? 0.5 : 1,
                        }}
                    >
                        Siguiente →
                    </button>
                </div>
            </div>
        );
    }

    // ═══ PANTALLA DE RESULTADOS ═══
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Resumen */}
            <div style={{
                padding: '32px', borderRadius: '12px', textAlign: 'center',
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
            }}>
                <Trophy className="w-12 h-12" style={{
                    color: stats.puntuacion > stats.maxPuntuacion * 0.6 ? '#f59e0b' : 'var(--text-tertiary)',
                    margin: '0 auto 12px',
                }} />
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Resultado del examen
                </h2>
                <div style={{ fontSize: '40px', fontWeight: 900, color: 'var(--accent-primary)', margin: '12px 0' }}>
                    {stats.puntuacion.toFixed(2)} / {stats.maxPuntuacion}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    ({(stats.puntuacion / stats.maxPuntuacion * 100).toFixed(1)}% de la puntuación máxima)
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Correctas</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-success)' }}>{stats.correctas}</div>
                </div>
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Incorrectas</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-danger)' }}>{stats.incorrectas}</div>
                </div>
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Sin responder</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-tertiary)' }}>{stats.sinResponder}</div>
                </div>
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Penalización</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-warning)' }}>−{(stats.incorrectas * 0.33).toFixed(2)}</div>
                </div>
            </div>

            {/* Análisis de errores por tema */}
            <AnalisisErrores preguntas={preguntasExamen} respuestas={respuestas} />

            {/* Revisión */}
            <RevisionRespuestas preguntasExamen={preguntasExamen} respuestas={respuestas} />

            {/* Reiniciar */}
            <button
                onClick={() => setEstado('configurar')}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
                    border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)', cursor: 'pointer',
                }}
            >
                <RotateCcw className="w-4 h-4" /> Nuevo examen
            </button>
        </div>
    );
};
