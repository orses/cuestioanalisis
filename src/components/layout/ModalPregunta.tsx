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

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onCerrar}
        >
            <div
                className="bg-card w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl relative border"
                style={{ borderColor: 'var(--border-secondary)' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-card" style={{ borderColor: 'var(--border-secondary)' }}>
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-heading">Detalle de la pregunta</h3>
                        {navList.length > 1 && (
                            <span className="text-xs text-muted font-mono">
                                {navIdx + 1} / {navList.length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {onNavegar && navList.length > 1 && (
                            <>
                                <button
                                    onClick={() => prevId && onNavegar(prevId)}
                                    disabled={!prevId}
                                    className="p-2 rounded-lg transition-colors disabled:opacity-30"
                                    style={{ color: 'var(--text-primary)' }}
                                    title="Anterior (←)"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => nextId && onNavegar(nextId)}
                                    disabled={!nextId}
                                    className="p-2 rounded-lg transition-colors disabled:opacity-30"
                                    style={{ color: 'var(--text-primary)' }}
                                    title="Siguiente (→)"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        <button
                            onClick={onCerrar}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                            <X className="w-5 h-5 text-muted hover:text-red-500" />
                        </button>
                    </div>
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
    );
};
