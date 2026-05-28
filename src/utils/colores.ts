/**
 * Colores centralizados por materia.
 * Antes estaban duplicados en Resumen.tsx y TablaPreguntas.tsx.
 */

export const SUBJECT_COLORS: Record<string, string> = {
    'informática': '#2563eb',
    'seguridad': '#7c3aed',
    'administración electrónica': '#0891b2',
    'legislación': '#4f46e5',
    'psicotécnico': '#9333ea',
    'comunicación': '#0284c7',
    'varia': '#64748b',
};

export function getMateriaColor(materia: string): string {
    return SUBJECT_COLORS[materia.toLowerCase()] ?? '#64748b';
}
