import React from 'react';
import { X } from 'lucide-react';
import type { Pregunta } from '../../types';
import { TablaPreguntas } from '../TablaPreguntas';

interface ModalPreguntaProps {
    preguntaId: string;
    preguntas: Pregunta[];
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
    preguntaId, preguntas, onCerrar,
    onGuardarEdicion,
    onFiltrarMateria, onFiltrarBloque, onFiltrarTema, onFiltrarAplicacion,
    onFiltrarAño, onFiltrarEscala, onFiltrarAcceso, onFiltrarEjercicio,
}) => {
    const pregunta = preguntas.find(p => p.id === preguntaId);
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
                    <h3 className="text-lg font-bold text-heading">Detalle de la pregunta</h3>
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
    );
};
