import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pregunta } from '../../types';
import { TablaPreguntas } from '../TablaPreguntas';

interface ModalPreguntaProps {
    preguntaId: string;
    preguntas: Pregunta[];
    preguntasNavegacion?: Pregunta[];
    cuestionarioNombre?: string;
    onNavegar?: (id: string) => void;
    onCerrar: () => void;
    onGuardarEdicion: (id: string, cambios: Partial<Pregunta>) => void;
    onFiltrarMateria: (m: string) => void;
    onFiltrarBloque: (b: string) => void;
    onFiltrarTema: (t: string) => void;
    onFiltrarAplicacion: (a: string) => void;
    onFiltrarAño: (a: string) => void;
    onFiltrarEscala: (e: string) => void;
    onFiltrarAcceso: (a: string) => void;
    onFiltrarEjercicio: (e: string) => void;
}

export const ModalPregunta: React.FC<ModalPreguntaProps> = ({
    preguntaId, preguntas, preguntasNavegacion, cuestionarioNombre, onNavegar, onCerrar,
    onGuardarEdicion,
    onFiltrarMateria, onFiltrarBloque, onFiltrarTema, onFiltrarAplicacion,
    onFiltrarAño, onFiltrarEscala, onFiltrarAcceso, onFiltrarEjercicio,
}) => {
    const pregunta = preguntas.find(p => p.id === preguntaId);

    const navList = preguntasNavegacion ?? [];
    const navIdx = navList.findIndex(p => p.id === preguntaId);
    const prevId = navIdx > 0 ? navList[navIdx - 1].id : null;
    const nextId = navIdx >= 0 && navIdx < navList.length - 1 ? navList[navIdx + 1].id : null;
    const hasNav = onNavegar && navList.length > 1;

    useEffect(() => {
        if (!onNavegar) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && prevId) onNavegar(prevId);
            if (e.key === 'ArrowRight' && nextId) onNavegar(nextId);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [prevId, nextId, onNavegar]);

    if (!pregunta) return null;

    // El overlay es fixed inset-0, así que absolute = relativo al viewport
    return (
        <div
            className="fixed inset-0 z-[100] backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onCerrar}
        >
            {/* Flecha izquierda — absolute dentro del overlay fixed = posición en viewport */}
            {hasNav && (
                <button
                    onClick={e => { e.stopPropagation(); prevId && onNavegar!(prevId); }}
                    disabled={!prevId}
                    title="Anterior (←)"
                    className="absolute top-1/2 -translate-y-1/2 z-[110] flex items-center justify-center rounded-full shadow-2xl transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
                    style={{
                        left: 12,
                        width: 52, height: 52,
                        backgroundColor: 'var(--accent-primary)',
                        color: '#fff',
                    }}
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
            )}

            {/* Flecha derecha */}
            {hasNav && (
                <button
                    onClick={e => { e.stopPropagation(); nextId && onNavegar!(nextId); }}
                    disabled={!nextId}
                    title="Siguiente (→)"
                    className="absolute top-1/2 -translate-y-1/2 z-[110] flex items-center justify-center rounded-full shadow-2xl transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
                    style={{
                        right: 12,
                        width: 52, height: 52,
                        backgroundColor: 'var(--accent-primary)',
                        color: '#fff',
                    }}
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            )}

            {/* Modal anclado arriba, con margen lateral para dejar ver las flechas */}
            <div
                className="flex justify-center pt-10 h-full pointer-events-none"
                style={{ paddingLeft: 76, paddingRight: 76 }}
            >
                <div
                    className="bg-card w-full max-w-5xl max-h-[88vh] overflow-y-auto rounded-xl shadow-2xl relative border pointer-events-auto"
                    style={{ borderColor: 'var(--border-secondary)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Cabecera — una sola línea */}
                    <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-3 border-b bg-card" style={{ borderColor: 'var(--border-secondary)' }}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <h3 className="text-sm font-bold text-heading whitespace-nowrap">Detalle de la pregunta</h3>
                            {cuestionarioNombre && (
                                <>
                                    <span className="text-muted">·</span>
                                    <span className="text-sm text-muted truncate">{cuestionarioNombre}</span>
                                </>
                            )}
                            {hasNav && (
                                <>
                                    <span className="text-muted flex-shrink-0">·</span>
                                    <span className="text-sm font-semibold flex-shrink-0" style={{ color: 'var(--accent-primary)' }}>
                                        {navIdx + 1} / {navList.length}
                                    </span>
                                </>
                            )}
                        </div>
                        <button
                            onClick={onCerrar}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                        >
                            <X className="w-5 h-5 text-muted hover:text-red-500" />
                        </button>
                    </div>

                    <div className="p-2 sm:p-4">
                        <TablaPreguntas
                            preguntas={[pregunta]}
                            onGuardarEdicion={onGuardarEdicion}
                            onFiltrarMateria={onFiltrarMateria}
                            onFiltrarBloque={onFiltrarBloque}
                            onFiltrarTema={onFiltrarTema}
                            onFiltrarAplicacion={onFiltrarAplicacion}
                            onFiltrarAño={onFiltrarAño}
                            onFiltrarEscala={onFiltrarEscala}
                            onFiltrarAcceso={onFiltrarAcceso}
                            onFiltrarEjercicio={onFiltrarEjercicio}
                            preguntaExpandida={preguntaId}
                            soloDetalle={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
