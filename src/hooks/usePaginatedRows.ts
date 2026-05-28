import { useCallback, useMemo, useState } from 'react';

export const DEFAULT_TABLE_PAGE_SIZE = 100;
export const TABLE_PAGE_SIZE_OPTIONS = [50, 100, 250, 500] as const;

type PageUpdater = number | ((currentPage: number) => number);

interface PaginationOptions {
    defaultPageSize?: number;
    pageSizeOptions?: readonly number[];
}

interface PaginationInternalState {
    page: number;
    pageSize: number;
}

function clampPage(page: number, totalPages: number): number {
    if (!Number.isFinite(page)) return 1;
    return Math.min(totalPages, Math.max(1, Math.trunc(page)));
}

export function usePaginatedRows<T>(
    items: T[],
    options: PaginationOptions = {}
) {
    const defaultPageSize = options.defaultPageSize ?? DEFAULT_TABLE_PAGE_SIZE;
    const pageSizeOptions = options.pageSizeOptions ?? TABLE_PAGE_SIZE_OPTIONS;

    const [state, setState] = useState<PaginationInternalState>(() => ({
        page: 1,
        pageSize: defaultPageSize,
    }));

    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
    const currentPage = clampPage(state.page, totalPages);
    const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * state.pageSize;
    const endIndex = Math.min(startIndex + state.pageSize, totalItems);

    const rows = useMemo(
        () => items.slice(startIndex, endIndex),
        [items, startIndex, endIndex]
    );

    const setPage = useCallback((nextPage: PageUpdater) => {
        setState(previous => {
            const requestedPage = typeof nextPage === 'function'
                ? nextPage(previous.page)
                : nextPage;
            const nextTotalPages = Math.max(1, Math.ceil(items.length / previous.pageSize));

            return {
                ...previous,
                page: clampPage(requestedPage, nextTotalPages),
            };
        });
    }, [items]);

    const setPageSize = useCallback((nextPageSize: number) => {
        const safePageSize = Math.max(1, Math.trunc(nextPageSize));
        setState({
            page: 1,
            pageSize: safePageSize,
        });
    }, []);

    return {
        rows,
        totalItems,
        totalPages,
        currentPage,
        pageSize: state.pageSize,
        pageSizeOptions,
        startIndex,
        endIndex,
        setPage,
        setPageSize,
    };
}
