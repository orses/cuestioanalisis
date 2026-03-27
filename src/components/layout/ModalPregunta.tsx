import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pregunta } from '../../types';
import { TablaPreguntas } from '../TablaPreguntas';

interface ModalPreguntaProps {
    preguntaId: string;
    preguntas: Pregunta[];
    preguntasNavegacion?: Pregunta[];
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
    preguntaId, preguntas, preguntasNavegacion, onNavegar, onCerrar,
    onGuardarEdicion,
    onFiltrarMateria, onFiltrarBloque, onFiltrarTema, onFiltrarAplicacion,
    onFiltrarAño, onFiltrarEscala, onFiltrarAcceso, onFiltrarEjercicio,
}) => {
    const pregunta = preguntas.find(p => p.id === preguntaId);

    const navList = preguntasNavegacion ?? [];
    const navIdx = navList.findIndex(p => p.id === preguntaId);
    const prevId = navIdx > 0 ? navList[navIdx - 1].id : null;
    const nextId = navIdx >= 0 && navIdx < navList.length - 1 ? navList[navIdx + 1].id : null;

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

    const hasNav = onNavegar && navList.length > 1;

    return (
        <div
            className="fixed inset-0 z-[100] backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onCerrar}
        >
            {/* Flecha izquierda — fuera del modal, centrada verticalmente en la ventana */}
            {hasNav && (
                <button
                    onClick={e => { e.stopPropagation(); prevId && onNavegar!(prevId); }}
                    disabled={!prevId}
                    title="Anterior (←)"
                    className="fixed left-3 top-1/2 -translate-y-1/2 z-[110] flex items-center justify-center rounded-full shadow-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    style={{
                        width: 52, height: 52,
                        backgroundColor: 'var(--accent-primary)',
                        color: '#fff',
                    }}
                >
                    <ChevronLeft className="w-7 h-7" />
                </button>
            )}

            {/* Flecha derecha */}
            {hasNav && (
                <button
                    onClick={e => { e.stopPropagation(); nextId && onNavegar!(nextId); }}
                    disabled={!nextId}
                    title="Siguiente (→)"
                    className="fixed right-3 top-1/2 -translate-y-1/2 z-[110] flex items-center justify-center rounded-full shadow-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    style={{
                        width: 52, height: 52,
                        backgroundColor: 'var(--accent-primary)',
                        color: '#fff',
                    }}
                >
                    <ChevronRight className="w-7 h-7" />
                </button>
            )}

            {/* Modal anclado arriba */}
            <div className="flex justify-center pt-12 px-16 h-full pointer-events-none">
                <div
                    className="bg-card w-full max-w-5xl max-h-[88vh] overflow-y-auto rounded-xl shadow-2xl relative border pointer-events-auto"
                    style={{ borderColor: 'var(--border-secondary)' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-card" style={{ borderColor: 'var(--border-secondary)' }}>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-heading">Detalle de la pregunta</h3>
                            {hasNav && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                                    {navIdx + 1} / {navList.length}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onCerrar}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            <X className="w-5 h-5 text-muted hover:text-red-500" />
                        </button>
                    </div>
                    <div className="p-1 sm:p-6">
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
