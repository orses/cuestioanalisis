import React, { useMemo, useState } from 'react';
import { Target } from 'lucide-react';
import type { Pregunta } from '../types';

interface Props {
    preguntas: Pregunta[];
}

const STOP_WORDS = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'e', 'o', 'u',
    'de', 'del', 'a', 'al', 'en', 'por', 'con', 'sin', 'para', 'segun', 'sobre',
    'que', 'quien', 'cual', 'cuyo', 'donde', 'como', 'cuando', 'cuanto',
    'su', 'sus', 'mi', 'tu', 'nuestro', 'vuestro', 'este', 'ese', 'aquel',
    'es', 'son', 'ser', 'fue', 'ha', 'han', 'tiene', 'tienen', 'esta', 'estan',
    'no', 'si', 'ni', 'mas', 'menos', 'muy', 'poco', 'todo', 'nada', 'algo',
    'se', 'me', 'te', 'nos', 'os', 'le', 'les', 'lo', 'las', 'solo', 'entre',
    'ley', 'artículo', 'leyes', 'real', 'decreto', 'disposición', 'general',
    'art', 'capítulo', 'título', 'número', 'apartado', 'letra', 'párrafo',
    'todas', 'todos', 'ninguna', 'ninguno', 'son', 'correctas', 'falsas',
    'anteriores', 'ambas', 'a)', 'b)', 'c)', 'd)', 'opción', 'respuesta',
    'puede', 'cambiar', 'tabla', 'permite', 'necesario', 'elementos',
    'texto', 'pueden', 'diseño', 'opciones'
]);

const tokenizar = (texto: string) => {
    return texto.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4 && !STOP_WORDS.has(w) && isNaN(Number(w)));
};

export const AnalisisDistractores: React.FC<Props> = ({ preguntas }) => {
    const [bloqueContext, setBloqueContext] = useState<string>('Todos');

    const { distractores, bloques } = useMemo(() => {
        const conteo = new Map<string, number>();
        const blqSet = new Set<string>();

        preguntas.forEach(p => {
            if (p.bloque) blqSet.add(p.bloque);

            if (bloqueContext !== 'Todos' && p.bloque !== bloqueContext) return;
            if (!p.correcta || !p.opciones[p.correcta as keyof typeof p.opciones]) return;

            const letraCorrecta = p.correcta;
            const textoCorrecta = p.opciones[letraCorrecta as keyof typeof p.opciones] as string;
            const tokensCorrecta = new Set(tokenizar(textoCorrecta));

            (['A', 'B', 'C', 'D'] as const).forEach(letra => {
                if (letra !== letraCorrecta) {
                    const textoIncorrecta = p.opciones[letra];
                    if (textoIncorrecta) {
                        const tokens = tokenizar(textoIncorrecta);
                        // Quedarnos con palabras únicas por respuesta falsa (para no inflar si se repite en la misma frase)
                        const tokensUnicos = Array.from(new Set(tokens));
                        tokensUnicos.forEach(t => {
                            if (!tokensCorrecta.has(t)) {
                                conteo.set(t, (conteo.get(t) || 0) + 1);
                            }
                        });
                    }
                }
            });
        });

        const topDistractores = Array.from(conteo.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30);

        return {
            distractores: topDistractores,
            bloques: ['Todos', ...Array.from(blqSet)].sort()
        };

    }, [preguntas, bloqueContext]);

    if (preguntas.length === 0) return null;

    const maxVal = distractores.length > 0 ? distractores[0][1] : 1;

    return (
        <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                        <Target className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                        Detección de Filtros y Distractores Frecuentes
                    </h2>
                    <p className="text-sm text-muted mt-1">
                        Mapeo de los términos conceptuales introducidos de manera artificial en opciones falsas para engañar al opositor.
                    </p>
                </div>

                {bloques.length > 2 && (
                    <select
                        value={bloqueContext}
                        onChange={e => setBloqueContext(e.target.value)}
                        className="px-3 py-2 text-sm border rounded-lg bg-card text-body focus:ring-2 outline-none"
                        style={{ borderColor: 'var(--border-secondary)' }}
                    >
                        {bloques.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                )}
            </div>

            {distractores.length === 0 ? (
                <div className="text-center p-8 text-muted border border-dashed rounded-lg" style={{ borderColor: 'var(--border-secondary)' }}>
                    No hay suficientes datos para extraer un patrón de trampas conceptuales excluyentes en este bloque.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {distractores.map(([palabra, frecuencia], i) => (
                        <div
                            key={palabra}
                            className="relative p-3 rounded-lg overflow-hidden border flex justify-between items-center z-10"
                            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}
                        >
                            <div
                                className="absolute left-0 top-0 bottom-0 z-[-1] opacity-20"
                                style={{
                                    backgroundColor: 'var(--accent-danger)',
                                    width: `${(frecuencia / maxVal) * 100}%`
                                }}
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-muted w-5 text-right">{i + 1}.</span>
                                <span className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{palabra}</span>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                {frecuencia}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
