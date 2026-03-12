import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface MultiSelectProps {
    id: string;
    label: string;
    opciones: string[];
    seleccionadas: string[];
    onChange: (seleccionadas: string[]) => void;
    formatLabel?: (val: string) => string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ id, label, opciones, seleccionadas, onChange, formatLabel }) => {
    const [abierto, setAbierto] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggle = (val: string) => {
        if (seleccionadas.includes(val)) {
            onChange(seleccionadas.filter(v => v !== val));
        } else {
            onChange([...seleccionadas, val]);
        }
    };

    const limpiar = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    const fmt = formatLabel || ((v: string) => v.charAt(0).toUpperCase() + v.slice(1));

    return (
        <div ref={ref} className="relative">
            <label className={`block text-xs font-medium mb-1 ${seleccionadas.length > 0 ? 'font-bold' : 'text-muted'}`} style={seleccionadas.length > 0 ? { color: 'var(--accent-primary)' } : undefined}>{label}{seleccionadas.length > 0 && ` (${seleccionadas.length})`}</label>
            <button
                type="button"
                id={id}
                onClick={() => setAbierto(!abierto)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg bg-card ${seleccionadas.length > 0 ? 'font-semibold text-heading' : 'text-body'}`}
                style={{ borderColor: seleccionadas.length > 0 ? 'var(--accent-primary)' : 'var(--border-primary)', minHeight: '38px', boxShadow: seleccionadas.length > 0 ? '0 0 0 1px var(--accent-primary)' : undefined }}
            >
                <span className="truncate text-left flex-1">
                    {seleccionadas.length === 0
                        ? 'Todos'
                        : seleccionadas.length <= 2
                            ? seleccionadas.map(fmt).join(', ')
                            : `${seleccionadas.length} seleccionados`
                    }
                </span>
                <span className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {seleccionadas.length > 0 && (
                        <span onClick={limpiar} className="hover:text-heading transition-colors" title="Limpiar">
                            <X className="w-3.5 h-3.5" />
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
                </span>
            </button>
            {abierto && (
                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-card border rounded-lg shadow-lg"
                    style={{ borderColor: 'var(--border-primary)' }}>
                    {opciones.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted">Sin opciones</div>
                    )}
                    {opciones.map(op => (
                        <label key={op}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer text-sm text-body">
                            <input
                                type="checkbox"
                                checked={seleccionadas.includes(op)}
                                onChange={() => toggle(op)}
                                className="rounded"
                            />
                            <span className="truncate">{fmt(op)}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};
