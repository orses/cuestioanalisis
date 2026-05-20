export const SCALE_CODES: ReadonlySet<string> = new Set(['AUX', 'ADV', 'PSX']);
export const CALL_TYPE_CODES: ReadonlySet<string> = new Set(['ES', 'BT']);
export const ACCESS_CODES: ReadonlySet<string> = new Set(['LI', 'PI', 'PC', 'PV']);
export const QUOTA_CODES: ReadonlySet<string> = new Set(['GE', 'DI']);
export const EXERCISE_TYPE_CODES: ReadonlySet<string> = new Set(['PRI', 'SEG', 'TER', 'UNI', 'ESP']);
export const MODEL_CODES: ReadonlySet<string> = new Set(['A', 'B']);

const SCALE_LABELS_FULL: Record<string, string> = {
    AUX: 'Auxiliar administrativo',
    ADV: 'Administrativo',
    PSX: 'Personal de Servicios Generales',
};

const SCALE_LABELS_SHORT: Record<string, string> = {
    AUX: 'Auxiliar',
    ADV: 'Administrativo',
    PSX: 'Servicios Grales.',
};

const ACCESS_LABELS_FULL: Record<string, string> = {
    LI: 'Libre',
    PI: 'Promoción interna',
    PC: 'Promoción cruzada',
    PV: 'Promoción vertical',
};

const ACCESS_LABELS_SHORT: Record<string, string> = {
    LI: 'Libre',
    PI: 'Prom. int.',
    PC: 'Prom. cruz.',
    PV: 'Prom. vert.',
};

const CALL_TYPE_LABELS_FULL: Record<string, string> = {
    ES: 'Estabilización',
    BT: 'Bolsa de trabajo',
};

const CALL_TYPE_LABELS_SHORT: Record<string, string> = {
    ES: 'Estabilización',
    BT: 'Bolsa trab.',
};

const QUOTA_LABELS: Record<string, string> = {
    GE: 'General',
    DI: 'Discapacidad',
};

const EXERCISE_TYPE_LABELS: Record<string, string> = {
    PRI: 'Primero',
    SEG: 'Segundo',
    TER: 'Tercero',
    UNI: 'Único',
    ESP: 'Específico',
};

export function formatScaleLabel(value: string, mode: 'full' | 'short' = 'full'): string {
    const labels = mode === 'short' ? SCALE_LABELS_SHORT : SCALE_LABELS_FULL;
    return labels[value] || value || '—';
}

export function formatAccessLabel(value: string, mode: 'full' | 'short' = 'full'): string {
    const labels = mode === 'short' ? ACCESS_LABELS_SHORT : ACCESS_LABELS_FULL;
    return labels[value] || value || '—';
}

export function formatCallTypeLabel(value: string, mode: 'full' | 'short' = 'full'): string {
    const labels = mode === 'short' ? CALL_TYPE_LABELS_SHORT : CALL_TYPE_LABELS_FULL;
    return labels[value] || value || '—';
}

export function formatQuotaLabel(value: string): string {
    return QUOTA_LABELS[value] || value || '—';
}

export function formatExerciseTypeLabel(value: string): string {
    return EXERCISE_TYPE_LABELS[value] || value || '—';
}

export function formatModelLabel(value: string): string {
    return value ? value.toUpperCase() : '—';
}

export function formatVariantLabel(value: string): string {
    return value
        .replace(/\bEXT\b/g, 'Extraordinario')
        .replace(/_/g, ' ')
        .trim();
}
