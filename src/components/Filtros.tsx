import React from 'react';


interface FiltrosProps {
    materiasDisponibles: string[];
    materiaActiva: string;
    setMateriaActiva: (materia: string) => void;
    busqueda: string;
    setBusqueda: (busqueda: string) => void;
}

export const Filtros: React.FC<FiltrosProps> = ({
    materiasDisponibles,
    materiaActiva,
    setMateriaActiva,
    busqueda,
    setBusqueda
}) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
                <label htmlFor="busqueda" className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar en enunciados o distractores
                </label>
                <input
                    type="text"
                    id="busqueda"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Ley 39/2015..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>
            <div className="sm:w-64">
                <label htmlFor="materia" className="block text-sm font-medium text-gray-700 mb-1">
                    Filtrar por Materia
                </label>
                <select
                    id="materia"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={materiaActiva}
                    onChange={(e) => setMateriaActiva(e.target.value)}
                >
                    <option value="todas">Todas las materias</option>
                    {materiasDisponibles.map((materia) => (
                        <option key={materia} value={materia}>
                            {materia.charAt(0).toUpperCase() + materia.slice(1)}
                        </option>
                    ))}
                </select>
            </div>
            <button
                onClick={() => {
                    setBusqueda('');
                    setMateriaActiva('todas');
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors border border-gray-300 whitespace-nowrap"
                title="Limpiar todos los filtros actuales"
            >
                Limpiar filtros
            </button>
        </div>
    );
};
