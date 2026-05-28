import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePaginatedRows } from '../../src/hooks/usePaginatedRows';

function createItems(total: number) {
    return Array.from({ length: total }, (_, index) => index + 1);
}

describe('usePaginatedRows', () => {
    it('devuelve la primera pagina con el tamaño por defecto', () => {
        const { result } = renderHook(() => usePaginatedRows(createItems(251)));

        expect(result.current.rows).toHaveLength(100);
        expect(result.current.rows[0]).toBe(1);
        expect(result.current.rows[99]).toBe(100);
        expect(result.current.currentPage).toBe(1);
        expect(result.current.totalPages).toBe(3);
        expect(result.current.startIndex).toBe(0);
        expect(result.current.endIndex).toBe(100);
    });

    it('navega entre paginas y limita paginas fuera de rango', () => {
        const { result } = renderHook(() => usePaginatedRows(createItems(251)));

        act(() => result.current.setPage(3));

        expect(result.current.rows[0]).toBe(201);
        expect(result.current.rows).toHaveLength(51);
        expect(result.current.currentPage).toBe(3);

        act(() => result.current.setPage(99));

        expect(result.current.currentPage).toBe(3);

        act(() => result.current.setPage(page => page - 10));

        expect(result.current.currentPage).toBe(1);
    });

    it('reinicia la pagina al cambiar el tamaño de pagina', () => {
        const { result } = renderHook(() => usePaginatedRows(createItems(251)));

        act(() => result.current.setPage(3));
        act(() => result.current.setPageSize(50));

        expect(result.current.currentPage).toBe(1);
        expect(result.current.pageSize).toBe(50);
        expect(result.current.rows).toHaveLength(50);
        expect(result.current.totalPages).toBe(6);
    });

    it('muestra la primera pagina cuando cambia la referencia de datos', () => {
        const initialItems = createItems(220);
        const filteredItems = createItems(25);

        const { result, rerender } = renderHook(
            ({ items }) => usePaginatedRows(items),
            { initialProps: { items: initialItems } }
        );

        act(() => result.current.setPage(2));

        expect(result.current.currentPage).toBe(2);

        rerender({ items: filteredItems });

        expect(result.current.currentPage).toBe(1);
        expect(result.current.rows).toHaveLength(25);
        expect(result.current.totalPages).toBe(1);
    });
});
