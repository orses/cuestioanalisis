import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VisorDataset } from '../../src/components/VisorDataset';
import { createQuestion } from '../fixtures/questions';

function createQuestions(total: number) {
    return Array.from({ length: total }, (_, index) => {
        const number = index + 1;
        return createQuestion({
            id: `dataset-${number}`,
            id_cuestionario: 'Q_DATASET',
            numero_original: number,
            enunciado: `Registro visible ${number}.`,
        });
    });
}

describe('VisorDataset', () => {
    it('limita el render inicial a la primera pagina de registros', () => {
        render(<VisorDataset preguntas={createQuestions(105)} />);

        expect(screen.getAllByText('Mostrando 1-100 de 105 registros')).toHaveLength(2);
        expect(screen.getByText('Registro visible 100.')).toBeInTheDocument();
        expect(screen.queryByText('Registro visible 101.')).not.toBeInTheDocument();
    });

    it('permite navegar por paginas y abrir un registro visible', () => {
        const onVerPregunta = vi.fn();
        render(<VisorDataset preguntas={createQuestions(105)} onVerPregunta={onVerPregunta} />);

        fireEvent.click(screen.getAllByLabelText('Página siguiente')[0]);

        expect(screen.getAllByText('Mostrando 101-105 de 105 registros')).toHaveLength(2);
        expect(screen.getByText('Registro visible 101.')).toBeInTheDocument();
        expect(screen.queryByText('Registro visible 100.')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('Registro visible 101.'));

        expect(onVerPregunta).toHaveBeenCalledWith('dataset-101');
    });
});
