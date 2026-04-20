import React, { useState, useMemo } from 'react';
import { Upload, Check, Minus, RefreshCw, ChevronDown, ChevronUp, ChevronsUpDown, Filter } from 'lucide-react';
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
                c.cuestionario.toLowerCase().includes(busqueda.toLowerCase()) ||
                c.version.toLowerCase().includes(busqueda.toLowerCase()) ||
                c.paquete_ofimatico.toLowerCase().includes(busqueda.toLowerCase())
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

    const SortIcon: React.FC<{ campo: keyof CuestionarioMeta }> = ({ campo }) => {
        if (sortKey !== campo) return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
        return sortDir === 'asc'
            ? <ChevronUp className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
            : <ChevronDown className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />;
    };

    const Th: React.FC<{ campo: keyof CuestionarioMeta; label: string; align?: 'left' | 'right' | 'center' }> = ({ campo, label, align = 'left' }) => (
        <th className={`p-0 font-semibold text-muted whitespace-nowrap`}>
            <button
                onClick={() => handleSort(campo)}
                className={`flex items-center gap-1 w-full px-2 py-2 hover:text-heading transition-colors ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}
                style={{ fontWeight: 600, fontSize: 'inherit' }}
            >
                {label}
                <SortIcon campo={campo} />
            </button>
        </th>
    );

    const BoolIcon: React.FC<{ valor: boolean }> = ({ valor }) => (
        valor
            ? <Check className="w-4 h-4 mx-auto" style={{ color: 'var(--accent-success)' }} />
            : <Minus className="w-4 h-4 mx-auto" style={{ color: 'var(--text-tertiary)' }} />
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
                        : <><Upload className="w-4 h-4" /> Cargar catálogo CSV</>
                    }
                    <input type="file" accept=".csv" className="hidden" onChange={onCargarCatalogo} />
                </label>
            </div>

            {catalogo.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                    <Upload className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No se ha cargado ningún catálogo de cuestionarios.</p>
                    <p className="text-xs mt-1">Formato esperado: CSV con delimitador «|» y columnas id_cuestionario, cuestionario, versión, tipo, estado, etc.</p>
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
                                <MultiSelect id="f-cat-so" label="Sistema Operativo" opciones={catSODisponibles} seleccionadas={catSOActivos} onChange={setCatSOActivos} formatLabel={v => v} />
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
                        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-secondary)' }}>
                                    <Th campo="id_cuestionario" label="ID" />
                                    <Th campo="cuestionario" label="Cuestionario" />
                                    <Th campo="version" label="Versión" />
                                    <Th campo="tipo" label="Tipo" />
                                    <Th campo="estado" label="Estado" />
                                    <Th campo="num_preguntas" label="N.º preg." align="right" />
                                    <Th campo="sistema_operativo" label="SO" />
                                    <Th campo="paquete_ofimatico" label="Paquete ofimático" />
                                    <Th campo="procesador_texto" label="Texto" align="center" />
                                    <Th campo="hoja_de_calculo" label="Cálculo" align="center" />
                                    <Th campo="sgbd" label="SGBD" align="center" />
                                    <Th campo="presentaciones" label="Present." align="center" />
                                    <Th campo="cliente_correo" label="Correo" align="center" />
                                </tr>
                            </thead>
                            <tbody>
                                {catalogoAMostrar.map(c => {
                                    const cargado = cuestionariosCargados.includes(c.id_cuestionario);
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
                                            <td className="p-2 font-mono font-semibold whitespace-nowrap" style={{ color: cargado ? 'var(--accent-success)' : 'var(--text-primary)' }}>
                                                {c.id_cuestionario}
                                                {cargado && <Check className="w-3.5 h-3.5 inline ml-1" style={{ color: 'var(--accent-success)' }} />}
                                            </td>
                                            <td className="p-2 text-body whitespace-nowrap">{c.cuestionario}</td>
                                            <td className="p-2 text-body whitespace-nowrap">{c.version}</td>
                                            <td className="p-2 text-body whitespace-nowrap">{c.tipo}</td>
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
                                            <td className="p-2 text-right font-mono text-body">{c.num_preguntas || '—'}</td>
                                            <td className="p-2 text-body whitespace-nowrap">{c.sistema_operativo}</td>
                                            <td className="p-2 text-body whitespace-nowrap">{c.paquete_ofimatico}</td>
                                            <td className="p-2"><BoolIcon valor={c.procesador_texto} /></td>
                                            <td className="p-2"><BoolIcon valor={c.hoja_de_calculo} /></td>
                                            <td className="p-2"><BoolIcon valor={c.sgbd} /></td>
                                            <td className="p-2"><BoolIcon valor={c.presentaciones} /></td>
                                            <td className="p-2"><BoolIcon valor={c.cliente_correo} /></td>
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
