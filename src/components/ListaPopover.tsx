import React, { useEffect, useRef } from 'react';
import { X, ArrowRight } from 'lucide-react';

export interface ListaPopoverItem {
    label: string;
    count?: number;
    onClick?: () => void;
}

interface ListaPopoverProps {
    titulo: string;
    items: ListaPopoverItem[];
    onCerrar: () => void;
    onVerTodosEnTabla?: () => void;
    total?: number;
}

export const ListaPopover: React.FC<ListaPopoverProps> = ({
    titulo, items, onCerrar, onVerTodosEnTabla, total,
}) => {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCerrar();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onCerrar]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', paddingTop: '10vh' }}
            onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
        >
            <div
                ref={panelRef}
                className="bg-card rounded-xl border shadow-2xl w-full max-w-md flex flex-col"
                style={{ borderColor: 'var(--border-secondary)', maxHeight: '80vh' }}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                    <div>
                        <h3 className="text-base font-bold text-heading">{titulo}</h3>
                        {total !== undefined && (
                            <p className="text-xs text-muted mt-0.5">{total} {total === 1 ? 'elemento' : 'elementos'}</p>
                        )}
                    </div>
                    <button
                        onClick={onCerrar}
                        className="p-1.5 rounded-lg text-muted hover:text-heading hover:bg-muted transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 py-2">
                    {items.length === 0 ? (
                        <p className="text-sm text-muted px-4 py-6 text-center">No hay elementos</p>
                    ) : (
                        <ul className="divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
                            {items.map((item, i) => (
                                <li key={`${item.label}-${i}`}>
                                    <button
                                        onClick={item.onClick}
                                        disabled={!item.onClick}
                                        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors disabled:cursor-default"
                                    >
                                        <span className="text-sm text-body truncate" title={item.label}>
                                            {item.label.charAt(0).toUpperCase() + item.label.slice(1)}
                                        </span>
                                        <span className="flex items-center gap-2 flex-shrink-0">
                                            {item.count !== undefined && (
                                                <span className="text-xs font-bold text-heading">{item.count}</span>
                                            )}
                                            {item.onClick && <ArrowRight className="w-3.5 h-3.5 text-muted" />}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {onVerTodosEnTabla && (
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                        <button
                            onClick={onVerTodosEnTabla}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                            style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                            Ver todos en tabla
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
