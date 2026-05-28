import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Comparativa } from '../../src/components/Comparativa';
import { getOrganismBrandColor } from '../../src/utils/organismBrandColors';
import { createQuestion } from '../fixtures/questions';

function getCards(): HTMLElement[] {
    return screen.getAllByTestId('comparison-exercise-card');
}

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

        const cards = getCards();
        const inapCards = cards.filter(card => card.getAttribute('data-organism') === 'INAP');
        const sergasCard = cards.find(card => card.getAttribute('data-organism') === 'SERGAS');

        expect(inapCards).toHaveLength(2);
        expect(sergasCard).toBeDefined();
        expect((inapCards[0] as HTMLElement).style.borderLeft).toBe((inapCards[1] as HTMLElement).style.borderLeft);
        expect((sergasCard as HTMLElement).style.borderLeft).not.toBe((inapCards[0] as HTMLElement).style.borderLeft);
        expect(inapCards[0]).toHaveStyle({ borderLeft: `4px solid ${getOrganismBrandColor('INAP')}` });
        expect(sergasCard).toHaveStyle({ borderLeft: `4px solid ${getOrganismBrandColor('SERGAS')}` });
    });

    it('ordena las tarjetas por organismo, escala, año, acceso, tipo de ejercicio y etiqueta final', () => {
        render(
            <Comparativa
                preguntas={[
                    createQuestion({
                        id: 'exercise_10_1',
                        id_cuestionario: 'Q_INAP_AUX_NUM',
                        metadatos: { organismo: 'INAP', escala: 'AUX', año: 2021, acceso: 'LI', tipo: 'UNI' },
                    }),
                    createQuestion({
                        id: 'sergas_psx_2020_1',
                        id_cuestionario: 'Q_SERGAS_PSX',
                        metadatos: { organismo: 'SERGAS', escala: 'PSX', año: 2020, acceso: 'LI', tipo: 'UNI' },
                    }),
                    createQuestion({
                        id: 'inap_adv_2019_1',
                        id_cuestionario: 'Q_INAP_ADV',
                        metadatos: { organismo: 'INAP', escala: 'ADV', año: 2019, acceso: 'LI', tipo: 'UNI' },
                    }),
                    createQuestion({
                        id: 'inap_aux_2020_1',
                        id_cuestionario: 'Q_INAP_AUX_2020',
                        metadatos: { organismo: 'INAP', escala: 'AUX', año: 2020, acceso: 'LI', tipo: 'UNI' },
                    }),
                    createQuestion({
                        id: 'exercise_2_1',
                        id_cuestionario: 'Q_INAP_AUX_NUM',
                        metadatos: { organismo: 'INAP', escala: 'AUX', año: 2021, acceso: 'LI', tipo: 'UNI' },
                    }),
                    createQuestion({
                        id: 'inap_aux_2021_pi_1',
                        id_cuestionario: 'Q_INAP_AUX_PI',
                        metadatos: { organismo: 'INAP', escala: 'AUX', año: 2021, acceso: 'PI', tipo: 'UNI' },
                    }),
                    createQuestion({
                        id: 'inap_aux_2021_li_seg_1',
                        id_cuestionario: 'Q_INAP_AUX_SEG',
                        metadatos: { organismo: 'INAP', escala: 'AUX', año: 2021, acceso: 'LI', tipo: 'SEG' },
                    }),
                    createQuestion({
                        id: 'inap_aux_2021_li_pri_1',
                        id_cuestionario: 'Q_INAP_AUX_PRI',
                        metadatos: { organismo: 'INAP', escala: 'AUX', año: 2021, acceso: 'LI', tipo: 'PRI' },
                    }),
                ]}
            />
        );

        const order = getCards().map(card => ({
            organismo: card.dataset.organism,
            escala: card.dataset.scale,
            año: card.dataset.year,
            acceso: card.dataset.access,
            tipo: card.dataset.exerciseType,
            ejercicio: card.dataset.exercise,
        }));

        expect(order).toEqual([
            { organismo: 'INAP', escala: 'AUX', año: '2020', acceso: 'LI', tipo: 'UNI', ejercicio: 'Q_INAP_AUX_2020 - inap_aux_2020' },
            { organismo: 'INAP', escala: 'AUX', año: '2021', acceso: 'LI', tipo: 'PRI', ejercicio: 'Q_INAP_AUX_PRI - inap_aux_2021_li_pri' },
            { organismo: 'INAP', escala: 'AUX', año: '2021', acceso: 'LI', tipo: 'SEG', ejercicio: 'Q_INAP_AUX_SEG - inap_aux_2021_li_seg' },
            { organismo: 'INAP', escala: 'AUX', año: '2021', acceso: 'LI', tipo: 'UNI', ejercicio: 'Q_INAP_AUX_NUM - exercise_2' },
            { organismo: 'INAP', escala: 'AUX', año: '2021', acceso: 'LI', tipo: 'UNI', ejercicio: 'Q_INAP_AUX_NUM - exercise_10' },
            { organismo: 'INAP', escala: 'AUX', año: '2021', acceso: 'PI', tipo: 'UNI', ejercicio: 'Q_INAP_AUX_PI - inap_aux_2021_pi' },
            { organismo: 'INAP', escala: 'ADV', año: '2019', acceso: 'LI', tipo: 'UNI', ejercicio: 'Q_INAP_ADV - inap_adv_2019' },
            { organismo: 'SERGAS', escala: 'PSX', año: '2020', acceso: 'LI', tipo: 'UNI', ejercicio: 'Q_SERGAS_PSX - sergas_psx_2020' },
        ]);
    });

    it('permite elegir alta densidad de tarjetas por fila', () => {
        render(
            <Comparativa
                preguntas={[
                    createQuestion({ id: 'p1', id_cuestionario: 'Q1' }),
                    createQuestion({ id: 'p2', id_cuestionario: 'Q2' }),
                ]}
            />
        );

        const grid = screen.getByTestId('comparison-exercise-grid');
        const threeCardsButton = screen.getByRole('button', { name: '3 tarjetas por fila' });
        const sixCardsButton = screen.getByRole('button', { name: '6 tarjetas por fila' });
        const eightCardsButton = screen.getByRole('button', { name: '8 tarjetas por fila' });

        expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' });
        expect(threeCardsButton).toHaveAttribute('aria-pressed', 'true');

        fireEvent.click(eightCardsButton);

        expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', minWidth: '1256px' });
        expect(eightCardsButton).toHaveAttribute('aria-pressed', 'true');
        expect(threeCardsButton).toHaveAttribute('aria-pressed', 'false');

        fireEvent.click(sixCardsButton);

        expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', minWidth: '940px' });
        expect(sixCardsButton).toHaveAttribute('aria-pressed', 'true');
        expect(eightCardsButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('muestra badges compactos sin rótulo visible y marca claramente la tarjeta seleccionada', () => {
        render(
            <Comparativa
                preguntas={[
                    createQuestion({
                        id: 'convocatoria_muy_larga_para_comprobar_lectura_completa_1',
                        id_cuestionario: 'C0001',
                        metadatos: {
                            organismo: 'INAP',
                            escala: 'AUX',
                            año: 2024,
                            acceso: 'LI',
                            cupo: 'DI',
                            tipo: 'UNI',
                            modelo: 'A',
                            variante: 'EXT',
                        },
                    }),
                ]}
            />
        );

        const card = getCards()[0];
        const cardScope = within(card);
        const title = screen.getByTestId('comparison-exercise-title');
        const organismBadge = screen.getByTestId('comparison-metadata-badge-organism');

        expect(title).toHaveTextContent('C0001 - convocatoria_muy_larga_para_comprobar_lectura_completa');
        expect(title).toHaveStyle({ overflowWrap: 'anywhere', whiteSpace: 'normal' });
        expect(cardScope.queryByText('Organismo')).not.toBeInTheDocument();
        expect(cardScope.queryByText('Escala')).not.toBeInTheDocument();
        expect(cardScope.queryByText('Acceso')).not.toBeInTheDocument();
        expect(cardScope.getByText('INAP')).toBeInTheDocument();
        expect(cardScope.getByText('Auxiliar')).toBeInTheDocument();
        expect(cardScope.getByText('2024')).toBeInTheDocument();
        expect(cardScope.getByText('Libre')).toBeInTheDocument();
        expect(cardScope.getByText('A')).toBeInTheDocument();
        expect(organismBadge).toHaveAttribute('data-label', 'Organismo');
        expect(organismBadge).toHaveAttribute('title', 'Organismo: INAP');
        expect(organismBadge).toHaveStyle({
            backgroundColor: getOrganismBrandColor('INAP'),
            borderColor: getOrganismBrandColor('INAP'),
            color: '#0f172a',
        });

        fireEvent.click(card);

        expect(card).toHaveAttribute('aria-pressed', 'true');
        expect(card).toHaveAttribute('data-selected', 'true');
        expect(screen.getByTestId('comparison-selected-badge')).toHaveTextContent('Seleccionada');
        expect(card.style.boxShadow).toContain('var(--accent-primary)');
    });

    it('mantiene el límite de cuatro convocatorias seleccionadas', () => {
        render(
            <Comparativa
                preguntas={[
                    createQuestion({ id: 'limite_1_1', id_cuestionario: 'Q1' }),
                    createQuestion({ id: 'limite_2_1', id_cuestionario: 'Q2' }),
                    createQuestion({ id: 'limite_3_1', id_cuestionario: 'Q3' }),
                    createQuestion({ id: 'limite_4_1', id_cuestionario: 'Q4' }),
                    createQuestion({ id: 'limite_5_1', id_cuestionario: 'Q5' }),
                ]}
            />
        );

        const cards = getCards();
        cards.slice(0, 4).forEach(card => fireEvent.click(card));

        expect(cards.slice(0, 4).map(card => card.dataset.selected)).toEqual(['true', 'true', 'true', 'true']);
        expect(cards[4]).toBeDisabled();

        fireEvent.click(cards[4]);

        expect(cards[4]).toHaveAttribute('data-selected', 'false');

        fireEvent.click(cards[0]);

        expect(cards[0]).toHaveAttribute('data-selected', 'false');
        expect(cards[4]).not.toBeDisabled();
    });
});
