/**
 * Colores centralizados por materia.
 * Antes estaban duplicados en Resumen.tsx y TablaPreguntas.tsx.
 */

const MATERIA_COLORES: Record<string, string> = {
    'informática': '#2563eb',
    'seguridad': '#dc2626',
    'administración electrónica': '#0891b2',
    'legislación': '#7c3aed',
    'psicotécnico': '#c026d3',
    'comunicación': '#059669',
    'varia': '#64748b',
};

export function getMateriaColor(materia: string): string {
    return MATERIA_COLORES[materia.toLowerCase()] ?? '#64748b';
}
