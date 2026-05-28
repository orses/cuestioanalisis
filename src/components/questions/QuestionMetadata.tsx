import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import type { Pregunta } from '../../types';
import {
    formatAccessLabel,
    formatCallTypeLabel,
    formatExerciseTypeLabel,
    formatModelLabel,
    formatQuotaLabel,
    formatScaleLabel,
    formatVariantLabel,
} from '../../utils/metadata';
import { normalizarPrograma } from '../../utils/parser';

type StringSetter = Dispatch<SetStateAction<string>>;

interface QuestionMetadataProps {
    pregunta: Pregunta;
    editing: boolean;
    editMateria: string;
    editBloque: string;
    editTema: string;
    editApp: string;
    editCorrecta: string;
    setEditMateria: StringSetter;
    setEditBloque: StringSetter;
    setEditTema: StringSetter;
    setEditApp: StringSetter;
    setEditCorrecta: StringSetter;
    onFiltrarMateria?: (materia: string) => void;
    onFiltrarBloque?: (bloque: string) => void;
    onFiltrarTema?: (tema: string) => void;
    onFiltrarAplicacion?: (app: string) => void;
    onFiltrarAño?: (año: string) => void;
    onFiltrarEscala?: (escala: string) => void;
    onFiltrarAcceso?: (acceso: string) => void;
    onFiltrarEjercicio?: (ejercicio: string) => void;
}

function stopInputClick(event: MouseEvent<HTMLInputElement | HTMLSelectElement>) {
    event.stopPropagation();
}

function filterValue(event: MouseEvent<HTMLElement>, callback: ((value: string) => void) | undefined, value: string) {
    event.stopPropagation();
    if (value) callback?.(value);
}

export function QuestionMetadata({
    pregunta,
    editing,
    editMateria,
    editBloque,
    editTema,
    editApp,
    editCorrecta,
    setEditMateria,
    setEditBloque,
    setEditTema,
    setEditApp,
    setEditCorrecta,
    onFiltrarMateria,
    onFiltrarBloque,
    onFiltrarTema,
    onFiltrarAplicacion,
    onFiltrarAño,
    onFiltrarEscala,
    onFiltrarAcceso,
    onFiltrarEjercicio,
}: QuestionMetadataProps) {
    const normalizedApp = normalizarPrograma(pregunta.aplicacion);

    return (
        <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--border-secondary)' }}>
            <div>
                <h5 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Convocatoria</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                    <div>
                        <span className="block text-[10px] text-muted uppercase mb-0.5">Organismo</span>
                        <span className="font-medium text-heading">{pregunta.metadatos.organismo}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-muted uppercase mb-0.5">Escala</span>
                        <span
                            className="font-medium text-heading cursor-pointer hover:underline"
                            onClick={event => filterValue(event, onFiltrarEscala, pregunta.metadatos.escala)}
                            title={`Filtrar por escala: ${formatScaleLabel(pregunta.metadatos.escala)}`}
                        >
                            {formatScaleLabel(pregunta.metadatos.escala)}
                        </span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-muted uppercase mb-0.5">Año</span>
                        <span
                            className="font-medium text-heading cursor-pointer hover:underline"
                            onClick={event => filterValue(event, onFiltrarAño, String(pregunta.metadatos.año))}
                            title={`Filtrar por año: ${pregunta.metadatos.año}`}
                        >
                            {pregunta.metadatos.año}
                        </span>
                    </div>
                    {pregunta.metadatos.tipoConvocatoria && (
                        <div>
                            <span className="block text-[10px] text-muted uppercase mb-0.5">Tipo convocatoria</span>
                            <span className="font-medium text-heading">{formatCallTypeLabel(pregunta.metadatos.tipoConvocatoria)}</span>
                        </div>
                    )}
                    <div>
                        <span className="block text-[10px] text-muted uppercase mb-0.5">Acceso</span>
                        <span
                            className="font-medium text-heading cursor-pointer hover:underline"
                            onClick={event => filterValue(event, onFiltrarAcceso, pregunta.metadatos.acceso)}
                            title={`Filtrar por acceso: ${formatAccessLabel(pregunta.metadatos.acceso)}`}
                        >
                            {formatAccessLabel(pregunta.metadatos.acceso)}
                        </span>
                    </div>
                    {pregunta.metadatos.cupo && (
                        <div>
                            <span className="block text-[10px] text-muted uppercase mb-0.5">Cupo</span>
                            <span className="font-medium text-heading">{formatQuotaLabel(pregunta.metadatos.cupo)}</span>
                        </div>
                    )}
                    <div>
                        <span className="block text-[10px] text-muted uppercase mb-0.5">Ejercicio</span>
                        <span
                            className="font-medium text-heading cursor-pointer hover:underline"
                            onClick={event => filterValue(event, onFiltrarEjercicio, pregunta.metadatos.tipo)}
                            title={`Filtrar por ejercicio: ${formatExerciseTypeLabel(pregunta.metadatos.tipo)}`}
                        >
                            {formatExerciseTypeLabel(pregunta.metadatos.tipo)}
                        </span>
                    </div>
                    {pregunta.metadatos.modelo && (
                        <div>
                            <span className="block text-[10px] text-muted uppercase mb-0.5">Modelo</span>
                            <span className="font-medium text-heading">{formatModelLabel(pregunta.metadatos.modelo)}</span>
                        </div>
                    )}
                    {pregunta.metadatos.variante && (
                        <div>
                            <span className="block text-[10px] text-muted uppercase mb-0.5">Variante</span>
                            <span className="font-medium text-heading">{formatVariantLabel(pregunta.metadatos.variante)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h5 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Clasificación temática</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                    {editing ? (
                        <>
                            <div>
                                <span className="block text-[10px] text-muted uppercase mb-0.5">N.º Pregunta</span>
                                <span className="font-medium text-heading inline-block py-1.5">{pregunta.numero_original}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-muted uppercase mb-0.5">Materia</span>
                                <input value={editMateria} onChange={event => setEditMateria(event.target.value)} onClick={stopInputClick}
                                    className="w-full px-2 py-1.5 border rounded text-sm bg-card text-body" style={{ borderColor: 'var(--border-primary)' }} />
                            </div>
                            <div>
                                <span className="block text-[10px] text-muted uppercase mb-0.5">Bloque</span>
                                <input value={editBloque} onChange={event => setEditBloque(event.target.value)} onClick={stopInputClick}
                                    className="w-full px-2 py-1.5 border rounded text-sm bg-card text-body" style={{ borderColor: 'var(--border-primary)' }} />
                            </div>
                            <div>
                                <span className="block text-[10px] text-muted uppercase mb-0.5">Tema</span>
                                <input value={editTema} onChange={event => setEditTema(event.target.value)} onClick={stopInputClick}
                                    className="w-full px-2 py-1.5 border rounded text-sm bg-card text-body" style={{ borderColor: 'var(--border-primary)' }} />
                            </div>
                            <div>
                                <span className="block text-[10px] text-muted uppercase mb-0.5">Aplicación</span>
                                <input value={editApp} onChange={event => setEditApp(event.target.value)} onClick={stopInputClick}
                                    className="w-full px-2 py-1.5 border rounded text-sm bg-card text-body" style={{ borderColor: 'var(--border-primary)' }} />
                            </div>
                            <div>
                                <span className="block text-[10px] text-muted uppercase mb-0.5">Correcta</span>
                                <select value={editCorrecta} onChange={event => setEditCorrecta(event.target.value)} onClick={stopInputClick}
                                    className="w-full px-2 py-1.5 border rounded text-sm bg-card text-body" style={{ borderColor: 'var(--border-primary)' }}>
                                    <option value="">-</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <span className="block text-[10px] text-muted uppercase mb-0.5">N.º Pregunta</span>
                                <span className="font-medium text-heading">{pregunta.numero_original}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-muted uppercase mb-0.5">Materia</span>
                                <span
                                    className="font-medium text-heading cursor-pointer hover:underline"
                                    style={{ textTransform: 'capitalize' }}
                                    onClick={event => filterValue(event, onFiltrarMateria, pregunta.materia.toString().toLowerCase().trim())}
                                    title={`Filtrar por materia: ${pregunta.materia}`}
                                >
                                    {pregunta.materia.toString()}
                                </span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-muted uppercase mb-0.5">Bloque</span>
                                <span
                                    className="font-medium text-heading cursor-pointer hover:underline"
                                    onClick={event => filterValue(event, onFiltrarBloque, pregunta.bloque)}
                                    title={pregunta.bloque ? `Filtrar por bloque: ${pregunta.bloque}` : undefined}
                                >
                                    {pregunta.bloque || '-'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-muted uppercase mb-0.5">Tema</span>
                                <span
                                    className="font-medium text-heading cursor-pointer hover:underline"
                                    onClick={event => filterValue(event, onFiltrarTema, pregunta.tema)}
                                    title={pregunta.tema ? `Filtrar por tema: ${pregunta.tema}` : undefined}
                                >
                                    {pregunta.tema || '-'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-muted uppercase mb-0.5">Aplicación</span>
                                <span
                                    className="font-medium text-heading cursor-pointer hover:underline"
                                    onClick={event => filterValue(event, onFiltrarAplicacion, normalizedApp)}
                                    title={normalizedApp ? `Filtrar por aplicación: ${normalizedApp}` : undefined}
                                >
                                    {normalizedApp || '-'}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

