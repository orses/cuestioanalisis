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

    return (
        <div className="bg-card border-b" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="max-w-[1400px] mx-auto px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                    <button
                        onClick={() => setColapsado(!colapsado)}
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
                <div
                    id="filtros-panel"
                    className="filtros-colapsable"
                    style={{
                        maxHeight: colapsado ? '0px' : '500px',
                        opacity: colapsado ? 0 : 1,
                        overflow: 'hidden',
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
