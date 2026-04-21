import React, { useState, useRef } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
    texto: string;
    size?: number;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ texto, size = 14 }) => {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    return (
        <span
            ref={ref}
            className="relative inline-flex items-center cursor-help"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onFocus={() => setVisible(true)}
            onBlur={() => setVisible(false)}
            tabIndex={0}
            role="button"
            aria-label="Información"
        >
            <Info style={{ width: size, height: size, color: 'currentColor', opacity: 0.75 }} />
            {visible && (
                <span
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-normal leading-relaxed shadow-lg pointer-events-none"
                    style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-primary)',
                        minWidth: '220px',
                        maxWidth: '340px',
                        whiteSpace: 'normal',
                        textAlign: 'left',
                    }}
                >
                    {texto}
                </span>
            )}
        </span>
    );
};
