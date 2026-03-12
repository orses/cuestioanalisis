import React, { useState, useMemo, useRef, useCallback } from 'react';
import type { Pregunta } from '../types';
import { ChevronRight, ChevronLeft, Database, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface VisorDatasetProps {
    preguntas: Pregunta[];
    onVerPregunta?: (id: string) => void;
}

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

const INITIAL_WIDTHS: Record<string, number> = {
    // Reducida
    id: 180, num: 50, materia: 110, bloque: 140, tema: 140, aplicacion: 130,
    enunciado: 320, A: 200, B: 200, C: 200, D: 200, correcta: 55, anulada: 55,
    // Cruda
    id_crudo: 220, num_crudo: 60, org: 100, escala: 140, año: 60, acceso: 80, tipo: 80, variante: 80, extra: 90,
    materia_cruda: 110, bloque_crudo: 140, tema_crudo: 140, aplicacion_cruda: 130,
    enunciado_crudo: 320, A_cruda: 200, B_cruda: 200, C_cruda: 200, D_cruda: 200,
    correcta_cruda: 70, anulada_cruda: 70, observaciones: 200, conceptos: 200, distractores: 200
};

const COLUMNS_REDUCIDA = [
    { key: 'id', label: 'Ejercicio' },
    { key: 'num', label: 'N.º' },
    { key: 'materia', label: 'Materia' },
    { key: 'bloque', label: 'Bloque' },
    { key: 'tema', label: 'Tema' },
    { key: 'aplicacion', label: 'Aplicación' },
    { key: 'enunciado', label: 'Enunciado' },
    { key: 'A', label: 'Opción A' },
    { key: 'B', label: 'Opción B' },
    { key: 'C', label: 'Opción C' },
    { key: 'D', label: 'Opción D' },
    { key: 'correcta', label: 'Cor.' },
    { key: 'anulada', label: 'Anul.' },
];

const COLUMNS_CRUDA = [
    { key: 'id_crudo', label: 'ID' },
    { key: 'num_crudo', label: 'Nº Orig.' },
    { key: 'org', label: 'Organismo' },
    { key: 'escala', label: 'Escala' },
    { key: 'año', label: 'Año' },
    { key: 'acceso', label: 'Acceso' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'variante', label: 'Variante' },
    { key: 'extra', label: 'Extraordinaria' },
    { key: 'materia_cruda', label: 'Materia' },
    { key: 'bloque_crudo', label: 'Bloque' },
    { key: 'tema_crudo', label: 'Tema' },
    { key: 'aplicacion_cruda', label: 'Aplicación' },
    { key: 'enunciado_crudo', label: 'Enunciado' },
    { key: 'A_cruda', label: 'Opción A' },
    { key: 'B_cruda', label: 'Opción B' },
    { key: 'C_cruda', label: 'Opción C' },
    { key: 'D_cruda', label: 'Opción D' },
    { key: 'correcta_cruda', label: 'Correcta' },
    { key: 'anulada_cruda', label: 'Anulada' },
    { key: 'observaciones', label: 'Observaciones' },
    { key: 'conceptos', label: 'Conceptos clave' },
    { key: 'distractores', label: 'Distractores' },
];

export const VisorDataset: React.FC<VisorDatasetProps> = ({ preguntas, onVerPregunta }) => {
    const [vistaModo, setVistaModo] = useState<'reducida' | 'cruda'>('reducida');
    const [pagina, setPagina] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [colWidths, setColWidths] = useState<Record<string, number>>({ ...INITIAL_WIDTHS });
    const preguntasPorPagina = 50;

    const COLUMNS = vistaModo === 'reducida' ? COLUMNS_REDUCIDA : COLUMNS_CRUDA;

    const topScrollRef = useRef<HTMLDivElement>(null);
    const tableScrollRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);

    // Resize state
    const resizingCol = useRef<string | null>(null);
    const startX = useRef(0);
    const startWidth = useRef(0);

    const tableWidth = useMemo(() =>
        Object.values(colWidths).reduce((s, w) => s + w, 0),
        [colWidths]
    );

    // Sincronizar scrollbars
    const handleTopScroll = useCallback(() => {
        if (topScrollRef.current && tableScrollRef.current)
            tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }, []);
    const handleTableScroll = useCallback(() => {
        if (topScrollRef.current && tableScrollRef.current)
            topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }, []);

    // Drag para redimensionar columnas
    const handleMouseDown = useCallback((e: React.MouseEvent, colKey: string) => {
        e.preventDefault();
        e.stopPropagation();
        resizingCol.current = colKey;
        startX.current = e.clientX;
        startWidth.current = colWidths[colKey];

        const onMove = (ev: MouseEvent) => {
            if (!resizingCol.current) return;
            const diff = ev.clientX - startX.current;
            setColWidths(prev => ({ ...prev, [resizingCol.current!]: Math.max(40, startWidth.current + diff) }));
        };
        const onUp = () => {
            resizingCol.current = null;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [colWidths]);

    // Doble clic para autoajustar columna
    const handleDoubleClick = useCallback((e: React.MouseEvent, colKey: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!tableRef.current) return;

        // Medir contenido real de la columna
        const colIdx = COLUMNS.findIndex(c => c.key === colKey);
        if (colIdx === -1) return;

        const cells = tableRef.current.querySelectorAll(`td:nth-child(${colIdx + 1}), th:nth-child(${colIdx + 1})`);
        let maxW = 60; // mínimo

        cells.forEach(cell => {
            const el = cell as HTMLElement;
            // Temporalmente quitar restricción de ancho
            const originalW = el.style.width;
            const originalOF = el.style.overflow;
            el.style.width = 'auto';
            el.style.overflow = 'visible';
            el.style.whiteSpace = 'nowrap';
            const w = el.scrollWidth + 16; // padding extra
            el.style.width = originalW;
            el.style.overflow = originalOF;
            el.style.whiteSpace = '';
            if (w > maxW) maxW = w;
        });

        // Limitar a un máximo razonable
        maxW = Math.min(maxW, 600);
        setColWidths(prev => ({ ...prev, [colKey]: maxW }));
    }, []);

    // Ordenación
    const sortedPreguntas = useMemo(() => {
        const items = [...preguntas];
        if (!sortConfig) return items;
        items.sort((a, b) => {
            let aV: any, bV: any;
            switch (sortConfig.key) {
                case 'id': aV = a.id; bV = b.id; break;
                case 'num': aV = a.numero_original; bV = b.numero_original; break;
                case 'materia': aV = a.materia?.toString() ?? ''; bV = b.materia?.toString() ?? ''; break;
                case 'bloque': aV = a.bloque ?? ''; bV = b.bloque ?? ''; break;
                case 'tema': aV = a.tema ?? ''; bV = b.tema ?? ''; break;
                case 'aplicacion': aV = a.aplicacion ?? ''; bV = b.aplicacion ?? ''; break;
                case 'enunciado': aV = a.enunciado ?? ''; bV = b.enunciado ?? ''; break;
                case 'A': aV = a.opciones.A ?? ''; bV = b.opciones.A ?? ''; break;
                case 'B': aV = a.opciones.B ?? ''; bV = b.opciones.B ?? ''; break;
                case 'C': aV = a.opciones.C ?? ''; bV = b.opciones.C ?? ''; break;
                case 'D': aV = a.opciones.D ?? ''; bV = b.opciones.D ?? ''; break;
                case 'correcta': aV = a.correcta ?? ''; bV = b.correcta ?? ''; break;
                case 'anulada': aV = a.anulada ? 1 : 0; bV = b.anulada ? 1 : 0; break;
                // Cruda
                case 'id_crudo': aV = a.id; bV = b.id; break;
                case 'num_crudo': aV = a.numero_original; bV = b.numero_original; break;
                case 'org': aV = a.metadatos.organismo ?? ''; bV = b.metadatos.organismo ?? ''; break;
                case 'escala': aV = a.metadatos.escala ?? ''; bV = b.metadatos.escala ?? ''; break;
                case 'año': aV = a.metadatos.año ?? 0; bV = b.metadatos.año ?? 0; break;
                case 'acceso': aV = a.metadatos.acceso ?? ''; bV = b.metadatos.acceso ?? ''; break;
                case 'tipo': aV = a.metadatos.tipo ?? ''; bV = b.metadatos.tipo ?? ''; break;
                case 'variante': aV = a.metadatos.variante ?? ''; bV = b.metadatos.variante ?? ''; break;
                case 'extra': aV = a.metadatos.extraordinaria ? 1 : 0; bV = b.metadatos.extraordinaria ? 1 : 0; break;
                case 'materia_cruda': aV = a.materia?.toString() ?? ''; bV = b.materia?.toString() ?? ''; break;
                case 'bloque_crudo': aV = a.bloque ?? ''; bV = b.bloque ?? ''; break;
                case 'tema_crudo': aV = a.tema ?? ''; bV = b.tema ?? ''; break;
                case 'aplicacion_cruda': aV = a.aplicacion ?? ''; bV = b.aplicacion ?? ''; break;
                case 'enunciado_crudo': aV = a.enunciado ?? ''; bV = b.enunciado ?? ''; break;
                case 'A_cruda': aV = a.opciones.A ?? ''; bV = b.opciones.A ?? ''; break;
                case 'B_cruda': aV = a.opciones.B ?? ''; bV = b.opciones.B ?? ''; break;
                case 'C_cruda': aV = a.opciones.C ?? ''; bV = b.opciones.C ?? ''; break;
                case 'D_cruda': aV = a.opciones.D ?? ''; bV = b.opciones.D ?? ''; break;
                case 'correcta_cruda': aV = a.correcta ?? ''; bV = b.correcta ?? ''; break;
                case 'anulada_cruda': aV = a.anulada ? 1 : 0; bV = b.anulada ? 1 : 0; break;
                case 'observaciones': aV = a.observaciones ?? ''; bV = b.observaciones ?? ''; break;
                case 'conceptos': aV = a.conceptos_clave?.join(', ') ?? ''; bV = b.conceptos_clave?.join(', ') ?? ''; break;
                case 'distractores': aV = a.distractores?.map(d => d.texto_opcion).join(', ') ?? ''; bV = b.distractores?.map(d => d.texto_opcion).join(', ') ?? ''; break;
                default: return 0;
            }
            // Vacíos siempre al final
            const aEmpty = aV === '' || aV == null;
            const bEmpty = bV === '' || bV == null;
            if (aEmpty && bEmpty) return 0;
            if (aEmpty) return 1;
            if (bEmpty) return -1;
            // Comparación numérica o textual
            let cmp: number;
            if (typeof aV === 'number' && typeof bV === 'number') {
                cmp = aV - bV;
            } else {
                cmp = String(aV).localeCompare(String(bV), 'es', { sensitivity: 'base' });
            }
            return sortConfig.direction === 'asc' ? cmp : -cmp;
        });
        return items;
    }, [preguntas, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
        setPagina(1);
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key)
            return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30 group-hover:opacity-100" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1" style={{ color: 'var(--accent-primary)' }} />
            : <ArrowDown className="w-3 h-3 ml-1" style={{ color: 'var(--accent-primary)' }} />;
    };

    const totalPaginas = Math.ceil(sortedPreguntas.length / preguntasPorPagina);
    const inicio = (pagina - 1) * preguntasPorPagina;
    const preguntasActuales = sortedPreguntas.slice(inicio, inicio + preguntasPorPagina);

    const getCellValue = (p: Pregunta, key: string): React.ReactNode => {
        switch (key) {
            case 'id': {
                const accesoMap: Record<string, string> = { LI: 'libre', PI: 'prom. interna', PC: 'prom. cruzada' };
                const tipoMap: Record<string, string> = { PRI: 'primero', SEG: 'segundo', UNI: 'único' };
                const accTxt = accesoMap[p.metadatos.acceso] || p.metadatos.acceso;
                const tipoTxt = tipoMap[p.metadatos.tipo] || p.metadatos.tipo;
                const partes = [`Año: ${p.metadatos.año}`, `Acceso: ${accTxt}`, `Ejercicio: ${tipoTxt}`];
                if (p.metadatos.extraordinaria) partes.push('Incidencias: extraordinario');
                // Mostrar solo el código de ejercicio (sin el número)
                const ejercicio = p.id.replace(/_\d+$/, '');
                return (
                    <div>
                        <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 700 }}>{ejercicio}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                            {partes.join(' · ')}
                        </div>
                    </div>
                );
            }
            case 'num':
                return (
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {p.numero_original}
                    </span>
                );
            case 'materia':
                return (
                    <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                        backgroundColor: 'var(--bg-active)', color: 'var(--text-primary)', fontWeight: 700, textTransform: 'uppercase'
                    }}>
                        {p.materia}
                    </span>
                );
            case 'bloque': return <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{p.bloque || '—'}</span>;
            case 'tema': return <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{p.tema || '—'}</span>;
            case 'aplicacion': return <span style={{ color: 'var(--accent-warning)', fontSize: '12px', fontWeight: 500 }}>{p.aplicacion || '—'}</span>;
            case 'enunciado': return <span style={{ color: 'var(--text-primary)', fontSize: '12px', lineHeight: 1.5 }}>{p.enunciado}</span>;
            case 'A': case 'B': case 'C': case 'D': {
                const esCorrecta = p.correcta === key;
                return (
                    <span style={{
                        fontSize: '11px', lineHeight: '1.5',
                        color: esCorrecta ? 'var(--accent-success)' : 'var(--text-primary)',
                        fontWeight: esCorrecta ? 700 : 400,
                    }}>
                        {p.opciones[key]}
                    </span>
                );
            }
            case 'correcta':
                return p.correcta ? (
                    <span style={{
                        display: 'inline-flex', width: '24px', height: '24px', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'var(--text-primary)', color: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '12px', fontWeight: 700
                    }}>{p.correcta}</span>
                ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
            case 'anulada':
                return p.anulada
                    ? <span style={{ color: 'var(--accent-danger)', fontWeight: 700, fontSize: '16px' }} title="Anulada">✗</span>
                    : <span style={{ color: 'var(--text-tertiary)', opacity: 0.4 }}>—</span>;
            // Casos crudos
            case 'id_crudo': return <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{p.id}</span>;
            case 'num_crudo': return <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{p.numero_original}</span>;
            case 'org': return <span style={{ fontSize: '11px' }}>{p.metadatos.organismo}</span>;
            case 'escala': return <span style={{ fontSize: '11px' }}>{p.metadatos.escala}</span>;
            case 'año': return <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{p.metadatos.año}</span>;
            case 'acceso': return <span style={{ fontSize: '11px' }}>{p.metadatos.acceso}</span>;
            case 'tipo': return <span style={{ fontSize: '11px' }}>{p.metadatos.tipo}</span>;
            case 'variante': return <span style={{ fontSize: '11px' }}>{p.metadatos.variante}</span>;
            case 'extra': return <span style={{ fontSize: '11px', fontWeight: 600, color: p.metadatos.extraordinaria ? 'var(--accent-danger)' : 'inherit' }}>{p.metadatos.extraordinaria ? 'true' : 'false'}</span>;
            case 'materia_cruda': return <span style={{ fontSize: '11px' }}>{p.materia}</span>;
            case 'bloque_crudo': return <span style={{ fontSize: '11px' }}>{p.bloque}</span>;
            case 'tema_crudo': return <span style={{ fontSize: '11px' }}>{p.tema}</span>;
            case 'aplicacion_cruda': return <span style={{ fontSize: '11px' }}>{p.aplicacion}</span>;
            case 'enunciado_crudo': return <span style={{ fontSize: '11px' }}>{p.enunciado}</span>;
            case 'A_cruda': return <span style={{ fontSize: '11px' }}>{p.opciones.A}</span>;
            case 'B_cruda': return <span style={{ fontSize: '11px' }}>{p.opciones.B}</span>;
            case 'C_cruda': return <span style={{ fontSize: '11px' }}>{p.opciones.C}</span>;
            case 'D_cruda': return <span style={{ fontSize: '11px' }}>{p.opciones.D}</span>;
            case 'correcta_cruda': return <span style={{ fontSize: '11px', fontWeight: 700 }}>{p.correcta}</span>;
            case 'anulada_cruda': return <span style={{ fontSize: '11px', fontWeight: 600, color: p.anulada ? 'var(--accent-danger)' : 'inherit' }}>{p.anulada ? 'true' : 'false'}</span>;
            case 'observaciones': return <span style={{ fontSize: '11px' }}>{p.observaciones}</span>;
            case 'conceptos': return <span style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>{p.conceptos_clave.join(', ')}</span>;
            case 'distractores': return <span style={{ fontSize: '11px', color: 'var(--accent-warning)' }}>{p.distractores.map(d => d.texto_opcion).join(', ')}</span>;
            default: return null;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Cabecera */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Base de datos</h2>
                    <div style={{ display: 'flex', marginLeft: '16px', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                        <button
                            onClick={() => { setVistaModo('reducida'); setColWidths(INITIAL_WIDTHS); }}
                            style={{
                                padding: '4px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '6px',
                                backgroundColor: vistaModo === 'reducida' ? 'var(--bg-card)' : 'transparent',
                                color: vistaModo === 'reducida' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                boxShadow: vistaModo === 'reducida' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            Vista Resumida
                        </button>
                        <button
                            onClick={() => { setVistaModo('cruda'); setColWidths(INITIAL_WIDTHS); }}
                            style={{
                                padding: '4px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '6px',
                                backgroundColor: vistaModo === 'cruda' ? 'var(--bg-card)' : 'transparent',
                                color: vistaModo === 'cruda' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                boxShadow: vistaModo === 'cruda' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            Datos Crudos
                        </button>
                    </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Mostrando {inicio + 1} – {Math.min(inicio + preguntasPorPagina, sortedPreguntas.length)} de {sortedPreguntas.length} registros
                </div>
            </div>

            {/* Scrollbar SUPERIOR */}
            <div
                ref={topScrollRef}
                onScroll={handleTopScroll}
                style={{
                    overflowX: 'auto', overflowY: 'hidden', height: '14px',
                    borderRadius: '8px 8px 0 0',
                    border: '1px solid var(--border-secondary)', borderBottom: 'none',
                    backgroundColor: 'var(--bg-tertiary)',
                }}
            >
                <div style={{ width: `${tableWidth}px`, height: '1px' }} />
            </div>

            {/* Tabla */}
            <div
                ref={tableScrollRef}
                onScroll={handleTableScroll}
                style={{
                    overflowX: 'auto', overflowY: 'visible',
                    border: '1px solid var(--border-secondary)', borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    backgroundColor: 'var(--bg-secondary)',
                    marginTop: '-16px',
                }}
            >
                <table ref={tableRef} style={{ width: `${tableWidth}px`, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            {COLUMNS.map(col => (
                                <th
                                    key={col.key}
                                    style={{
                                        width: `${colWidths[col.key]}px`,
                                        padding: '10px 12px',
                                        textAlign: 'left',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        position: 'relative',
                                        borderBottom: '2px solid var(--border-primary)',
                                        whiteSpace: 'nowrap',
                                    }}
                                    onClick={() => requestSort(col.key)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {col.label}
                                        {getSortIcon(col.key)}
                                    </div>
                                    {/* Resize handle — arrastrar para redimensionar, doble clic para autoajustar */}
                                    <div
                                        onMouseDown={(e) => handleMouseDown(e, col.key)}
                                        onDoubleClick={(e) => handleDoubleClick(e, col.key)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px',
                                            cursor: 'col-resize', backgroundColor: 'transparent',
                                        }}
                                        onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = 'var(--accent-primary)'; }}
                                        onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
                                        title="Arrastrar para redimensionar · Doble clic para autoajustar"
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {preguntasActuales.length === 0 ? (
                            <tr>
                                <td colSpan={COLUMNS.length} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                    No hay datos para mostrar con los filtros activos.
                                </td>
                            </tr>
                        ) : (
                            preguntasActuales.map((p, idx) => (
                                <tr key={idx}
                                    style={{
                                        borderBottom: '1px solid var(--border-secondary)',
                                        cursor: onVerPregunta ? 'pointer' : 'default',
                                        transition: 'background-color 0.15s'
                                    }}
                                    onClick={() => onVerPregunta?.(p.id)}
                                    // Cambiar color de fondo del row en hover si hay interactividad
                                    onMouseEnter={(e) => {
                                        if (onVerPregunta) {
                                            e.currentTarget.style.backgroundColor = 'var(--bg-active)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (onVerPregunta) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    {COLUMNS.map(col => (
                                        <td
                                            key={col.key}
                                            style={{
                                                width: `${colWidths[col.key]}px`,
                                                padding: '10px 12px',
                                                verticalAlign: 'top',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {getCellValue(p, col.key)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
                    <button
                        disabled={pagina === 1}
                        onClick={() => setPagina(p => p - 1)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '8px', borderRadius: '6px',
                            border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                            cursor: pagina === 1 ? 'not-allowed' : 'pointer',
                            opacity: pagina === 1 ? 0.5 : 1,
                        }}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Página {pagina} de {totalPaginas}
                    </span>
                    <button
                        disabled={pagina === totalPaginas}
                        onClick={() => setPagina(p => p + 1)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '8px', borderRadius: '6px',
                            border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                            cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer',
                            opacity: pagina === totalPaginas ? 0.5 : 1,
                        }}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
};
