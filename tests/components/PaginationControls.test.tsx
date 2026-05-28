import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PaginationControls } from '../../src/components/common/PaginationControls';

function renderControls(overrides = {}) {
    const props = {
        totalItems: 120,
        currentPage: 1,
        totalPages: 2,
        pageSize: 100,
        pageSizeOptions: [50, 100, 250],
        startIndex: 0,
        endIndex: 100,
        itemLabel: 'registros',
        onPageChange: vi.fn(),
        onPageSizeChange: vi.fn(),
        ...overrides,
    };

    render(<PaginationControls {...props} />);

    return props;
}

describe('PaginationControls', () => {
    it('muestra el rango visible y desactiva acciones imposibles', () => {
        renderControls();

        expect(screen.getByText('Mostrando 1-100 de 120 registros')).toBeInTheDocument();
        expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
        expect(screen.getByLabelText('Primera página')).toBeDisabled();
        expect(screen.getByLabelText('Página anterior')).toBeDisabled();
        expect(screen.getByLabelText('Página siguiente')).toBeEnabled();
        expect(screen.getByLabelText('Última página')).toBeEnabled();
    });

    it('propaga navegacion y cambio de tamaño de pagina', () => {
        const props = renderControls();

        fireEvent.click(screen.getByLabelText('Página siguiente'));
        fireEvent.click(screen.getByLabelText('Última página'));
        fireEvent.change(screen.getByLabelText('Filas por página'), { target: { value: '50' } });

        const nextUpdater = props.onPageChange.mock.calls[0][0] as (page: number) => number;
        expect(nextUpdater(1)).toBe(2);
        expect(props.onPageChange).toHaveBeenNthCalledWith(2, 2);
        expect(props.onPageSizeChange).toHaveBeenCalledWith(50);
    });
});
