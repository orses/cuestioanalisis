import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuestionMetadata } from '../../src/components/questions/QuestionMetadata';
import { createQuestion } from '../fixtures/questions';

const baseQuestion = createQuestion({
    metadatos: {
        tipoConvocatoria: 'ES',
        cupo: 'DI',
        modelo: 'B',
        variante: 'EXT_BIB',
    },
});

function renderMetadata(overrides = {}) {
    const callbacks = {
        onFiltrarMateria: vi.fn(),
        onFiltrarBloque: vi.fn(),
        onFiltrarTema: vi.fn(),
        onFiltrarAplicacion: vi.fn(),
        onFiltrarAño: vi.fn(),
        onFiltrarEscala: vi.fn(),
        onFiltrarAcceso: vi.fn(),
        onFiltrarEjercicio: vi.fn(),
    };

    const setters = {
        setEditMateria: vi.fn(),
        setEditBloque: vi.fn(),
        setEditTema: vi.fn(),
        setEditApp: vi.fn(),
        setEditCorrecta: vi.fn(),
    };

    render(
        <QuestionMetadata
            pregunta={baseQuestion}
            editing={false}
            editMateria="informática"
            editBloque="software"
            editTema="Windows"
            editApp="Word"
            editCorrecta="B"
            {...setters}
            {...callbacks}
            {...overrides}
        />
    );

    return { callbacks, setters };
}

describe('QuestionMetadata', () => {
    it('muestra metadatos formateados y dispara filtros desde los campos clicables', () => {
        const { callbacks } = renderMetadata();

        expect(screen.getByText('Auxiliar administrativo')).toBeInTheDocument();
        expect(screen.getByText('Estabilización')).toBeInTheDocument();
        expect(screen.getByText('Libre')).toBeInTheDocument();
        expect(screen.getByText('Discapacidad')).toBeInTheDocument();
        expect(screen.getByText('Único')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
        expect(screen.getByText('Extraordinario BIB')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Auxiliar administrativo'));
        fireEvent.click(screen.getByText('2025'));
        fireEvent.click(screen.getByText('Libre'));
        fireEvent.click(screen.getByText('Único'));
        fireEvent.click(screen.getByText('informática'));
        fireEvent.click(screen.getByText('software'));
        const windowsFields = screen.getAllByText('Windows');
        fireEvent.click(windowsFields[0]);
        fireEvent.click(windowsFields[1]);

        expect(callbacks.onFiltrarEscala).toHaveBeenCalledWith('AUX');
        expect(callbacks.onFiltrarAño).toHaveBeenCalledWith('2025');
        expect(callbacks.onFiltrarAcceso).toHaveBeenCalledWith('LI');
        expect(callbacks.onFiltrarEjercicio).toHaveBeenCalledWith('UNI');
        expect(callbacks.onFiltrarMateria).toHaveBeenCalledWith('informática');
        expect(callbacks.onFiltrarBloque).toHaveBeenCalledWith('software');
        expect(callbacks.onFiltrarTema).toHaveBeenCalledWith('Windows');
        expect(callbacks.onFiltrarAplicacion).toHaveBeenCalledWith('Windows');
    });

    it('renderiza controles de edición y propaga cambios', () => {
        const { setters } = renderMetadata({ editing: true });

        fireEvent.change(screen.getByDisplayValue('informática'), { target: { value: 'seguridad' } });
        fireEvent.change(screen.getByDisplayValue('software'), { target: { value: 'seguridad' } });
        fireEvent.change(screen.getByDisplayValue('Windows'), { target: { value: 'ISO 27000' } });
        fireEvent.change(screen.getByDisplayValue('Word'), { target: { value: 'Excel' } });
        fireEvent.change(screen.getByDisplayValue('B'), { target: { value: 'C' } });

        expect(setters.setEditMateria).toHaveBeenCalledWith('seguridad');
        expect(setters.setEditBloque).toHaveBeenCalledWith('seguridad');
        expect(setters.setEditTema).toHaveBeenCalledWith('ISO 27000');
        expect(setters.setEditApp).toHaveBeenCalledWith('Excel');
        expect(setters.setEditCorrecta).toHaveBeenCalledWith('C');
    });
});
