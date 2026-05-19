import { Check, ChevronDown, ChevronUp, ChevronsUpDown, Filter, RefreshCw, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CuestionarioMeta } from '../types';
import { MultiSelect } from './MultiSelect';

interface Props {
    catalogo: CuestionarioMeta[];
    catalogoFiltradoGlobal: CuestionarioMeta[];
    cuestionariosCargados: string[];
    onCargarCatalogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onVerCuestionario?: (idCuestionario: string) => void;
    catVersionesDisponibles: string[];
    catVersionesActivas: string[];
    setCatVersionesActivas: (v: string[]) => void;
    catTiposDisponibles: string[];
    catTiposActivos: string[];
    setCatTiposActivos: (v: string[]) => void;
    catEstadosDisponibles: string[];
    catEstadosActivos: string[];
    setCatEstadosActivos: (v: string[]) => void;
    catSODisponibles: string[];
    catSOActivos: string[];
    setCatSOActivos: (v: string[]) => void;
    catOfimaticaDisponibles: string[];
    catOfimaticaActiva: string[];
    setCatOfimaticaActiva: (v: string[]) => void;
}

function obtenerVersionSistemaOperativo(cuestionario: CuestionarioMeta): string {
    const legado = (cuestionario as unknown as { sistema_operativo?: unknown }).sistema_operativo;
    return cuestionario.version_sistema_operativo || (typeof legado === 'string' ? legado : '');
}

type ColumnAlign = 'left' | 'right' | 'center';

const CATALOG_COLUMNS: { key: keyof CuestionarioMeta; label: string; align?: ColumnAlign }[] = [
    { key: 'id_cuestionario', label: 'ID' },
    { key: 'familia', label: 'Familia' },
    { key: 'cuestionario', label: 'Cuestionario' },
    { key: 'version', label: 'Versión' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'estado', label: 'Estado' },
    { key: 'recopilacion', label: 'Recopilación.', align: 'center' },
    { key: 'num_preguntas', label: 'N.º preguntas.', align: 'right' },
    { key: 'version_sistema_operativo', label: 'Versión SO' },
    { key: 'paquete_ofimatico', label: 'Paquete ofimático' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'preparacion', label: 'Preparación' },
    { key: 'informatica', label: 'Informática', align: 'center' },
    { key: 'seguridad', label: 'Seguridad', align: 'center' },
    { key: 'sistema_operativo', label: 'Sistema operativo', align: 'center' },
    { key: 'procesador_texto', label: 'Procesador de texto', align: 'center' },
    { key: 'hoja_de_calculo', label: 'Hoja de cálculo', align: 'center' },
    { key: 'sgbd', label: 'SGBD', align: 'center' },
    { key: 'presentaciones', label: 'Presentación', align: 'center' },
    { key: 'redes', label: 'Redes', align: 'center' },
    { key: 'cliente_correo', label: 'Correo', align: 'center' },
];

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
    id_cuestionario: 88,
    familia: 80,
    cuestionario: 230,
    version: 130,
    tipo: 150,
    estado: 120,
    recopilacion: 64,
    num_preguntas: 90,
    version_sistema_operativo: 140,
    paquete_ofimatico: 150,
    descripcion: 190,
    preparacion: 170,
    informatica: 98,
    seguridad: 92,
    sistema_operativo: 130,
    procesador_texto: 70,
    hoja_de_calculo: 78,
    sgbd: 72,
    presentaciones: 86,
    redes: 70,
    cliente_correo: 78,
};

const CATALOG_WIDTHS_KEY = 'catalogoColumnWidths';

export const CatalogoCuestionarios: React.FC<Props> = ({
    catalogo, catalogoFiltradoGlobal, cuestionariosCargados, onCargarCatalogo, onVerCuestionario,
    catVersionesDisponibles, catVersionesActivas, setCatVersionesActivas,
    catTiposDisponibles, catTiposActivos, setCatTiposActivos,
    catEstadosDisponibles, catEstadosActivos, setCatEstadosActivos,
    catSODisponibles, catSOActivos, setCatSOActivos,
    catOfimaticaDisponibles, catOfimaticaActiva, setCatOfimaticaActiva
}) => {
    const [busqueda, setBusqueda] = useState('');
    const [filtrosColapsados, setFiltrosColapsados] = useState(false);
    const [overflowVisible, setOverflowVisible] = useState(true);
    const [sortKey, setSortKey] = useState<keyof CuestionarioMeta | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
        if (typeof window === 'undefined') return DEFAULT_COLUMN_WIDTHS;
        try {
            const saved = localStorage.getItem(CATALOG_WIDTHS_KEY);
            return saved ? { ...DEFAULT_COLUMN_WIDTHS, ...JSON.parse(saved) } : DEFAULT_COLUMN_WIDTHS;
        } catch {
            return DEFAULT_COLUMN_WIDTHS;
        }
    });
    const tableRef = useRef<HTMLTableElement>(null);
    const resizingCol = useRef<string | null>(null);
    const startX = useRef(0);
    const startWidth = useRef(0);

    useEffect(() => {
        localStorage.setItem(CATALOG_WIDTHS_KEY, JSON.stringify(colWidths));
    }, [colWidths]);

    const tableWidth = useMemo(
        () => CATALOG_COLUMNS.reduce((total, col) => total + (colWidths[col.key] ?? DEFAULT_COLUMN_WIDTHS[col.key] ?? 90), 0),
        [colWidths]
    );

    const handleSort = (key: keyof CuestionarioMeta) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const handleToggleFiltros = () => {
        if (!filtrosColapsados) {
            setOverflowVisible(false);
            setFiltrosColapsados(true);
        } else {
            setFiltrosColapsados(false);
        }
    };

    const catalogoAMostrar = useMemo(() => {
        const filtrado = busqueda
            ? catalogoFiltradoGlobal.filter(c =>
                c.id_cuestionario.toLowerCase().includes(busqueda.toLowerCase()) ||
                (c.familia || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                (c.cuestionario || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                (c.version || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                obtenerVersionSistemaOperativo(c).toLowerCase().includes(busqueda.toLowerCase()) ||
                (c.paquete_ofimatico || '').toLowerCase().includes(busqueda.toLowerCase())
            )
            : catalogoFiltradoGlobal;

        if (!sortKey) return filtrado;
        return [...filtrado].sort((a, b) => {
            const va = a[sortKey];
            const vb = b[sortKey];
            let cmp = 0;
            if (typeof va === 'boolean' && typeof vb === 'boolean') {
                cmp = Number(va) - Number(vb);
            } else if (typeof va === 'number' && typeof vb === 'number') {
                cmp = va - vb;
            } else {
                cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'es');
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [catalogoFiltradoGlobal, busqueda, sortKey, sortDir]);

    const renderSortIcon = (campo: keyof CuestionarioMeta) => {
        if (sortKey !== campo) return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
        return sortDir === 'asc'
            ? <ChevronUp className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
            : <ChevronDown className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />;
    };

    const handleResizeStart = useCallback((e: React.MouseEvent, campo: keyof CuestionarioMeta) => {
        e.preventDefault();
        e.stopPropagation();
        resizingCol.current = campo;
        startX.current = e.clientX;
        startWidth.current = colWidths[campo] ?? DEFAULT_COLUMN_WIDTHS[campo] ?? 90;

        const onMove = (ev: MouseEvent) => {
            if (!resizingCol.current) return;
            const diff = ev.clientX - startX.current;
            setColWidths(prev => ({ ...prev, [resizingCol.current!]: Math.max(46, startWidth.current + diff) }));
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

    const handleAutoFit = useCallback((e: React.MouseEvent, campo: keyof CuestionarioMeta) => {
        e.preventDefault();
        e.stopPropagation();
        if (!tableRef.current) return;

        const colIdx = CATALOG_COLUMNS.findIndex(c => c.key === campo);
        if (colIdx === -1) return;

        const cells = tableRef.current.querySelectorAll(`td:nth-child(${colIdx + 1}), th:nth-child(${colIdx + 1})`);
        let maxWidth = 52;
        cells.forEach(cell => {
            const el = cell as HTMLElement;
            const previousWidth = el.style.width;
            const previousOverflow = el.style.overflow;
            el.style.width = 'auto';
            el.style.overflow = 'visible';
            el.style.whiteSpace = 'nowrap';
            maxWidth = Math.max(maxWidth, el.scrollWidth + 18);
            el.style.width = previousWidth;
            el.style.overflow = previousOverflow;
            el.style.whiteSpace = '';
        });

        setColWidths(prev => ({ ...prev, [campo]: Math.min(maxWidth, 520) }));
    }, []);

    const renderHeader = (campo: keyof CuestionarioMeta, label: string, align: ColumnAlign = 'left') => (
        <th className="p-0 font-semibold text-muted whitespace-nowrap relative select-none">
            <button
                onClick={() => handleSort(campo)}
                className={`flex items-center gap-1 w-full px-2 py-2 pr-3 hover:text-heading transition-colors overflow-hidden ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}
                style={{ fontWeight: 600, fontSize: 'inherit' }}
            >
                <span className="truncate">{label}</span>
                <span className="shrink-0">{renderSortIcon(campo)}</span>
            </button>
            <span
                aria-hidden="true"
                onMouseDown={(e) => handleResizeStart(e, campo)}
                onDoubleClick={(e) => handleAutoFit(e, campo)}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-0 h-full w-2 cursor-col-resize transition-colors hover:bg-[var(--accent-primary)]"
                title="Arrastrar para redimensionar. Doble clic para autoajustar."
            />
        </th>
    );

    const renderBoolIcon = (valor: unknown) => (
        valor === true
            ? <Check className="w-4 h-4 mx-auto" style={{ color: 'var(--accent-success)' }} />
            : <span className="block h-4" aria-hidden="true" />
    );

    const renderTextCell = (valor: React.ReactNode, extraClassName = '') => (
        <td className={`p-2 text-body whitespace-nowrap overflow-hidden text-ellipsis ${extraClassName}`} title={typeof valor === 'string' ? valor : undefined}>
            {valor}
        </td>
    );

    return (
        <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-heading">Catálogo de cuestionarios</h2>
                    <div className="flex items-center gap-2 mt-1.5">
                        {catalogo.length > 0 ? (
                            <>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                                    backgroundColor: catalogoAMostrar.length !== catalogo.length ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                    color: catalogoAMostrar.length !== catalogo.length ? '#fff' : 'var(--text-tertiary)',
                                }}>
                                    {catalogoAMostrar.length} / {catalogo.length} cuestionarios
                                </span>
                                <span className="text-sm text-muted">·</span>
                                <span className="text-sm text-muted">{cuestionariosCargados.length} listos para filtrar</span>
                            </>
                        ) : (
                            <span className="text-sm text-muted">No hay catálogo cargado</span>
                        )}
                    </div>
                </div>
                <label
                    className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors border"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
                >
                    {catalogo.length > 0
                        ? <><RefreshCw className="w-4 h-4" /> Reemplazar catálogo</>
                        : <><Upload className="w-4 h-4" /> Cargar catálogo</>
                    }
                    <input type="file" accept=".csv,.xlsx,.xlsm" className="hidden" onChange={onCargarCatalogo} />
                </label>
            </div>

            {catalogo.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                    <Upload className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No se ha cargado ningún catálogo de cuestionarios.</p>
                    <p className="text-xs mt-1">Formato esperado: Excel o CSV con columnas como id_cuestionario, cuestionario, versión, tipo, estado, versión del sistema operativo y sistema operativo.</p>
                </div>
            ) : (
                <>
                    {/* Filtros Globales del Catálogo */}
                    <div className="mb-4 p-4 rounded-lg bg-body">
                        <button
                            onClick={handleToggleFiltros}
                            className="flex items-center gap-2 text-sm font-medium text-body hover:text-heading transition-colors mb-1"
                            aria-expanded={!filtrosColapsados}
                            aria-controls="filtros-catalogo-panel"
                        >
                            <Filter className="w-4 h-4 text-muted" />
                            <span>Filtros del catálogo</span>
                            <ChevronDown
                                className="w-3.5 h-3.5 text-muted transition-transform duration-200"
                                style={{ transform: filtrosColapsados ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                            />
                            {filtrosColapsados && (catVersionesActivas.length > 0 || catTiposActivos.length > 0 || catEstadosActivos.length > 0 || catSOActivos.length > 0 || catOfimaticaActiva.length > 0) && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                                    backgroundColor: 'var(--accent-warning)',
                                    color: '#fff',
                                }}>
                                    {[catVersionesActivas, catTiposActivos, catEstadosActivos, catSOActivos, catOfimaticaActiva].filter(a => a.length > 0).length} activo{[catVersionesActivas, catTiposActivos, catEstadosActivos, catSOActivos, catOfimaticaActiva].filter(a => a.length > 0).length > 1 ? 's' : ''}
                                </span>
                            )}
                        </button>
                        <div
                            id="filtros-catalogo-panel"
                            onTransitionEnd={(e) => {
                                if (e.target === e.currentTarget && !filtrosColapsados) {
                                    setOverflowVisible(true);
                                }
                            }}
                            style={{
                                maxHeight: filtrosColapsados ? '0px' : '300px',
                                opacity: filtrosColapsados ? 0 : 1,
                                overflow: overflowVisible ? 'visible' : 'hidden',
                                transition: 'max-height 0.3s ease, opacity 0.2s ease',
                            }}
                        >
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                                <MultiSelect id="f-cat-version" label="Versión" opciones={catVersionesDisponibles} seleccionadas={catVersionesActivas} onChange={setCatVersionesActivas} formatLabel={v => v} />
                                <MultiSelect id="f-cat-tipo" label="Tipo" opciones={catTiposDisponibles} seleccionadas={catTiposActivos} onChange={setCatTiposActivos} formatLabel={v => v} />
                                <MultiSelect id="f-cat-estado" label="Estado" opciones={catEstadosDisponibles} seleccionadas={catEstadosActivos} onChange={setCatEstadosActivos} formatLabel={v => v} />
                                <MultiSelect id="f-cat-so" label="Versión del sistema operativo" opciones={catSODisponibles} seleccionadas={catSOActivos} onChange={setCatSOActivos} formatLabel={v => v} />
                                <MultiSelect id="f-cat-ofi" label="Paquete ofimático" opciones={catOfimaticaDisponibles} seleccionadas={catOfimaticaActiva} onChange={setCatOfimaticaActiva} formatLabel={v => v} />
                            </div>
                            {/* Búsqueda */}
                            <div className="mt-3">
                                <input
                                    type="text"
                                    placeholder="Buscar en el catálogo filtrado…"
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    className="w-full max-w-xs px-3 py-2 text-sm border rounded-lg bg-card text-body focus:ring-2"
                                    style={{ borderColor: 'var(--border-primary)' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-x-auto">
                        <table
                            ref={tableRef}
                            className="text-sm"
                            style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: `${tableWidth}px` }}
                        >
                            <colgroup>
                                {CATALOG_COLUMNS.map(col => (
                                    <col
                                        key={col.key}
                                        style={{ width: `${colWidths[col.key] ?? DEFAULT_COLUMN_WIDTHS[col.key] ?? 90}px` }}
                                    />
                                ))}
                            </colgroup>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-secondary)' }}>
                                    {CATALOG_COLUMNS.map(col => renderHeader(col.key, col.label, col.align))}
                                </tr>
                            </thead>
                            <tbody>
                                {catalogoAMostrar.map(c => {
                                    const cargado = cuestionariosCargados.includes(c.id_cuestionario);
                                    const versionSistemaOperativo = obtenerVersionSistemaOperativo(c);
                                    return (
                                        <tr
                                            key={c.id_cuestionario}
                                            className="table-row-hover"
                                            onClick={cargado && onVerCuestionario ? () => onVerCuestionario(c.id_cuestionario) : undefined}
                                            style={{
                                                borderBottom: '1px solid var(--border-secondary)',
                                                backgroundColor: cargado ? 'rgba(var(--accent-success-rgb, 34,197,94), 0.08)' : 'transparent',
                                                cursor: cargado && onVerCuestionario ? 'pointer' : 'default',
                                            }}
                                            title={cargado && onVerCuestionario ? `Ver preguntas de ${c.id_cuestionario}` : undefined}
                                        >
                                            {renderTextCell(
                                                <>
                                                    {c.id_cuestionario}
                                                    {cargado && <Check className="w-3.5 h-3.5 inline ml-1" style={{ color: 'var(--accent-success)' }} />}
                                                </>,
                                                'font-mono font-semibold'
                                            )}
                                            {renderTextCell(c.familia)}
                                            {renderTextCell(c.cuestionario)}
                                            {renderTextCell(c.version)}
                                            {renderTextCell(c.tipo)}
                                            <td className="p-2 whitespace-nowrap">
                                                <span className="inline-block w-24 text-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider" style={
                                                    c.estado === 'actualizado'
                                                        ? { backgroundColor: 'var(--badge-ok-bg)', color: 'var(--badge-ok-fg)' }
                                                        : c.estado === 'revisado'
                                                            ? { backgroundColor: 'var(--badge-info-bg)', color: 'var(--badge-info-fg)' }
                                                            : { backgroundColor: 'var(--badge-warn-bg)', color: 'var(--badge-warn-fg)' }
                                                }>
                                                    {c.estado}
                                                </span>
                                            </td>
                                            <td className="p-2">{renderBoolIcon(c.recopilacion)}</td>
                                            <td className="p-2 text-right font-mono text-body">{c.num_preguntas || '—'}</td>
                                            {renderTextCell(versionSistemaOperativo)}
                                            {renderTextCell(c.paquete_ofimatico)}
                                            {renderTextCell(c.descripcion)}
                                            {renderTextCell(c.preparacion)}
                                            <td className="p-2">{renderBoolIcon(c.informatica)}</td>
                                            <td className="p-2">{renderBoolIcon(c.seguridad)}</td>
                                            <td className="p-2">{renderBoolIcon(c.sistema_operativo)}</td>
                                            <td className="p-2">{renderBoolIcon(c.procesador_texto)}</td>
                                            <td className="p-2">{renderBoolIcon(c.hoja_de_calculo)}</td>
                                            <td className="p-2">{renderBoolIcon(c.sgbd)}</td>
                                            <td className="p-2">{renderBoolIcon(c.presentaciones)}</td>
                                            <td className="p-2">{renderBoolIcon(c.redes)}</td>
                                            <td className="p-2">{renderBoolIcon(c.cliente_correo)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};
