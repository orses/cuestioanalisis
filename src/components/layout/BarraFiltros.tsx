import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { MultiSelect } from '../MultiSelect';

interface BarraFiltrosProps {
    totalFiltradas: number;
    totalDataset: number;
    hayFiltrosActivos: boolean;
    // Opciones
    disponibles: {
        materias: string[];
        bloques: string[];
        temas: string[];
        aplicaciones: string[];
        correctas: string[];
        anulada: string[];
        años: string[];
        organismos: string[];
        escalas: string[];
        accesos: string[];
        ejercicios: string[];
        cuestionarios: string[];
    };
    // Valores seleccionados
    state: {
        materias: string[];
        bloques: string[];
        temas: string[];
        aplicaciones: string[];
        correctas: string[];
        anulada: string[];
        años: string[];
        organismos: string[];
        escalas: string[];
        accesos: string[];
        ejercicios: string[];
        cuestionarios: string[];
        busqueda: string;
    };
    // Setters
    setMaterias: (v: string[]) => void;
    setBloques: (v: string[]) => void;
    setTemas: (v: string[]) => void;
    setAplicaciones: (v: string[]) => void;
    setCorrectas: (v: string[]) => void;
    setAnulada: (v: string[]) => void;
    setAños: (v: string[]) => void;
    setOrganismos: (v: string[]) => void;
    setEscalas: (v: string[]) => void;
    setAccesos: (v: string[]) => void;
    setEjercicios: (v: string[]) => void;
    setCuestionarios: (v: string[]) => void;
    setBusqueda: (v: string) => void;
    limpiar: () => void;
    limpiarCatalogo: () => void;
}

export const BarraFiltros: React.FC<BarraFiltrosProps> = ({
    totalFiltradas, totalDataset, hayFiltrosActivos,
    disponibles, state,
    setMaterias, setBloques, setTemas, setAplicaciones,
    setCorrectas, setAnulada, setAños, setOrganismos,
    setEscalas, setAccesos, setEjercicios, setCuestionarios,
    setBusqueda, limpiar, limpiarCatalogo,
}) => {
    const [colapsado, setColapsado] = useState(false);
    const [overflowVisible, setOverflowVisible] = useState(true);

    const handleToggleColapso = () => {
        if (!colapsado) {
            setOverflowVisible(false);
            setColapsado(true);
        } else {
            setColapsado(false);
        }
    };

    const handleLimpiarTodo = () => {
        limpiar();
        limpiarCatalogo();
    };

    // Contar filtros activos para mostrar badge cuando está colapsado
    const numFiltrosActivos = [
        state.materias, state.bloques, state.temas, state.aplicaciones,
        state.correctas, state.anulada, state.años, state.organismos,
        state.escalas, state.accesos, state.ejercicios, state.cuestionarios,
    ].filter(arr => arr.length > 0).length + (state.busqueda ? 1 : 0);

    // ——— Formatters para mostrar valores legibles en los chips ———
    const fmtEscala = (v: string) => ({ AUX: 'Auxiliar administrativo', ADV: 'Administrativo', PSX: 'Personal de Servicios Generales' } as Record<string, string>)[v] || v;
    const fmtAcceso = (v: string) => ({ LI: 'Libre', PI: 'Prom. interna', PC: 'Prom. cruzada' } as Record<string, string>)[v] || v;
    const fmtEjercicio = (v: string) => ({ PRI: 'Primero', SEG: 'Segundo', UNI: 'Único' } as Record<string, string>)[v] || v;

    // ——— Chips de filtros activos ———
    type ChipActivo = { key: string; label: string; valor: string; onQuitar: () => void };
    const quitarDe = (arr: string[], valor: string, setter: (v: string[]) => void) => () => setter(arr.filter(x => x !== valor));

    const chipsActivos: ChipActivo[] = [
        ...state.organismos.map(v => ({ key: `organismo-${v}`, label: 'Organismo', valor: v, onQuitar: quitarDe(state.organismos, v, setOrganismos) })),
        ...state.escalas.map(v => ({ key: `escala-${v}`, label: 'Escala', valor: fmtEscala(v), onQuitar: quitarDe(state.escalas, v, setEscalas) })),
        ...state.años.map(v => ({ key: `anyo-${v}`, label: 'Año', valor: v, onQuitar: quitarDe(state.años, v, setAños) })),
        ...state.accesos.map(v => ({ key: `acceso-${v}`, label: 'Acceso', valor: fmtAcceso(v), onQuitar: quitarDe(state.accesos, v, setAccesos) })),
        ...state.ejercicios.map(v => ({ key: `ejercicio-${v}`, label: 'Ejercicio', valor: fmtEjercicio(v), onQuitar: quitarDe(state.ejercicios, v, setEjercicios) })),
        ...state.materias.map(v => ({ key: `materia-${v}`, label: 'Materia', valor: v, onQuitar: quitarDe(state.materias, v, setMaterias) })),
        ...state.bloques.map(v => ({ key: `bloque-${v}`, label: 'Bloque', valor: v, onQuitar: quitarDe(state.bloques, v, setBloques) })),
        ...state.temas.map(v => ({ key: `tema-${v}`, label: 'Tema', valor: v, onQuitar: quitarDe(state.temas, v, setTemas) })),
        ...state.aplicaciones.map(v => ({ key: `aplicacion-${v}`, label: 'Aplicación', valor: v, onQuitar: quitarDe(state.aplicaciones, v, setAplicaciones) })),
        ...state.correctas.map(v => ({ key: `correcta-${v}`, label: 'Correcta', valor: v, onQuitar: quitarDe(state.correctas, v, setCorrectas) })),
        ...state.anulada.map(v => ({ key: `anulada-${v}`, label: 'Anulada', valor: v, onQuitar: quitarDe(state.anulada, v, setAnulada) })),
        ...state.cuestionarios.map(v => ({ key: `cuestionario-${v}`, label: 'Cuestionario', valor: v, onQuitar: quitarDe(state.cuestionarios, v, setCuestionarios) })),
        ...(state.busqueda ? [{ key: 'busqueda', label: 'Búsqueda', valor: state.busqueda, onQuitar: () => setBusqueda('') }] : []),
    ];

    return (
        <div className="bg-card border-b" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="max-w-[1800px] mx-auto px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                    <button
                        onClick={handleToggleColapso}
                        className="flex items-center gap-2 text-sm font-medium text-body hover:text-heading transition-colors"
                        aria-expanded={!colapsado}
                        aria-controls="filtros-panel"
                    >
                        <Filter className="w-4 h-4 text-muted" />
                        <span>Filtros</span>
                        <ChevronDown
                            className="w-3.5 h-3.5 text-muted transition-transform duration-200"
                            style={{ transform: colapsado ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                        />
                    </button>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                        backgroundColor: hayFiltrosActivos ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        color: hayFiltrosActivos ? '#fff' : 'var(--text-tertiary)',
                    }}>
                        {totalFiltradas} / {totalDataset} preguntas
                    </span>
                    {colapsado && numFiltrosActivos > 0 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                            backgroundColor: 'var(--accent-warning)',
                            color: '#fff',
                        }}>
                            {numFiltrosActivos} activo{numFiltrosActivos > 1 ? 's' : ''}
                        </span>
                    )}
                    {hayFiltrosActivos && (
                        <button onClick={handleLimpiarTodo} className="text-xs font-medium flex items-center gap-1 ml-2 hover:underline" style={{ color: 'var(--accent-primary)' }}>
                            <X className="w-3 h-3" /> Limpiar filtros
                        </button>
                    )}
                </div>

                {/* ———— Chips de filtros activos (siempre visibles, incluso con el panel colapsado) ———— */}
                {chipsActivos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 mb-1" aria-label="Filtros activos">
                        {chipsActivos.map(c => (
                            <span
                                key={c.key}
                                className="inline-flex items-center gap-1 text-xs font-medium rounded-full pl-2.5 pr-1 py-0.5 border"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderColor: 'var(--border-secondary)',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                <span className="text-muted">{c.label}:</span>
                                <span className="font-semibold truncate" style={{ maxWidth: '200px' }} title={c.valor}>{c.valor}</span>
                                <button
                                    onClick={c.onQuitar}
                                    className="ml-0.5 p-0.5 rounded-full hover:bg-muted transition-colors"
                                    aria-label={`Quitar filtro ${c.label}: ${c.valor}`}
                                    title={`Quitar ${c.label}: ${c.valor}`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <div
                    id="filtros-panel"
                    className="filtros-colapsable"
                    onTransitionEnd={(e) => {
                        if (e.target === e.currentTarget && !colapsado) {
                            setOverflowVisible(true);
                        }
                    }}
                    style={{
                        maxHeight: colapsado ? '0px' : '500px',
                        opacity: colapsado ? 0 : 1,
                        overflow: overflowVisible ? 'visible' : 'hidden',
                        transition: 'max-height 0.3s ease, opacity 0.2s ease',
                    }}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                        {/* Convocatoria */}
                        <MultiSelect id="f-organismo" label="Organismo" opciones={disponibles.organismos} seleccionadas={state.organismos} onChange={setOrganismos} formatLabel={v => v} />
                        <MultiSelect id="f-escala" label="Escala" opciones={disponibles.escalas} seleccionadas={state.escalas} onChange={setEscalas} formatLabel={v => ({ AUX: 'Auxiliar administrativo', ADV: 'Administrativo', PSX: 'Personal de Servicios Generales' } as Record<string, string>)[v] || v} />
                        <MultiSelect id="f-anyo" label="Año" opciones={disponibles.años} seleccionadas={state.años} onChange={setAños} formatLabel={v => v} />
                        <MultiSelect id="f-acceso" label="Acceso" opciones={disponibles.accesos} seleccionadas={state.accesos} onChange={setAccesos} formatLabel={v => ({ LI: 'Libre', PI: 'Prom. interna', PC: 'Prom. cruzada' } as Record<string, string>)[v] || v} />
                        <MultiSelect id="f-ejercicio" label="Ejercicio" opciones={disponibles.ejercicios} seleccionadas={state.ejercicios} onChange={setEjercicios} formatLabel={v => ({ PRI: 'Primero', SEG: 'Segundo', UNI: 'Único' } as Record<string, string>)[v] || v} />
                        {/* Clasificación temática */}
                        <MultiSelect id="f-materia" label="Materia" opciones={disponibles.materias} seleccionadas={state.materias} onChange={setMaterias} />
                        <MultiSelect id="f-bloque" label="Bloque" opciones={disponibles.bloques} seleccionadas={state.bloques} onChange={setBloques} formatLabel={v => v} />
                        <MultiSelect id="f-tema" label="Tema" opciones={disponibles.temas} seleccionadas={state.temas} onChange={setTemas} formatLabel={v => v} />
                        <MultiSelect id="f-aplicacion" label="Aplicación" opciones={disponibles.aplicaciones} seleccionadas={state.aplicaciones} onChange={setAplicaciones} formatLabel={v => v} />
                        <MultiSelect id="f-correcta" label="Correcta" opciones={disponibles.correctas} seleccionadas={state.correctas} onChange={setCorrectas} formatLabel={v => v} />
                        <MultiSelect id="f-anulada" label="Anuladas" opciones={disponibles.anulada} seleccionadas={state.anulada} onChange={setAnulada} formatLabel={v => v} />
                        {disponibles.cuestionarios.length > 0 && (
                            <MultiSelect id="f-cuestionario" label="Cuestionario" opciones={disponibles.cuestionarios} seleccionadas={state.cuestionarios} onChange={setCuestionarios} formatLabel={v => v} />
                        )}
                        {/* Búsqueda */}
                        <div className="col-span-2">
                            <label htmlFor="f-busqueda" className="block text-xs font-medium text-muted mb-1">Buscar</label>
                            <div className="relative">
                                <input id="f-busqueda" type="text" placeholder='Lógica: "rey Y constitución", "rey O alcalde", "rey -reina"'
                                    value={state.busqueda} onChange={e => setBusqueda(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 text-sm border rounded-lg bg-card text-body focus:ring-2" style={{ borderColor: 'var(--border-primary)' }}
                                />
                                {state.busqueda && (
                                    <button
                                        onClick={() => setBusqueda('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
