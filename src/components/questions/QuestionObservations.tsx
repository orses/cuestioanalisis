import { splitObservationParagraphs } from '../../utils/observations';

interface QuestionObservationsProps {
    observations?: string;
}

export function QuestionObservations({ observations }: QuestionObservationsProps) {
    const paragraphs = splitObservationParagraphs(observations ?? '');

    if (paragraphs.length === 0) return null;

    return (
        <div className="mb-5">
            <h5 className="text-sm font-semibold text-heading mb-2">Observaciones</h5>
            <div
                className="text-sm text-body p-3 rounded-lg bg-card border leading-relaxed break-words"
                data-testid="question-observations"
                style={{ borderColor: 'var(--border-secondary)' }}
            >
                {paragraphs.map((paragraph, index) => (
                    <p key={`${index}-${paragraph}`} className={index < paragraphs.length - 1 ? 'mb-2' : undefined}>
                        {paragraph}
                    </p>
                ))}
            </div>
        </div>
    );
}

