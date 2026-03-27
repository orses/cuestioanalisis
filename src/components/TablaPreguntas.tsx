import React, { useState, useEffect } from 'react';
import type { Pregunta } from '../types';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, XCircle, Save, Pencil, Copy, Check } from 'lucide-react';
import { getMateriaColor } from '../utils/colores';

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

    useEffect(() => {
        if (preguntaExpandida) {
            setExpandidas(prev => new Set(prev).add(preguntaExpandida));
            // Hacer scroll a la tarjeta después de un breve delay para que se renderice
            setTimeout(() => {
                const el = document.getElementById(`tarjeta-${preguntaExpandida}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [preguntaExpandida]);

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

    const opcionesLetras = ['A', 'B', 'C', 'D'] as const;

    return (
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
                            preguntas.map((pregunta) => (
                                <React.Fragment key={`${pregunta.id_cuestionario}::${pregunta.id}`}>
                                    {!soloDetalle && (
                                        <tr
                                            id={`tarjeta-${pregunta.id}`}
                                            className="hover:bg-muted cursor-pointer transition-colors"
                                            onClick={() => onVerPregunta ? onVerPregunta(pregunta.id) : toggleExpand(pregunta.id)}
                                            tabIndex={0}
                                            role="button"
                                            aria-expanded={expandidas.has(pregunta.id)}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onVerPregunta ? onVerPregunta(pregunta.id) : toggleExpand(pregunta.id); } }}
                                        >
                                            <td className="px-4 py-4 whitespace-nowrap text-muted">
                                                {expandidas.has(pregunta.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-heading">{pregunta.id}</div>
                                                <div className="text-xs text-muted">
                                                    {pregunta.metadatos.año} • {pregunta.metadatos.escala === 'AUX' ? 'Auxiliar administrativo' : pregunta.metadatos.escala === 'ADV' ? 'Administrativo' : pregunta.metadatos.escala === 'PSX' ? 'Personal de Servicios Generales' : pregunta.metadatos.escala}
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
                                        (expandidas.has(pregunta.id) || soloDetalle) && (
                                            <tr className="bg-muted">
                                                <td colSpan={5} className={soloDetalle ? "px-4 py-3" : "px-4 py-6"} style={{ borderBottom: '2px solid var(--accent-primary)' }}>
                                                    <div className={soloDetalle ? "max-w-5xl" : "pl-10 pr-6 max-w-5xl"}>

                                                        {/* Botón editar / guardar / copiar */}
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                {!soloDetalle && <h4 className="text-base font-semibold text-heading">
                                                                    {editandoId === pregunta.id ? 'Editando la pregunta' : 'Detalle de la pregunta'}
                                                                </h4>}
                                                                {!editandoId && (
                                                                    <button
                                                                        onClick={(e) => handleCopiar(e, pregunta)}
                                                                        className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded transition-colors"
                                                                        style={{
                                                                            color: copiadoId === pregunta.id ? 'var(--accent-success)' : 'var(--text-tertiary)',
                                                                            backgroundColor: copiadoId === pregunta.id ? 'rgba(22, 163, 74, 0.1)' : 'var(--bg-tertiary)',
                                                                            border: `1px solid ${copiadoId === pregunta.id ? 'var(--accent-success)' : 'transparent'}`
                                                                        }}
                                                                        title="Copiar contenido de la pregunta al portapapeles"
                                                                    >
                                                                        {copiadoId === pregunta.id ? (
                                                                            <><Check className="w-3.5 h-3.5" /> Copiado</>
                                                                        ) : (
                                                                            <><Copy className="w-3.5 h-3.5" /> Copiar</>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {onGuardarEdicion && editandoId !== pregunta.id && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); iniciarEdicion(pregunta); }}
                                                                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                                                                    style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--bg-active)' }}
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" /> Editar
                                                                </button>
                                                            )}
                                                            {editandoId === pregunta.id && (
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); guardar(pregunta.id); }}
                                                                        className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-white transition-colors"
                                                                        style={{ backgroundColor: 'var(--accent-success)' }}
                                                                    >
                                                                        <Save className="w-3.5 h-3.5" /> Guardar
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setEditandoId(null); }}
                                                                        className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-muted text-body"
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Enunciado */}
                                                        {editandoId === pregunta.id ? (
                                                            <textarea
                                                                value={editEnunciado}
                                                                onChange={e => setEditEnunciado(e.target.value)}
                                                                onClick={e => e.stopPropagation()}
                                                                className="w-full p-3 rounded-lg border text-sm text-body bg-card mb-4 resize-y min-h-[80px]"
                                                                style={{ borderColor: 'var(--border-primary)' }}
                                                                aria-label="Enunciado de la pregunta"
                                                            />
                                                        ) : (
                                                            <p className="text-[15px] text-heading font-semibold mb-4 p-4 rounded-lg leading-relaxed" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                                                                <span className="font-bold text-heading mr-1.5">{pregunta.numero_original}.</span>{pregunta.enunciado}
                                                            </p>
                                                        )}

                                                        {/* Opciones A-D */}
                                                        <div className="space-y-2 mb-5">
                                                            {opcionesLetras.map(letra => {
                                                                const textoOpcion = pregunta.opciones[letra];
                                                                if (!textoOpcion) return null;
                                                                const esCorrecta = letra === pregunta.correcta;
                                                                const coloresLetra: Record<string, string> = { A: '#3b82f6', B: '#10b981', C: '#f59e0b', D: '#8b5cf6' };

                                                                return (
                                                                    <div
                                                                        key={letra}
                                                                        className="p-3 rounded-lg border flex items-start gap-3"
                                                                        style={{
                                                                            backgroundColor: esCorrecta ? 'rgba(22, 163, 74, 0.12)' : 'var(--bg-secondary)',
                                                                            borderColor: esCorrecta ? 'var(--accent-success)' : 'var(--border-secondary)',
                                                                            borderWidth: esCorrecta ? '2px' : '1px',
                                                                        }}
                                                                    >
                                                                        <div
                                                                            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                                            style={{ backgroundColor: coloresLetra[letra] }}
                                                                        >
                                                                            {letra}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className={`text-sm ${esCorrecta ? 'font-semibold' : ''}`} style={{ color: 'var(--text-primary)' }}>
                                                                                {textoOpcion}
                                                                            </p>
                                                                        </div>
                                                                        {!esCorrecta && textoOpcion && <XCircle className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: 'var(--text-tertiary)', opacity: 0.3 }} />}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Observaciones */}
                                                        {editandoId === pregunta.id ? (
                                                            <div className="mb-5">
                                                                <h5 className="text-sm font-semibold text-heading mb-2">Observaciones</h5>
                                                                <textarea
                                                                    value={editObservaciones}
                                                                    onChange={e => setEditObservaciones(e.target.value)}
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="w-full p-3 rounded-lg border text-sm text-body bg-card resize-y min-h-[60px]"
                                                                    style={{ borderColor: 'var(--border-primary)' }}
                                                                    placeholder="Añadir observaciones..."
                                                                    aria-label="Observaciones de la pregunta"
                                                                />
                                                            </div>
                                                        ) : pregunta.observaciones && pregunta.observaciones.trim() !== '' ? (
                                                            <div className="mb-5">
                                                                <h5 className="text-sm font-semibold text-heading mb-2">Observaciones</h5>
                                                                <p className="text-sm text-body p-3 rounded-lg bg-card border" style={{ borderColor: 'var(--border-secondary)' }}>
                                                                    {pregunta.observaciones}
                                                                </p>
                                                            </div>
                                                        ) : null}

                                                        {/* Metadatos y Clasificación */}
                                                        <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--border-secondary)' }}>
                                                            {/* Convocatoria (siempre solo lectura) */}
                                                            <div>
                                                                <h5 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Convocatoria</h5>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                                                                    <div>
                                                                        <span className="block text-[10px] text-muted uppercase mb-0.5">Organismo</span>
                                                                        <span className="font-medium text-heading">{pregunta.metadatos.organismo}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-[10px] text-muted uppercase mb-0.5">Escala</span>
                                                                        <span className="font-medium text-heading cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onFiltrarEscala?.(pregunta.metadatos.escala); }} title={`Filtrar por escala: ${pregunta.metadatos.escala === 'AUX' ? 'Auxiliar administrativo' : pregunta.metadatos.escala === 'ADV' ? 'Administrativo' : pregunta.metadatos.escala === 'PSX' ? 'Personal de Servicios Generales' : pregunta.metadatos.escala}`}>{pregunta.metadatos.escala === 'AUX' ? 'Auxiliar administrativo' : pregunta.metadatos.escala === 'ADV' ? 'Administrativo' : pregunta.metadatos.escala === 'PSX' ? 'Personal de Servicios Generales' : pregunta.metadatos.escala}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-[10px] text-muted uppercase mb-0.5">Año</span>
                                                                        <span className="font-medium text-heading cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onFiltrarAño?.(String(pregunta.metadatos.año)); }} title={`Filtrar por año: ${pregunta.metadatos.año}`}>{pregunta.metadatos.año}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-[10px] text-muted uppercase mb-0.5">Acceso</span>
                                                                        <span className="font-medium text-heading cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onFiltrarAcceso?.(pregunta.metadatos.acceso); }} title={`Filtrar por acceso: ${({ LI: 'Libre', PI: 'Prom. interna', PC: 'Prom. cruzada' } as Record<string, string>)[pregunta.metadatos.acceso] || pregunta.metadatos.acceso}`}>{({ LI: 'Libre', PI: 'Prom. interna', PC: 'Prom. cruzada' } as Record<string, string>)[pregunta.metadatos.acceso] || pregunta.metadatos.acceso}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-[10px] text-muted uppercase mb-0.5">Ejercicio</span>
                                                                        <span className="font-medium text-heading cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onFiltrarEjercicio?.(pregunta.metadatos.tipo); }} title={`Filtrar por ejercicio: ${({ PRI: 'Primero', SEG: 'Segundo', UNI: 'Único' } as Record<string, string>)[pregunta.metadatos.tipo] || pregunta.metadatos.tipo}`}>{({ PRI: 'Primero', SEG: 'Segundo', UNI: 'Único' } as Record<string, string>)[pregunta.metadatos.tipo] || pregunta.metadatos.tipo}</span>
                                                                    </div>
                                                                    {pregunta.metadatos.variante && (
                                                                        <div>
                                                                            <span className="block text-[10px] text-muted uppercase mb-0.5">Variante</span>
                                                                            <span className="font-medium text-heading">{pregunta.metadatos.variante.replace(/\bEXT\b/g, 'Extraordinario').replace(/_/g, ' ')}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Clasificación */}
                                                            <div>
                                                                <h5 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Clasificación temática</h5>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                                                                    {editandoId === pregunta.id ? (
                                                                        <>
                                                                            <div>
                                                                                <span className="block text-[10px] text-muted uppercase mb-0.5">N.º Pregunta</span>
                                                                                <span className="font-medium text-heading inline-block py-1.5">{pregunta.numero_original}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="block text-[10px] text-muted uppercase mb-0.5">Materia</span>
                                                                                <input value={editMateria} onChange={e => setEditMateria(e.target.value)} onClick={e => e.stopPropagation()}
                                                                                    className="w-full px-2 py-1.5 border rounded text-sm bg-card text-body" style={{ borderColor: 'var(--border-primary)' }} />
                                                                            </div>
                                                                            <div>
                                                                                <span className="block text-[10px] text-muted uppercase mb-0.5">Bloque</span>
                                                                                <input value={editBloque} onChange={e => setEditBloque(e.target.value)} onClick={e => e.stopPropagation()}
                                                                                    className="w-full px-2 py-1.5 border rounded text-sm bg-card text-body" style={{ borderColor: 'var(--border-primary)' }} />
                                                                            </div>
                                                                            <div>
                                                                                <span className="block text-[10px] text-muted uppercase mb-0.5">Tema</span>
                                                                                <input value={editTema} onChange={e => setEditTema(e.target.value)} onClick={e => e.stopPropagation()}
                                                                                    className="w-full px-2 py-1.5 border rounded text-sm bg-card text-body" style={{ borderColor: 'var(--border-primary)' }} />
                                                                            </div>
                                                                            <div>
                                                                                <span className="block text-[10px] text-muted uppercase mb-0.5">Aplicación</span>
                                                                                <input value={editApp} onChange={e => setEditApp(e.target.value)} onClick={e => e.stopPropagation()}
                                                                                    className="w-full px-2 py-1.5 border rounded text-sm bg-card text-body" style={{ borderColor: 'var(--border-primary)' }} />
                                                                            </div>
                                                                            <div>
                                                                                <span className="block text-[10px] text-muted uppercase mb-0.5">Correcta</span>
                                                                                <select value={editCorrecta} onChange={e => setEditCorrecta(e.target.value)} onClick={e => e.stopPropagation()}
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
                                                                                <span className="font-medium text-heading cursor-pointer hover:underline" style={{ textTransform: 'capitalize' }} onClick={(e) => { e.stopPropagation(); onFiltrarMateria?.(pregunta.materia.toString().toLowerCase().trim()); }} title={`Filtrar por materia: ${pregunta.materia}`}>{pregunta.materia.toString()}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="block text-[10px] text-muted uppercase mb-0.5">Bloque</span>
                                                                                <span className="font-medium text-heading cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); if (pregunta.bloque) onFiltrarBloque?.(pregunta.bloque); }} title={pregunta.bloque ? `Filtrar por bloque: ${pregunta.bloque}` : undefined}>{pregunta.bloque || '-'}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="block text-[10px] text-muted uppercase mb-0.5">Tema</span>
                                                                                <span className="font-medium text-heading cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); if (pregunta.tema) onFiltrarTema?.(pregunta.tema); }} title={pregunta.tema ? `Filtrar por tema: ${pregunta.tema}` : undefined}>{pregunta.tema || '-'}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="block text-[10px] text-muted uppercase mb-0.5">Aplicación</span>
                                                                                <span className="font-medium text-heading cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); if (pregunta.aplicacion) onFiltrarAplicacion?.(pregunta.aplicacion); }} title={pregunta.aplicacion ? `Filtrar por aplicación: ${pregunta.aplicacion}` : undefined}>{pregunta.aplicacion || '-'}</span>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
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
        </div >
    );
};

// getMateriaColor importada desde utils/colores.ts
