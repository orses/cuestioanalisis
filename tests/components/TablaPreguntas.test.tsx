import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TablaPreguntas } from '../../src/components/TablaPreguntas';
import { createQuestion } from '../fixtures/questions';

function createQuestions(total: number) {
    return Array.from({ length: total }, (_, index) => {
        const number = index + 1;
        return createQuestion({
            id: `p${number}`,
            id_cuestionario: 'Q_TEST',
            numero_original: number,
            enunciado: `Pregunta paginada ${number}.`,
        });
    });
}

describe('TablaPreguntas', () => {
    it('renderiza solo la primera pagina cuando hay muchas preguntas', () => {
        render(<TablaPreguntas preguntas={createQuestions(105)} onVerPregunta={vi.fn()} />);

        expect(screen.getAllByText('Mostrando 1-100 de 105 preguntas')).toHaveLength(2);
        expect(screen.getByText(/Pregunta paginada 100\./)).toBeInTheDocument();
        expect(screen.queryByText(/Pregunta paginada 101\./)).not.toBeInTheDocument();
    });

    it('navega a la pagina siguiente sin perder la apertura de pregunta', () => {
        const onVerPregunta = vi.fn();
        render(<TablaPreguntas preguntas={createQuestions(105)} onVerPregunta={onVerPregunta} />);

        fireEvent.click(screen.getAllByLabelText('Página siguiente')[0]);

        expect(screen.getAllByText('Mostrando 101-105 de 105 preguntas')).toHaveLength(2);
        expect(screen.getByText(/Pregunta paginada 101\./)).toBeInTheDocument();
        expect(screen.queryByText(/Pregunta paginada 100\./)).not.toBeInTheDocument();

        fireEvent.click(screen.getByText(/Pregunta paginada 101\./));

        expect(onVerPregunta).toHaveBeenCalledWith('p101');
    });
});
