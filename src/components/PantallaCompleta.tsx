import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface PantallaCompletaProps {
    children: React.ReactNode;
    titulo?: string;
}

/**
 * Envuelve un contenido y ofrece un botón para expandirlo
 * a pantalla completa usando la Fullscreen API del navegador.
 */
export const PantallaCompleta: React.FC<PantallaCompletaProps> = ({ children, titulo }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = useCallback(async () => {
        if (!containerRef.current) return;
        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch {
            // Fullscreen no soportado
        }
    }, []);

    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                backgroundColor: isFullscreen ? 'var(--bg-primary)' : undefined,
                padding: isFullscreen ? '24px' : undefined,
                overflow: isFullscreen ? 'auto' : undefined,
            }}
        >
            <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                style={{
                    position: 'absolute', top: isFullscreen ? '16px' : '8px', right: isFullscreen ? '16px' : '8px',
                    zIndex: 20, padding: '6px', borderRadius: '6px',
                    border: '1px solid var(--border-secondary)', cursor: 'pointer',
                    backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0.7, transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
            >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {isFullscreen && titulo && (
                <h2 style={{
                    fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)',
                    marginBottom: '16px', marginTop: '4px',
                }}>{titulo}</h2>
            )}
            {children}
        </div>
    );
};
