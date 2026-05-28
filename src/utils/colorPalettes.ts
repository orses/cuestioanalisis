export const COMPARISON_SERIES_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#be185d'] as const;

export const COMPARISON_GROUP_COLORS = [
    '#2563eb',
    '#7c3aed',
    '#0891b2',
    '#be185d',
    '#4f46e5',
    '#9333ea',
    '#0284c7',
    '#a21caf',
    '#475569',
    '#334155',
    '#0e7490',
    '#6d28d9',
] as const;

export const ANSWER_DISTRIBUTION_COLORS: Record<string, string> = {
    A: '#2563eb',
    B: '#7c3aed',
    C: '#0891b2',
    D: '#be185d',
};

export const SUMMARY_ANSWER_COLORS: Record<string, string> = {
    A: '#3b82f6',
    B: '#7c3aed',
    C: '#0891b2',
    D: '#9333ea',
};

export function buildCategoricalColorMap(values: string[], palette: readonly string[] = COMPARISON_GROUP_COLORS): Map<string, string> {
    const map = new Map<string, string>();
    const colors = palette.length > 0 ? palette : COMPARISON_GROUP_COLORS;
    let colorIndex = 0;

    for (const value of values) {
        const key = value.trim();
        if (!key || map.has(key)) continue;
        map.set(key, colors[colorIndex % colors.length]);
        colorIndex++;
    }

    return map;
}
