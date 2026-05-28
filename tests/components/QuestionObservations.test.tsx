import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuestionObservations } from '../../src/components/questions/QuestionObservations';

describe('QuestionObservations', () => {
    it('renderiza cada línea no vacía como un párrafo separado', () => {
        render(<QuestionObservations observations={'Definición ISO.\n\nNo confundir.\r\nIncluye mejora continua.'} />);

        const panel = screen.getByTestId('question-observations');
        const paragraphs = within(panel).getAllByText(/./);

        expect(screen.getByText('Observaciones')).toBeInTheDocument();
        expect(paragraphs.map(paragraph => paragraph.textContent)).toEqual([
            'Definición ISO.',
            'No confundir.',
            'Incluye mejora continua.',
        ]);
        expect(paragraphs[0]).toHaveClass('mb-2');
        expect(paragraphs[1]).toHaveClass('mb-2');
        expect(paragraphs[2]).not.toHaveClass('mb-2');
    });

    it('no renderiza el bloque cuando las observaciones están vacías', () => {
        const { container } = render(<QuestionObservations observations={' \n '} />);

        expect(container).toBeEmptyDOMElement();
    });
});

