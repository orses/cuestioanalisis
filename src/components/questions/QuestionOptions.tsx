import { XCircle } from 'lucide-react';
import type { Pregunta } from '../../types';

interface QuestionOptionsProps {
    pregunta: Pregunta;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;
const OPTION_COLORS: Record<string, string> = { A: '#3b82f6', B: '#10b981', C: '#f59e0b', D: '#8b5cf6' };

export function QuestionOptions({ pregunta }: QuestionOptionsProps) {
    return (
        <div className="space-y-2 mb-5">
            {OPTION_LETTERS.map(letter => {
                const optionText = pregunta.opciones[letter];
                if (!optionText) return null;

                const isCorrect = letter === pregunta.correcta;

                return (
                    <div
                        key={letter}
                        className="p-3 rounded-lg border flex items-start gap-3"
                        data-testid={`question-option-${letter}`}
                        data-correct={isCorrect ? 'true' : 'false'}
                        style={{
                            backgroundColor: isCorrect ? 'rgba(22, 163, 74, 0.12)' : 'var(--bg-secondary)',
                            borderColor: isCorrect ? 'var(--accent-success)' : 'var(--border-secondary)',
                            borderWidth: isCorrect ? '2px' : '1px',
                        }}
                    >
                        <div
                            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: OPTION_COLORS[letter] }}
                        >
                            {letter}
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm ${isCorrect ? 'font-semibold' : ''}`} style={{ color: 'var(--text-primary)' }}>
                                {optionText}
                            </p>
                        </div>
                        {!isCorrect && optionText && (
                            <XCircle
                                aria-label={`Opción ${letter} incorrecta`}
                                className="w-4 h-4 mt-1 flex-shrink-0"
                                style={{ color: 'var(--text-tertiary)', opacity: 0.3 }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

