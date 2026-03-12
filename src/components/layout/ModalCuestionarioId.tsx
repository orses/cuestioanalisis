import React from 'react';
import type { CuestionarioMeta } from '../../types';

interface ModalCuestionarioIdProps {
    archivosEnEspera: { file: File; idCuestionario: string }[];
    catalogo: CuestionarioMeta[];
    onCambiarId: (index: number, id: string) => void;
    onConfirmar: () => void;
    onCancelar: () => void;
}

export const ModalCuestionarioId: React.FC<ModalCuestionarioIdProps> = ({
    archivosEnEspera, catalogo, onCambiarId, onConfirmar, onCancelar,
}) => {
    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
            <div
                className="bg-card w-full max-w-lg rounded-xl shadow-2xl border p-6"
                style={{ borderColor: 'var(--border-secondary)' }}
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-heading mb-2">Asignar identificador de cuestionario</h3>
                <p className="text-sm text-muted mb-4">
                    Los siguientes archivos no contienen la columna <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-tertiary)' }}>id_cuestionario</code>. Es necesario indicar el identificador de cada uno.
                </p>
                <div className="space-y-3 mb-6">
                    {archivosEnEspera.map((a, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="text-sm text-body truncate min-w-0 flex-1">{a.file.name}</span>
                            {catalogo.length > 0 ? (
                                <select
                                    value={a.idCuestionario}
                                    onChange={e => onCambiarId(i, e.target.value)}
                                    className="px-3 py-2 text-sm border rounded-lg bg-card text-body"
                                    style={{ borderColor: 'var(--border-primary)', minWidth: '160px' }}
                                >
                                    <option value="">Seleccionar…</option>
                                    {catalogo.map(c => (
                                        <option key={c.id_cuestionario} value={c.id_cuestionario}>
                                            {c.id_cuestionario} — {c.cuestionario}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Ej: C0001"
                                    value={a.idCuestionario}
                                    onChange={e => onCambiarId(i, e.target.value)}
                                    className="px-3 py-2 text-sm border rounded-lg bg-card text-body"
                                    style={{ borderColor: 'var(--border-primary)', width: '160px' }}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancelar}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-muted text-body hover:bg-hover-custom transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirmar}
                        disabled={archivosEnEspera.some(a => a.idCuestionario.trim() === '')}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                        Procesar
                    </button>
                </div>
            </div>
        </div>
    );
};
