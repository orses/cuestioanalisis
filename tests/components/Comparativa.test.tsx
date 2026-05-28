import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Comparativa } from '../../src/components/Comparativa';
import { createQuestion } from '../fixtures/questions';

describe('Comparativa', () => {
    it('usa el mismo borde izquierdo para convocatorias del mismo organismo aunque cambie la escala', () => {
        render(
            <Comparativa
                preguntas={[
                    createQuestion({
                        id: 'p1',
                        id_cuestionario: 'Q_INAP_AUX',
                        numero_original: 1,
                        metadatos: { organismo: 'INAP', escala: 'AUX', año: 2025, acceso: 'LI', tipo: 'UNI' },
                    }),
                    createQuestion({
                        id: 'p2',
                        id_cuestionario: 'Q_INAP_ADV',
                        numero_original: 1,
                        metadatos: { organismo: 'INAP', escala: 'ADV', año: 2024, acceso: 'LI', tipo: 'UNI' },
                    }),
                    createQuestion({
                        id: 'p3',
                        id_cuestionario: 'Q_SERGAS_AUX',
                        numero_original: 1,
                        metadatos: { organismo: 'SERGAS', escala: 'AUX', año: 2023, acceso: 'LI', tipo: 'UNI' },
                    }),
                ]}
            />
        );

        const cards = screen.getAllByTestId('comparison-exercise-card');
        const inapCards = cards.filter(card => card.getAttribute('data-organism') === 'INAP');
        const sergasCard = cards.find(card => card.getAttribute('data-organism') === 'SERGAS');

        expect(inapCards).toHaveLength(2);
        expect(sergasCard).toBeDefined();
        expect((inapCards[0] as HTMLElement).style.borderLeft).toBe((inapCards[1] as HTMLElement).style.borderLeft);
        expect((sergasCard as HTMLElement).style.borderLeft).not.toBe((inapCards[0] as HTMLElement).style.borderLeft);
    });
});
