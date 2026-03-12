import React, { useState, useMemo } from 'react';
import type { Pregunta } from '../types';
import type { PromptConfig } from '../utils/prompter';
import { compilarPromptSimulacro } from '../utils/prompter';
import { Terminal, Copy, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GeneradorProps {
    preguntas: Pregunta[];
}

export const Generador: React.FC<GeneradorProps> = ({ preguntas }) => {
    const [materia, setMateria] = useState<string>('todas');
    const [bloque, setBloque] = useState<string>('todos');
    const [tema, setTema] = useState<string>('todos');
    const [nivel, setNivel] = useState<PromptConfig['nivel']>('Intermedio');
    const [tipo, setTipo] = useState<PromptConfig['tipo']>('TEÓRICO');
    const [cantidad, setCantidad] = useState<number>(15);
    const [proporcion, setProporcion] = useState<string>('70-30');

    const [promptGenerado, setPromptGenerado] = useState<string>('');
    const [copiado, setCopiado] = useState(false);

    // Jerarquías derivadas del dataset
    const materiasDisponibles = useMemo(() => Array.from(new Set(preguntas.map(p => p.materia.toString()))), [preguntas]);

    const bloquesDisponibles = useMemo(() => {
        let filtradas = preguntas;
        if (materia !== 'todas') filtradas = filtradas.filter(p => p.materia.toString() === materia);
        return Array.from(new Set(filtradas.map(p => p.bloque).filter(Boolean)));
    }, [preguntas, materia]);

    const temasDisponibles = useMemo(() => {
        let filtradas = preguntas;
        if (materia !== 'todas') filtradas = filtradas.filter(p => p.materia.toString() === materia);
        if (bloque !== 'todos') filtradas = filtradas.filter(p => p.bloque === bloque);
        return Array.from(new Set(filtradas.map(p => p.tema).filter(Boolean)));
    }, [preguntas, materia, bloque]);


    const handleGenerar = () => {
        const config: PromptConfig = {
            materia,
            bloque,
            tema,
            cantidad,
            nivel,
            tipo,
            proporcion
        };
        const compilado = compilarPromptSimulacro(config, preguntas);
        setPromptGenerado(compilado);
        setCopiado(false);
    };

    const handleCopiar = () => {
        navigator.clipboard.writeText(promptGenerado);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 3000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">

            {/* Columna Izquierda: Controles y Formulario */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100 p-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                        <h2 className="font-bold text-gray-900 text-lg">Ajustes del simulacro</h2>
                    </div>

                    <div className="p-5 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                            <select
                                value={materia}
                                onChange={(e) => { setMateria(e.target.value); setBloque('todos'); setTema('todos'); }}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                            >
                                <option value="todas">Todas las materias (Mixto)</option>
                                {materiasDisponibles.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bloque</label>
                            <select
                                value={bloque}
                                onChange={(e) => { setBloque(e.target.value); setTema('todos'); }}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow disabled:bg-gray-50 disabled:text-gray-400"
                                disabled={bloquesDisponibles.length === 0}
                            >
                                <option value="todos">Todos los bloques</option>
                                {bloquesDisponibles.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tema Específico</label>
                            <select
                                value={tema}
                                onChange={(e) => setTema(e.target.value)}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow disabled:bg-gray-50 disabled:text-gray-400"
                                disabled={temasDisponibles.length === 0}
                            >
                                <option value="todos">Cualquier Tema</option>
                                {temasDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad</label>
                                <select
                                    value={nivel}
                                    onChange={(e) => setNivel(e.target.value as PromptConfig['nivel'])}
                                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-indigo-500"
                                >
                                    <option value="Básico">Básico</option>
                                    <option value="Intermedio">Intermedio</option>
                                    <option value="Avanzado">Avanzado</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="50"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estructura del test</label>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value as PromptConfig['tipo'])}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm outline-none focus:ring-indigo-500 mb-3"
                            >
                                <option value="TEÓRICO">Teórico (Normativa y Conceptos)</option>
                                <option value="PRÁCTICO">Práctico (Supuestos)</option>
                                <option value="TEÓRICO-PRÁCTICO">Híbrido (Teórico-Práctico)</option>
                            </select>

                            {tipo === 'TEÓRICO-PRÁCTICO' && (
                                <div className="animate-in slide-in-from-top-1 bg-amber-50 p-3 rounded border border-amber-200">
                                    <label className="block text-xs font-semibold text-amber-800 mb-1">Proporción Teoría-Práctica (ej. 70-30)</label>
                                    <input
                                        type="text"
                                        placeholder="70-30"
                                        value={proporcion}
                                        onChange={(e) => setProporcion(e.target.value)}
                                        className="w-full border border-amber-300 rounded text-sm py-1.5 px-2 bg-white outline-none focus:border-amber-500"
                                    />
                                    <p className="text-[10px] text-amber-700 mt-1 mt-1 leading-tight">La suma debe dar 100.</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleGenerar}
                            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                            <Terminal className="w-4 h-4" />
                            Compilar prompt
                        </button>
                    </div>
                </div>
            </div>

            {/* Columna Derecha: El prompt compilado */}
            <div className="lg:col-span-8 flex flex-col">
                <div className="bg-gray-900 rounded-lg shadow-md flex flex-col h-full overflow-hidden border border-gray-800 relative">
                    <div className="bg-gray-800 border-b border-gray-700 p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-300">
                            <Terminal className="w-4 h-4" />
                            <span className="text-xs font-mono font-medium tracking-wider">instruccion_simulacro_gemini.txt</span>
                        </div>

                        <button
                            onClick={handleCopiar}
                            disabled={!promptGenerado}
                            className={twMerge(clsx(
                                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-colors",
                                copiado
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : promptGenerado
                                        ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                        : "bg-gray-800 text-gray-600 cursor-not-allowed border border-transparent"
                            ))}
                        >
                            {copiado ? (
                                <><CheckCircle2 className="w-3.5 h-3.5" /> ¡Copiado!</>
                            ) : (
                                <><Copy className="w-3.5 h-3.5" /> Copiar para Gemini</>
                            )}
                        </button>
                    </div>

                    <div className="flex-grow p-0 relative min-h-[500px]">
                        {promptGenerado ? (
                            <textarea
                                readOnly
                                value={promptGenerado}
                                className="absolute inset-0 w-full h-full bg-transparent text-gray-300 font-mono text-sm p-5 resize-none outline-none custom-scrollbar"
                                style={{ lineHeight: '1.6' }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 p-8 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-2">
                                    <BookOpen className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-400">Generador de prompts en espera</h3>
                                <p className="text-sm max-w-sm">
                                    Configura los parámetros del examen en el panel izquierdo y haz clic en <strong>Compilar prompt</strong>.
                                    El sistema empaquetará las reglas de la RAE junto a un muestreo de conocimiento (enunciados y distractores reales) listo para copiar y pegar en Gemini.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};
