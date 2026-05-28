import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuestionOptions } from '../../src/components/questions/QuestionOptions';
import { createQuestion } from '../fixtures/questions';

describe('QuestionOptions', () => {
    it('resalta la opción correcta y marca las incorrectas', () => {
        render(<QuestionOptions pregunta={createQuestion({ correcta: 'B' })} />);

        expect(screen.getByTestId('question-option-A')).toHaveAttribute('data-correct', 'false');
        expect(screen.getByTestId('question-option-B')).toHaveAttribute('data-correct', 'true');
        expect(screen.getByTestId('question-option-C')).toHaveAttribute('data-correct', 'false');
        expect(screen.getByTestId('question-option-D')).toHaveAttribute('data-correct', 'false');
        expect(screen.getAllByLabelText(/incorrecta/i)).toHaveLength(3);
    });

    it('omite opciones vacías', () => {
        render(<QuestionOptions pregunta={createQuestion({ opciones: { C: '' } })} />);

        expect(screen.queryByTestId('question-option-C')).not.toBeInTheDocument();
    });
});

