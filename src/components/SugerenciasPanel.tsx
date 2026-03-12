import React, { useMemo } from 'react';
import type { Pregunta } from '../types';
import { generarInsights } from '../utils/estadisticas';
import { Lightbulb, TrendingUp, TrendingDown, Scale, AlertTriangle, Target } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SugerenciasPanelProps {
    preguntas: Pregunta[];
}

export const SugerenciasPanel: React.FC<SugerenciasPanelProps> = ({ preguntas }) => {
    const insights = useMemo(() => generarInsights(preguntas), [preguntas]);

    if (insights.length === 0) return null;

    const getIconContainerColor = (tipo: string) => {
        switch (tipo) {
            case 'sesgo': return 'bg-purple-100 text-purple-600';
            case 'tendencia': return 'bg-blue-100 text-blue-600';
            case 'dificultad': return 'bg-red-100 text-red-600';
            case 'correlacion': return 'bg-yellow-100 text-yellow-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const IconMap: Record<string, React.ReactNode> = {
        'dice': <Target className="w-5 h-5" />,
        'balance': <Scale className="w-5 h-5" />,
        'trending-up': <TrendingUp className="w-5 h-5" />,
        'trending-down': <TrendingDown className="w-5 h-5" />,
        'warning': <AlertTriangle className="w-5 h-5" />
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-lg shadow-sm border border-indigo-100 mb-6 transition-all">
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-bold text-gray-900">Análisis Predictivo e Insights</h3>
                <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                    En Tiempo Real
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={twMerge(clsx("p-2 rounded-md", getIconContainerColor(insight.tipo)))}>
                                {IconMap[insight.icono] || <Lightbulb className="w-5 h-5" />}
                            </div>
                            <h4 className="font-semibold text-gray-800 text-sm">{insight.titulo}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 flex-grow">{insight.descripcion}</p>
                        <div className="space-y-1 mt-auto">
                            {insight.detalles.map((det, i) => (
                                <div key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                                    <span className="text-indigo-400 mt-0.5">•</span>
                                    <span>{det}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
