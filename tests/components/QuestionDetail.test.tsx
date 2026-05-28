import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuestionDetail } from '../../src/components/questions/QuestionDetail';
import { createQuestion } from '../fixtures/questions';

function renderDetail(overrides = {}) {
    const callbacks = {
        onCopy: vi.fn(),
        onStartEdit: vi.fn(),
        onSave: vi.fn(),
        onCancelEdit: vi.fn(),
    };

    const setters = {
        setEditMateria: vi.fn(),
        setEditBloque: vi.fn(),
        setEditTema: vi.fn(),
        setEditApp: vi.fn(),
        setEditCorrecta: vi.fn(),
        setEditEnunciado: vi.fn(),
        setEditObservaciones: vi.fn(),
    };

    render(
        <QuestionDetail
            pregunta={createQuestion({ observaciones: 'Primera observación.\nSegunda observación.' })}
            editing={false}
            anyEditing={false}
            copied={false}
            soloDetalle={false}
            canEdit={true}
            editMateria="informática"
            editBloque="software"
            editTema="Windows"
            editApp="Word"
            editCorrecta="A"
            editEnunciado="Enunciado editado"
            editObservaciones="Observación editada"
            {...setters}
            {...callbacks}
            {...overrides}
        />
    );

    return { callbacks, setters };
}

describe('QuestionDetail', () => {
    it('muestra acciones, enunciado, opciones, observaciones y metadatos en lectura', () => {
        const { callbacks } = renderDetail();

        expect(screen.getByText('Detalle de la pregunta')).toBeInTheDocument();
        expect(screen.getByText(/Pregunta de ejemplo sobre Windows/)).toBeInTheDocument();
        expect(screen.getByTestId('question-option-A')).toHaveAttribute('data-correct', 'true');
        expect(screen.getByText('Primera observación.')).toBeInTheDocument();
        expect(screen.getByText('Convocatoria')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Copiar'));
        fireEvent.click(screen.getByText('Editar'));

        expect(callbacks.onCopy).toHaveBeenCalledOnce();
        expect(callbacks.onStartEdit).toHaveBeenCalledOnce();
    });

    it('oculta copiar durante edición y permite guardar o cancelar', () => {
        const { callbacks, setters } = renderDetail({ editing: true, anyEditing: true });

        expect(screen.queryByText('Copiar')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Enunciado de la pregunta')).toHaveValue('Enunciado editado');
        expect(screen.getByLabelText('Observaciones de la pregunta')).toHaveValue('Observación editada');

        fireEvent.change(screen.getByLabelText('Enunciado de la pregunta'), { target: { value: 'Nuevo enunciado' } });
        fireEvent.change(screen.getByLabelText('Observaciones de la pregunta'), { target: { value: 'Nueva observación' } });
        fireEvent.click(screen.getByText('Guardar'));
        fireEvent.click(screen.getByText('Cancelar'));

        expect(setters.setEditEnunciado).toHaveBeenCalledWith('Nuevo enunciado');
        expect(setters.setEditObservaciones).toHaveBeenCalledWith('Nueva observación');
        expect(callbacks.onSave).toHaveBeenCalledOnce();
        expect(callbacks.onCancelEdit).toHaveBeenCalledOnce();
    });
});

