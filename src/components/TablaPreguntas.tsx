import React, { useState, useEffect } from 'react';
import type { Pregunta } from '../types';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getMateriaColor } from '../utils/colores';
import { formatScaleLabel } from '../utils/metadata';
import { PaginationControls } from './common/PaginationControls';
import { QuestionDetail } from './questions/QuestionDetail';
import { usePaginatedRows } from '../hooks/usePaginatedRows';

interface TablaPreguntasProps {
    preguntas: Pregunta[];
    onGuardarEdicion?: (id: string, cambios: Partial<Pregunta>) => void;
    onFiltrarMateria?: (materia: string) => void;
    onFiltrarBloque?: (bloque: string) => void;
    onFiltrarTema?: (tema: string) => void;
    onFiltrarAplicacion?: (app: string) => void;
    onFiltrarAño?: (año: string) => void;
    onFiltrarEscala?: (escala: string) => void;
    onFiltrarAcceso?: (acceso: string) => void;
    onFiltrarEjercicio?: (ejercicio: string) => void;
    preguntaExpandida?: string | null;
    soloDetalle?: boolean;
    onVerPregunta?: (id: string) => void;
}

export const TablaPreguntas: React.FC<TablaPreguntasProps> = ({ preguntas, onGuardarEdicion, onFiltrarMateria, onFiltrarBloque, onFiltrarTema, onFiltrarAplicacion, onFiltrarAño, onFiltrarEscala, onFiltrarAcceso, onFiltrarEjercicio, preguntaExpandida, soloDetalle = false, onVerPregunta }) => {
    const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [copiadoId, setCopiadoId] = useState<string | null>(null);
    const pagination = usePaginatedRows(preguntas);
    const preguntasVisibles = soloDetalle ? preguntas : pagination.rows;
    const mostrarPaginacion = !soloDetalle && preguntas.length > pagination.pageSize;

    useEffect(() => {
        if (preguntaExpandida) {
            // Hacer scroll a la tarjeta después de un breve delay para que se renderice
            setTimeout(() => {
                const el = document.getElementById(`tarjeta-${preguntaExpandida}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [preguntaExpandida]);

    const estaExpandida = (preguntaId: string) => expandidas.has(preguntaId) || preguntaExpandida === preguntaId;

    // Campos de edición temporal
    const [editMateria, setEditMateria] = useState('');
    const [editBloque, setEditBloque] = useState('');
    const [editTema, setEditTema] = useState('');
    const [editApp, setEditApp] = useState('');
    const [editCorrecta, setEditCorrecta] = useState('');
    const [editEnunciado, setEditEnunciado] = useState('');
    const [editObservaciones, setEditObservaciones] = useState('');

    const toggleExpand = (id: string) => {
        setExpandidas(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
        setEditandoId(null);
    };

    React.useEffect(() => {
        const contraer = () => setExpandidas(new Set());
        document.addEventListener('contraerTodasLasFichas', contraer);
        return () => document.removeEventListener('contraerTodasLasFichas', contraer);
    }, []);

    const iniciarEdicion = (p: Pregunta) => {
        setEditandoId(p.id);
        setEditMateria(p.materia.toString());
        setEditBloque(p.bloque);
        setEditTema(p.tema);
        setEditApp(p.aplicacion);
        setEditCorrecta(p.correcta || '');
        setEditEnunciado(p.enunciado);
        setEditObservaciones(p.observaciones || '');
    };

    const guardar = (id: string) => {
        if (onGuardarEdicion) {
            onGuardarEdicion(id, {
                materia: editMateria,
                bloque: editBloque,
                tema: editTema,
                aplicacion: editApp,
                correcta: editCorrecta || null,
                enunciado: editEnunciado,
                observaciones: editObservaciones,
            });
        }
        setEditandoId(null);
    };

    const handleCopiar = (e: React.MouseEvent, p: Pregunta) => {
        e.stopPropagation();

        const lineas: string[] = [];
        lineas.push(`${p.numero_original}. ${p.enunciado}`);
        lineas.push('');

        ['A', 'B', 'C', 'D'].forEach(letra => {
            if (p.opciones[letra as keyof typeof p.opciones]) {
                lineas.push(`${letra}) ${p.opciones[letra as keyof typeof p.opciones]}`);
            }
        });

        lineas.push('');
        lineas.push(`Respuesta correcta: ${p.anulada ? 'ANULADA' : (p.correcta || 'No especificada')}`);

        const textoCopiado = lineas.join('\n');

        navigator.clipboard.writeText(textoCopiado).then(() => {
            setCopiadoId(p.id);
            setTimeout(() => setCopiadoId(null), 2000);
        }).catch(err => {
            console.error('Error al copiar al portapapeles: ', err);
        });
    };

    return (
        <div className="space-y-3">
            {mostrarPaginacion && (
                <PaginationControls
                    totalItems={pagination.totalItems}
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    pageSize={pagination.pageSize}
                    pageSizeOptions={pagination.pageSizeOptions}
                    startIndex={pagination.startIndex}
                    endIndex={pagination.endIndex}
                    itemLabel="preguntas"
                    onPageChange={pagination.setPage}
                    onPageSizeChange={pagination.setPageSize}
                />
            )}

            <div className="bg-card rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
                    {!soloDetalle && (
                        <thead className="bg-muted">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-10"></th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">ID / Metadatos</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider text-center">Clasificación</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Enunciado</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider w-24">Estado</th>
                            </tr>
                        </thead>
                    )}
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
                        {preguntas.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted">
                                    No se encontraron preguntas que coincidan con los filtros.
                                </td>
                            </tr>
                        ) : (
                            preguntasVisibles.map((pregunta) => (
                                <React.Fragment key={`${pregunta.id_cuestionario}::${pregunta.id}`}>
                                    {!soloDetalle && (
                                        <tr
                                            id={`tarjeta-${pregunta.id}`}
                                            className="hover:bg-muted cursor-pointer transition-colors"
                                            onClick={() => {
                                                if (onVerPregunta) {
                                                    onVerPregunta(pregunta.id);
                                                } else {
                                                    toggleExpand(pregunta.id);
                                                }
                                            }}
                                            tabIndex={0}
                                            role="button"
                                            aria-expanded={estaExpandida(pregunta.id)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    if (onVerPregunta) {
                                                        onVerPregunta(pregunta.id);
                                                    } else {
                                                        toggleExpand(pregunta.id);
                                                    }
                                                }
                                            }}
                                        >
                                            <td className="px-4 py-4 whitespace-nowrap text-muted">
                                                {estaExpandida(pregunta.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-heading">{pregunta.id}</div>
                                                <div className="text-xs text-muted">
                                                    {pregunta.metadatos.año} • {formatScaleLabel(pregunta.metadatos.escala)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                    <span
                                                        className="category-chip cursor-pointer hover:opacity-80 transition-opacity"
                                                        style={{ backgroundColor: getMateriaColor(pregunta.materia.toString()), fontSize: '10px', padding: '2px 8px', width: '130px', display: 'inline-block', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                        title={`Filtrar por materia: ${pregunta.materia}`}
                                                        onClick={(e) => { e.stopPropagation(); onFiltrarMateria?.(pregunta.materia.toString().toLowerCase().trim()); }}
                                                    >
                                                        {pregunta.materia.toString().charAt(0).toUpperCase() + pregunta.materia.toString().slice(1)}
                                                    </span>
                                                    {pregunta.bloque && (
                                                        <span
                                                            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white bg-slate-600 cursor-pointer hover:opacity-80 transition-opacity"
                                                            style={{ width: '130px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                            title={`Filtrar por bloque: ${pregunta.bloque}`}
                                                            onClick={(e) => { e.stopPropagation(); onFiltrarBloque?.(pregunta.bloque); }}
                                                        >
                                                            {pregunta.bloque}
                                                        </span>
                                                    )}
                                                    {pregunta.tema && (
                                                        <span
                                                            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 bg-slate-200 border border-slate-300 cursor-pointer hover:opacity-80 transition-opacity"
                                                            style={{ width: '130px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                            title={`Filtrar por tema: ${pregunta.tema}`}
                                                            onClick={(e) => { e.stopPropagation(); onFiltrarTema?.(pregunta.tema); }}
                                                        >
                                                            {pregunta.tema}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm font-semibold text-heading line-clamp-2" title={pregunta.enunciado}>
                                                    <span className="font-bold text-heading mr-1">{pregunta.numero_original}.</span> {pregunta.enunciado}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {pregunta.anulada ? (
                                                    <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--accent-warning)' }}>
                                                        <AlertCircle className="w-4 h-4" />
                                                        Anulada
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--accent-success)' }}>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Válida
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                    {
                                        (estaExpandida(pregunta.id) || soloDetalle) && (
                                            <tr className="bg-muted">
                                                <td colSpan={5} className={soloDetalle ? "px-4 py-3" : "px-4 py-6"} style={{ borderBottom: '2px solid var(--accent-primary)' }}>
                                                    <div className={soloDetalle ? "max-w-5xl" : "pl-10 pr-6 max-w-5xl"}>
                                                        <QuestionDetail
                                                            pregunta={pregunta}
                                                            editing={editandoId === pregunta.id}
                                                            anyEditing={editandoId !== null}
                                                            copied={copiadoId === pregunta.id}
                                                            soloDetalle={soloDetalle}
                                                            canEdit={Boolean(onGuardarEdicion)}
                                                            editMateria={editMateria}
                                                            editBloque={editBloque}
                                                            editTema={editTema}
                                                            editApp={editApp}
                                                            editCorrecta={editCorrecta}
                                                            editEnunciado={editEnunciado}
                                                            editObservaciones={editObservaciones}
                                                            setEditMateria={setEditMateria}
                                                            setEditBloque={setEditBloque}
                                                            setEditTema={setEditTema}
                                                            setEditApp={setEditApp}
                                                            setEditCorrecta={setEditCorrecta}
                                                            setEditEnunciado={setEditEnunciado}
                                                            setEditObservaciones={setEditObservaciones}
                                                            onCopy={(event) => handleCopiar(event, pregunta)}
                                                            onStartEdit={(event) => { event.stopPropagation(); iniciarEdicion(pregunta); }}
                                                            onSave={(event) => { event.stopPropagation(); guardar(pregunta.id); }}
                                                            onCancelEdit={(event) => { event.stopPropagation(); setEditandoId(null); }}
                                                            onFiltrarMateria={onFiltrarMateria}
                                                            onFiltrarBloque={onFiltrarBloque}
                                                            onFiltrarTema={onFiltrarTema}
                                                            onFiltrarAplicacion={onFiltrarAplicacion}
                                                            onFiltrarAño={onFiltrarAño}
                                                            onFiltrarEscala={onFiltrarEscala}
                                                            onFiltrarAcceso={onFiltrarAcceso}
                                                            onFiltrarEjercicio={onFiltrarEjercicio}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    }
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            </div>

            {mostrarPaginacion && (
                <PaginationControls
                    totalItems={pagination.totalItems}
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    pageSize={pagination.pageSize}
                    pageSizeOptions={pagination.pageSizeOptions}
                    startIndex={pagination.startIndex}
                    endIndex={pagination.endIndex}
                    itemLabel="preguntas"
                    onPageChange={pagination.setPage}
                    onPageSizeChange={pagination.setPageSize}
                />
            )}
        </div>
    );
};

// getMateriaColor importada desde utils/colores.ts
