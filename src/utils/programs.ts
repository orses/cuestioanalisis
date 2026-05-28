type ProgramValue = string | number | boolean | Date | null | undefined;

function valueToText(value: ProgramValue): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    return String(value);
}

function normalizeVisibleText(value: ProgramValue): string {
    const text = valueToText(value);
    if (!text) return '';
    return text
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[\u00AD\u200B-\u200F\u202A-\u202E\u2028-\u2029\u2060-\u2064\u206A-\u206F\uFEFF\uFFF9-\uFFFB]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeProgramKey(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function cleanProgramFragment(text: string): string {
    return text
        .replace(/\b\d{4}\b/g, '')
        .replace(/\b365\b/g, '')
        .replace(/\b\d{1,2}\b/g, '')
        .replace(/\bCl[áa]sico\b/gi, '')
        .replace(/[,;]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function collapseRepeatedWords(text: string): string {
    return text
        .split(' ')
        .filter((word, index, words) => index === 0 || normalizeProgramKey(word) !== normalizeProgramKey(words[index - 1]))
        .join(' ');
}

const PROGRAM_ALIASES: Record<string, string> = {
    palabra: 'Word',
    sobresalir: 'Excel',
    acceso: 'Access',
    perspectiva: 'Outlook',
    borde: 'Edge',
    escritor: 'Writer',
    calculo: 'Calc',
    ventanas: 'Windows',
};

function normalizeProgramAlias(text: string): string {
    return PROGRAM_ALIASES[normalizeProgramKey(text)] ?? text;
}

/**
 * Normaliza el nombre de un programa o aplicación eliminando versiones, años,
 * sufijos numéricos y variantes como «Clásico».
 */
export function normalizarPrograma(app: string): string {
    const text = normalizeVisibleText(app);
    if (!text) return '';

    const fragments = text
        .split(/\s*(?:[,;/|]+|\s+(?:y|e|and)\s+)\s*/i)
        .map(cleanProgramFragment)
        .filter(Boolean);
    const uniqueKeys = new Set(fragments.map(normalizeProgramKey));

    if (fragments.length > 1 && uniqueKeys.size === 1) {
        return normalizeProgramAlias(fragments[0]);
    }

    return normalizeProgramAlias(collapseRepeatedWords(cleanProgramFragment(text)));
}
