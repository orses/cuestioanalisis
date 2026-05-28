import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModalPregunta } from '../../src/components/layout/ModalPregunta';
import { createQuestion } from '../fixtures/questions';

const currentQuestion = createQuestion({
    id: 'Q2_INAP_AUX_25_LI_UNI_2',
    numero_original: 2,
    enunciado: 'Pregunta modal sobre seguridad de la informacion.',
    observaciones: 'Primera observacion.\nSegunda observacion.',
});

const previousQuestion = createQuestion({
    id: 'Q1_INAP_AUX_25_LI_UNI_1',
    numero_original: 1,
    enunciado: 'Pregunta anterior.',
});

const nextQuestion = createQuestion({
    id: 'Q3_INAP_AUX_25_LI_UNI_3',
    numero_original: 3,
    enunciado: 'Pregunta siguiente.',
});

function createModalProps(overrides = {}) {
    return {
        preguntaId: currentQuestion.id,
        preguntas: [previousQuestion, currentQuestion, nextQuestion],
        preguntasNavegacion: [previousQuestion, currentQuestion, nextQuestion],
        cuestionarioNombre: 'INAP - AUX - 2025',
        onNavegar: vi.fn(),
        onCerrar: vi.fn(),
        onGuardarEdicion: vi.fn(),
        onFiltrarMateria: vi.fn(),
        onFiltrarBloque: vi.fn(),
        onFiltrarTema: vi.fn(),
        onFiltrarAplicacion: vi.fn(),
        onFiltrarAño: vi.fn(),
        onFiltrarEscala: vi.fn(),
        onFiltrarAcceso: vi.fn(),
        onFiltrarEjercicio: vi.fn(),
        ...overrides,
    };
}

function renderModal(overrides = {}) {
    const props = createModalProps(overrides);

    render(<ModalPregunta {...props} />);

    return props;
}

describe('ModalPregunta', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
    });

    it('renderiza el detalle de la pregunta sin depender de la tabla expandible', () => {
        renderModal();

        expect(screen.getByRole('dialog', { name: /detalle de la pregunta/i })).toBeInTheDocument();
        expect(screen.getByText('INAP - AUX - 2025')).toBeInTheDocument();
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
        expect(screen.getByText(/Pregunta modal sobre seguridad/)).toBeInTheDocument();
        expect(screen.getByText('Primera observacion.')).toBeInTheDocument();
        expect(screen.getByText('Segunda observacion.')).toBeInTheDocument();
        expect(screen.getByTestId('question-option-A')).toHaveAttribute('data-correct', 'true');
    });

    it('cierra desde el fondo y desde el boton de cierre, pero no desde el contenido', () => {
        const props = renderModal();

        fireEvent.click(screen.getByRole('dialog', { name: /detalle de la pregunta/i }));
        expect(props.onCerrar).not.toHaveBeenCalled();

        fireEvent.click(screen.getByTestId('question-modal-overlay'));
        expect(props.onCerrar).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByLabelText('Cerrar detalle de la pregunta'));
        expect(props.onCerrar).toHaveBeenCalledTimes(2);
    });

    it('navega con los botones laterales y con las flechas del teclado', () => {
        const props = renderModal();

        fireEvent.click(screen.getByLabelText('Pregunta anterior'));
        fireEvent.click(screen.getByLabelText('Pregunta siguiente'));
        fireEvent.keyDown(window, { key: 'ArrowLeft' });
        fireEvent.keyDown(window, { key: 'ArrowRight' });

        expect(props.onNavegar).toHaveBeenNthCalledWith(1, previousQuestion.id);
        expect(props.onNavegar).toHaveBeenNthCalledWith(2, nextQuestion.id);
        expect(props.onNavegar).toHaveBeenNthCalledWith(3, previousQuestion.id);
        expect(props.onNavegar).toHaveBeenNthCalledWith(4, nextQuestion.id);
    });

    it('copia el contenido completo de la pregunta al portapapeles', async () => {
        renderModal();

        fireEvent.click(screen.getByText('Copiar'));

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
        });

        const copiedText = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];

        expect(copiedText).toContain('2. Pregunta modal sobre seguridad de la informacion.');
        expect(copiedText).toContain(`A) ${currentQuestion.opciones.A}`);
        expect(copiedText).toContain(`D) ${currentQuestion.opciones.D}`);
        expect(copiedText).toContain('Respuesta correcta: A');
    });

    it('edita y guarda los cambios desde el detalle embebido del modal', () => {
        const props = renderModal();

        fireEvent.click(screen.getByText('Editar'));
        fireEvent.change(screen.getByLabelText('Enunciado de la pregunta'), {
            target: { value: 'Nuevo enunciado modal.' },
        });
        fireEvent.change(screen.getByLabelText('Observaciones de la pregunta'), {
            target: { value: 'Observacion revisada.' },
        });
        fireEvent.change(screen.getByDisplayValue('informática'), {
            target: { value: 'seguridad' },
        });
        fireEvent.change(screen.getByDisplayValue('software'), {
            target: { value: 'normativa' },
        });
        const windowsInputs = screen.getAllByDisplayValue('Windows');
        fireEvent.change(windowsInputs[0], {
            target: { value: 'ISO 27000' },
        });
        fireEvent.change(windowsInputs[1], {
            target: { value: 'Seguridad' },
        });
        fireEvent.change(screen.getByDisplayValue('A'), {
            target: { value: 'C' },
        });
        fireEvent.click(screen.getByText('Guardar'));

        expect(props.onGuardarEdicion).toHaveBeenCalledWith(currentQuestion.id, {
            materia: 'seguridad',
            bloque: 'normativa',
            tema: 'ISO 27000',
            aplicacion: 'Seguridad',
            correcta: 'C',
            enunciado: 'Nuevo enunciado modal.',
            observaciones: 'Observacion revisada.',
        });
    });

    it('mantiene los filtros de metadatos en modo lectura', () => {
        const props = renderModal();

        fireEvent.click(screen.getByText('Auxiliar administrativo'));
        fireEvent.click(screen.getByText('2025'));
        fireEvent.click(screen.getByText('Libre'));
        fireEvent.click(screen.getByText('Único'));
        fireEvent.click(screen.getByText('informática'));
        fireEvent.click(screen.getByText('software'));
        const windowsFields = screen.getAllByText('Windows');
        fireEvent.click(windowsFields[0]);
        fireEvent.click(windowsFields[1]);

        expect(props.onFiltrarEscala).toHaveBeenCalledWith('AUX');
        expect(props.onFiltrarAño).toHaveBeenCalledWith('2025');
        expect(props.onFiltrarAcceso).toHaveBeenCalledWith('LI');
        expect(props.onFiltrarEjercicio).toHaveBeenCalledWith('UNI');
        expect(props.onFiltrarMateria).toHaveBeenCalledWith('informática');
        expect(props.onFiltrarBloque).toHaveBeenCalledWith('software');
        expect(props.onFiltrarTema).toHaveBeenCalledWith('Windows');
        expect(props.onFiltrarAplicacion).toHaveBeenCalledWith('Windows');
    });
});
