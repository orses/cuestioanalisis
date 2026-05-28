import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlsProps {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
    pageSizeOptions: readonly number[];
    startIndex: number;
    endIndex: number;
    itemLabel: string;
    onPageChange: (page: number | ((currentPage: number) => number)) => void;
    onPageSizeChange: (pageSize: number) => void;
}

export function PaginationControls({
    totalItems,
    currentPage,
    totalPages,
    pageSize,
    pageSizeOptions,
    startIndex,
    endIndex,
    itemLabel,
    onPageChange,
    onPageSizeChange,
}: PaginationControlsProps) {
    const firstVisible = totalItems === 0 ? 0 : startIndex + 1;
    const isFirstPage = currentPage <= 1;
    const isLastPage = currentPage >= totalPages;
    const normalizedPageSizeOptions = Array.from(new Set([...pageSizeOptions, pageSize])).sort((a, b) => a - b);

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
            <div className="font-medium text-muted">
                {totalItems === 0
                    ? `Sin ${itemLabel}`
                    : `Mostrando ${firstVisible}-${endIndex} de ${totalItems} ${itemLabel}`}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                    <span>Filas</span>
                    <select
                        aria-label="Filas por página"
                        className="rounded border bg-card px-2 py-1 text-xs text-body"
                        style={{ borderColor: 'var(--border-primary)' }}
                        value={pageSize}
                        onChange={event => onPageSizeChange(Number(event.target.value))}
                    >
                        {normalizedPageSizeOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </label>

                <span className="min-w-[92px] text-center text-xs font-semibold text-muted">
                    Página {currentPage} de {totalPages}
                </span>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        aria-label="Primera página"
                        disabled={isFirstPage}
                        onClick={() => onPageChange(1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border bg-card text-body transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ borderColor: 'var(--border-primary)' }}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Página anterior"
                        disabled={isFirstPage}
                        onClick={() => onPageChange(page => page - 1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border bg-card text-body transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ borderColor: 'var(--border-primary)' }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Página siguiente"
                        disabled={isLastPage}
                        onClick={() => onPageChange(page => page + 1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border bg-card text-body transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ borderColor: 'var(--border-primary)' }}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Última página"
                        disabled={isLastPage}
                        onClick={() => onPageChange(totalPages)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border bg-card text-body transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ borderColor: 'var(--border-primary)' }}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
