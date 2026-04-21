import React from 'react';
import {
    Upload, Sun, Moon, Download, Filter, BarChart3, PieChart, Layers, Table2,
    Sparkles, HelpCircle, BookOpen, GitCompare, GraduationCap,
    FileText, FileSpreadsheet
} from 'lucide-react';

type Vista = 'resumen' | 'estadisticas' | 'ejercicios' | 'tabla' | 'conceptos' | 'comparativa' | 'simulacro' | 'generador' | 'catalogo' | 'ayuda';

const TABS: { id: Vista; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen', label: 'Resumen', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'estadisticas', label: 'Estadísticas', icon: <PieChart className="w-4 h-4" /> },
    { id: 'ejercicios', label: 'Ejercicios', icon: <Layers className="w-4 h-4" /> },
    { id: 'tabla', label: 'Tabla', icon: <Table2 className="w-4 h-4" /> },
    { id: 'conceptos', label: 'Conceptos', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'comparativa', label: 'Comparativa', icon: <GitCompare className="w-4 h-4" /> },
    { id: 'simulacro', label: 'Simulacro', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'generador', label: 'Generador IA', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'catalogo', label: 'Catálogo', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'ayuda', label: 'Ayuda', icon: <HelpCircle className="w-4 h-4" /> },
];

interface AppHeaderProps {
    nombresArchivos: string[];
    totalPreguntas: number;
    totalEjercicios: number;
    totalCuestionarios: number;
    totalEdiciones: number;
    hayFiltrosActivos: boolean;
    totalFiltradas: number;
    vistaActual: Vista;
    dark: boolean;
    loading: boolean;
    // Callbacks
    onExportarFiltrado: () => void;
    onDescargarInforme: () => void;
    onDescargarCSV: () => void;
    onToggleDark: () => void;
    onReemplazar: () => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSetVista: (v: Vista) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    nombresArchivos, totalPreguntas, totalEjercicios, totalCuestionarios, totalEdiciones,
    hayFiltrosActivos, totalFiltradas, vistaActual, dark,
    onExportarFiltrado, onDescargarInforme, onDescargarCSV, onToggleDark,
    onReemplazar, onFileUpload, onSetVista,
}) => {
    return (
        <header className="bg-card border-b sticky top-0 z-40" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="max-w-[1800px] mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                        <h1
                            className="text-xl font-bold text-heading truncate cursor-pointer hover:opacity-75 transition-opacity"
                            onClick={() => onSetVista('resumen')}
                            title="Ir al resumen"
                        >Análisis de Oposiciones</h1>
                        <p className="text-sm text-muted truncate" title={nombresArchivos.join(', ')}>
                            {nombresArchivos.length > 1
                                ? `${nombresArchivos.length} archivos combinados`
                                : nombresArchivos.join(', ')}
                            {' · '}
                            {totalPreguntas} preguntas · {totalEjercicios} ejercicios
                            {totalCuestionarios > 0 && (
                                <span> · {totalCuestionarios} cuestionarios</span>
                            )}
                            {totalEdiciones > 0 && (
                                <span className="ml-2 font-medium" style={{ color: 'var(--accent-success)' }}>
                                    · {totalEdiciones} corregidas
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-nowrap items-center gap-2 flex-shrink-0">
                        {hayFiltrosActivos && (
                            <button
                                onClick={onExportarFiltrado}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border"
                                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
                                aria-label="Exportar preguntas filtradas"
                                title={`Exportar ${totalFiltradas} preguntas filtradas`}
                            >
                                <Filter className="w-4 h-4" />
                                Exportar filtrado ({totalFiltradas})
                            </button>
                        )}
                        <button
                            onClick={onDescargarInforme}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border"
                            style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
                            aria-label="Generar informe Markdown"
                            title="Descargar informe analítico en Markdown"
                        >
                            <FileText className="w-4 h-4" />
                            Informe
                        </button>
                        <button
                            onClick={onDescargarCSV}
                            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                            style={{ backgroundColor: 'var(--accent-success)' }}
                            aria-label="Descargar dataset completo"
                        >
                            <Download className="w-4 h-4" />
                            {totalEdiciones > 0 ? `Descargar (${totalEdiciones} correcciones)` : 'Descargar dataset'}
                        </button>
                        <button
                            onClick={onToggleDark}
                            className="p-2 rounded-lg bg-muted text-body hover:bg-hover-custom transition-colors"
                            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        >
                            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={onReemplazar}
                            className="px-3 py-2 text-sm font-medium rounded-lg bg-muted text-body hover:bg-hover-custom transition-colors"
                        >
                            Reemplazar todo
                        </button>
                        <label className="cursor-pointer px-3 py-2 text-sm font-medium rounded-lg transition-colors border flex items-center gap-2"
                            style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
                            title="Añade datos de otro escenario sin perder los actuales"
                        >
                            <Upload className="w-4 h-4" />
                            Añadir CSV Preguntas
                            <input type="file" accept=".csv" multiple className="hidden" onChange={onFileUpload} />
                        </label>
                    </div>
                </div>
            </div>

            {/* ———— PESTAÑAS ———— */}
            <div className="bg-card border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                <div className="max-w-[1800px] mx-auto px-4">
                    <nav className="flex space-x-1 py-1 overflow-x-auto" role="tablist" aria-label="Secciones principales">
                        {TABS.map(({ id, label, icon }) => (
                            <button
                                key={id}
                                role="tab"
                                aria-selected={vistaActual === id}
                                aria-controls={`panel-${id}`}
                                onClick={() => onSetVista(id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${vistaActual === id
                                    ? 'text-white'
                                    : 'text-body hover:bg-muted'
                                    }`}
                                style={vistaActual === id ? { backgroundColor: 'var(--accent-primary)' } : undefined}
                            >
                                {icon}
                                {label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export type { Vista };
