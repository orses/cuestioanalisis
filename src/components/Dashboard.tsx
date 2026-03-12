import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import type { Pregunta } from '../types';
import { detectarDuplicados } from '../utils/similarity';
import { calcularDificultad, analizarCobertura } from '../utils/analytics';
import { Recycle, Gauge, ShieldCheck, Target } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface DashboardProps {
    preguntas: Pregunta[];
    setMateriasActivas?: (materias: string[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ preguntas, setMateriasActivas }) => {
    // ——— KPIs expandidos ———
    const kpiReciclaje = useMemo(() => {
        if (preguntas.length < 10) return 0;
        const duplicados = detectarDuplicados(preguntas, 0.6);
        const idsEnDuplicados = new Set<string>();
        for (const g of duplicados) {
            for (const p of g.preguntas) idsEnDuplicados.add(p.id);
        }
        return Math.round((idsEnDuplicados.size / preguntas.length) * 100);
    }, [preguntas]);

    const kpiShannon = useMemo(() => {
        // Índice de diversidad de Shannon normalizado (0-1) para materias
        const conteo: Record<string, number> = {};
        for (const p of preguntas) {
            const m = p.materia.toString();
            conteo[m] = (conteo[m] || 0) + 1;
        }
        const n = preguntas.length;
        if (n === 0) return 0;
        const cats = Object.values(conteo);
        let h = 0;
        for (const c of cats) {
            const p = c / n;
            if (p > 0) h -= p * Math.log(p);
        }
        const hMax = Math.log(cats.length || 1);
        return hMax > 0 ? Math.round((h / hMax) * 100) : 0;
    }, [preguntas]);

    const kpiCobertura = useMemo(() => {
        if (preguntas.length === 0) return 0;
        const cob = analizarCobertura(preguntas);
        return cob.coberturaPorcentaje;
    }, [preguntas]);

    const kpiDificultadMedia = useMemo(() => {
        if (preguntas.length === 0) return 0;
        const difs = calcularDificultad(preguntas);
        const sum = difs.reduce((s, d) => s + d.score, 0);
        return Math.round(sum / difs.length);
    }, [preguntas]);

    // ——— Gráficos existentes ———
    const materiasMap = preguntas.reduce((acc, p) => {
        const materiaStr = p.materia.toString();
        acc[materiaStr] = (acc[materiaStr] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const dataMaterias = {
        labels: Object.keys(materiasMap).map(m => m.charAt(0).toUpperCase() + m.slice(1)),
        datasets: [
            {
                data: Object.values(materiasMap),
                backgroundColor: [
                    '#1D6F42', '#2B579A', '#A4373A', '#00A4EF',
                    '#6B7280', '#8B5CF6', '#F59E0B',
                ],
                borderWidth: 1,
            },
        ],
    };

    const distractoresPorMateriaMap = preguntas.reduce((acc, p) => {
        const materiaStr = p.materia.toString();
        acc[materiaStr] = (acc[materiaStr] || 0) + p.distractores.length;
        return acc;
    }, {} as Record<string, number>);

    const dataDistractores = {
        labels: Object.keys(distractoresPorMateriaMap).map(m => m.charAt(0).toUpperCase() + m.slice(1)),
        datasets: [
            {
                label: 'Términos de Estudio (Distractores)',
                data: Object.values(distractoresPorMateriaMap),
                backgroundColor: '#1D6F42',
            }
        ],
    };

    const opcionesPie = {
        plugins: {
            legend: { position: 'right' as const },
        },
        maintainAspectRatio: false,
        onClick: (_event: any, elements: any[]) => {
            if (elements.length > 0 && setMateriasActivas) {
                const index = elements[0].index;
                const materiaStr = dataMaterias.labels[index].toLowerCase();
                setMateriasActivas([materiaStr]);
            }
        }
    };

    const opcionesBar = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
        },
        onClick: (_event: any, elements: any[]) => {
            if (elements.length > 0 && setMateriasActivas) {
                const index = elements[0].index;
                const materiaStr = dataDistractores.labels[index].toLowerCase();
                setMateriasActivas([materiaStr]);
            }
        }
    };

    const kpis = [
        { valor: `${kpiReciclaje}%`, etiqueta: 'Tasa reciclaje', icono: <Recycle className="w-5 h-5" />, color: '#f59e0b', titulo: 'Porcentaje de preguntas que son duplicadas o muy similares a otra del dataset' },
        { valor: `${kpiShannon}%`, etiqueta: 'Diversidad (Shannon)', icono: <Gauge className="w-5 h-5" />, color: '#8b5cf6', titulo: 'Equilibrio entre materias (100% = equidistribuido, 0% = todo en una materia)' },
        { valor: `${kpiCobertura}%`, etiqueta: 'Cobertura temario', icono: <ShieldCheck className="w-5 h-5" />, color: '#059669', titulo: 'Proporción de elementos con buena representación (≥ 2 años y ≥ 3 preguntas)' },
        { valor: `${kpiDificultadMedia}/100`, etiqueta: 'Dificultad media', icono: <Target className="w-5 h-5" />, color: '#dc2626', titulo: 'Media del índice de dificultad compuesto de todas las preguntas' },
    ];

    return (
        <div>
            {/* KPIs expandidos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {kpis.map((kpi, i) => (
                    <div key={i} className="rounded-xl border overflow-hidden transition-shadow hover:shadow-md"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}
                        title={kpi.titulo}
                    >
                        <div style={{ height: '3px', background: kpi.color }} />
                        <div className="px-4 py-3 flex items-center gap-3">
                            <div className="flex-shrink-0 rounded-lg p-2" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
                                {kpi.icono}
                            </div>
                            <div>
                                <p className="text-xl font-extrabold leading-none" style={{ color: 'var(--text-primary)' }}>{kpi.valor}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{kpi.etiqueta}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Gráficos originales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg shadow-sm border h-80 transition-shadow hover:shadow-md cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Distribución por materias</h3>
                    <p className="text-xs mb-2 -mt-3" style={{ color: 'var(--text-tertiary)' }}>Clic en un sector para filtrar</p>
                    <div className="h-52 relative w-full flex justify-center">
                        {preguntas.length > 0 ? (
                            <Pie data={dataMaterias} options={opcionesPie} />
                        ) : (
                            <p className="flex items-center h-full" style={{ color: 'var(--text-tertiary)' }}>No hay datos suficientes</p>
                        )}
                    </div>
                </div>

                <div className="p-6 rounded-lg shadow-sm border h-80 transition-shadow hover:shadow-md cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Volumen de distractores extraídos</h3>
                    <p className="text-xs mb-2 -mt-3" style={{ color: 'var(--text-tertiary)' }}>Clic en una barra para filtrar</p>
                    <div className="h-52 relative w-full">
                        {preguntas.length > 0 ? (
                            <Bar data={dataDistractores} options={opcionesBar} />
                        ) : (
                            <p className="flex items-center justify-center h-full" style={{ color: 'var(--text-tertiary)' }}>No hay datos suficientes</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
