import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import { Check, Copy, Pencil, Save } from 'lucide-react';
import type { Pregunta } from '../../types';
import { QuestionMetadata } from './QuestionMetadata';
import { QuestionObservations } from './QuestionObservations';
import { QuestionOptions } from './QuestionOptions';

type StringSetter = Dispatch<SetStateAction<string>>;

interface QuestionDetailProps {
    pregunta: Pregunta;
    editing: boolean;
    anyEditing: boolean;
    copied: boolean;
    soloDetalle: boolean;
    canEdit: boolean;
    editMateria: string;
    editBloque: string;
    editTema: string;
    editApp: string;
    editCorrecta: string;
    editEnunciado: string;
    editObservaciones: string;
    setEditMateria: StringSetter;
    setEditBloque: StringSetter;
    setEditTema: StringSetter;
    setEditApp: StringSetter;
    setEditCorrecta: StringSetter;
    setEditEnunciado: StringSetter;
    setEditObservaciones: StringSetter;
    onCopy: (event: MouseEvent<HTMLButtonElement>) => void;
    onStartEdit: (event: MouseEvent<HTMLButtonElement>) => void;
    onSave: (event: MouseEvent<HTMLButtonElement>) => void;
    onCancelEdit: (event: MouseEvent<HTMLButtonElement>) => void;
    onFiltrarMateria?: (materia: string) => void;
    onFiltrarBloque?: (bloque: string) => void;
    onFiltrarTema?: (tema: string) => void;
    onFiltrarAplicacion?: (app: string) => void;
    onFiltrarAño?: (año: string) => void;
    onFiltrarEscala?: (escala: string) => void;
    onFiltrarAcceso?: (acceso: string) => void;
    onFiltrarEjercicio?: (ejercicio: string) => void;
}

export function QuestionDetail({
    pregunta,
    editing,
    anyEditing,
    copied,
    soloDetalle,
    canEdit,
    editMateria,
    editBloque,
    editTema,
    editApp,
    editCorrecta,
    editEnunciado,
    editObservaciones,
    setEditMateria,
    setEditBloque,
    setEditTema,
    setEditApp,
    setEditCorrecta,
    setEditEnunciado,
    setEditObservaciones,
    onCopy,
    onStartEdit,
    onSave,
    onCancelEdit,
    onFiltrarMateria,
    onFiltrarBloque,
    onFiltrarTema,
    onFiltrarAplicacion,
    onFiltrarAño,
    onFiltrarEscala,
    onFiltrarAcceso,
    onFiltrarEjercicio,
}: QuestionDetailProps) {
    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {!soloDetalle && (
                        <h4 className="text-base font-semibold text-heading">
                            {editing ? 'Editando la pregunta' : 'Detalle de la pregunta'}
                        </h4>
                    )}
                    {!anyEditing && (
                        <button
                            onClick={onCopy}
                            className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded transition-colors"
                            style={{
                                color: copied ? 'var(--accent-success)' : 'var(--text-tertiary)',
                                backgroundColor: copied ? 'rgba(22, 163, 74, 0.1)' : 'var(--bg-tertiary)',
                                border: `1px solid ${copied ? 'var(--accent-success)' : 'transparent'}`,
                            }}
                            title="Copiar contenido de la pregunta al portapapeles"
                        >
                            {copied ? (
                                <><Check className="w-3.5 h-3.5" /> Copiado</>
                            ) : (
                                <><Copy className="w-3.5 h-3.5" /> Copiar</>
                            )}
                        </button>
                    )}
                </div>
                {canEdit && !editing && (
                    <button
                        onClick={onStartEdit}
                        className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--bg-active)' }}
                    >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                )}
                {editing && (
                    <div className="flex gap-2">
                        <button
                            onClick={onSave}
                            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-white transition-colors"
                            style={{ backgroundColor: 'var(--accent-success)' }}
                        >
                            <Save className="w-3.5 h-3.5" /> Guardar
                        </button>
                        <button
                            onClick={onCancelEdit}
                            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-muted text-body"
                        >
                            Cancelar
                        </button>
                    </div>
                )}
            </div>

            {editing ? (
                <textarea
                    value={editEnunciado}
                    onChange={event => setEditEnunciado(event.target.value)}
                    onClick={event => event.stopPropagation()}
                    className="w-full p-3 rounded-lg border text-sm text-body bg-card mb-4 resize-y min-h-[80px]"
                    style={{ borderColor: 'var(--border-primary)' }}
                    aria-label="Enunciado de la pregunta"
                />
            ) : (
                <p className="text-[15px] text-heading font-semibold mb-4 p-4 rounded-lg leading-relaxed" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                    <span className="font-bold text-heading mr-1.5">{pregunta.numero_original}.</span>{pregunta.enunciado}
                </p>
            )}

            <QuestionOptions pregunta={pregunta} />

            {editing ? (
                <div className="mb-5">
                    <h5 className="text-sm font-semibold text-heading mb-2">Observaciones</h5>
                    <textarea
                        value={editObservaciones}
                        onChange={event => setEditObservaciones(event.target.value)}
                        onClick={event => event.stopPropagation()}
                        className="w-full p-3 rounded-lg border text-sm text-body bg-card resize-y min-h-[60px]"
                        style={{ borderColor: 'var(--border-primary)' }}
                        placeholder="Añadir observaciones..."
                        aria-label="Observaciones de la pregunta"
                    />
                </div>
            ) : (
                <QuestionObservations observations={pregunta.observaciones} />
            )}

            <QuestionMetadata
                pregunta={pregunta}
                editing={editing}
                editMateria={editMateria}
                editBloque={editBloque}
                editTema={editTema}
                editApp={editApp}
                editCorrecta={editCorrecta}
                setEditMateria={setEditMateria}
                setEditBloque={setEditBloque}
                setEditTema={setEditTema}
                setEditApp={setEditApp}
                setEditCorrecta={setEditCorrecta}
                onFiltrarMateria={onFiltrarMateria}
                onFiltrarBloque={onFiltrarBloque}
                onFiltrarTema={onFiltrarTema}
                onFiltrarAplicacion={onFiltrarAplicacion}
                onFiltrarAño={onFiltrarAño}
                onFiltrarEscala={onFiltrarEscala}
                onFiltrarAcceso={onFiltrarAcceso}
                onFiltrarEjercicio={onFiltrarEjercicio}
            />
        </>
    );
}

