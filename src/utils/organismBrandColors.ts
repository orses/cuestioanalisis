import { buildCategoricalColorMap, COMPARISON_GROUP_COLORS } from './colorPalettes';

type BrandColorRecord = {
    color: string;
    confidence: 'official-value' | 'official-pantone' | 'official-logo';
    note: string;
};

const ORGANISM_BRAND_COLOR_RECORDS: Record<string, BrandColorRecord> = {
    INAP: {
        color: '#F2C300',
        confidence: 'official-logo',
        note: 'Amarillo tomado del logotipo institucional del INAP; la página oficial no publica equivalencia HEX.',
    },
    XUNTA: {
        color: '#007BC4',
        confidence: 'official-value',
        note: 'Azul Xunta de Galicia, Pantone 7461 C.',
    },
    SERGAS: {
        color: '#007BC4',
        confidence: 'official-value',
        note: 'Arquitectura de marca de la Xunta aplicada al Servizo Galego de Saúde.',
    },
    UDC: {
        color: '#C3267D',
        confidence: 'official-value',
        note: 'Fucsia UDC, Pantone 233 CVC.',
    },
    JCCM: {
        color: '#E51A4C',
        confidence: 'official-value',
        note: 'Rojo carmesí de la marca Castilla-La Mancha, Pantone 1925 C.',
    },
    SESCAM: {
        color: '#012169',
        confidence: 'official-pantone',
        note: 'Azul Pantone 280 de la versión a una tinta del manual SESCAM.',
    },
    JEXT: {
        color: '#00A651',
        confidence: 'official-pantone',
        note: 'Verde Pantone 354 de la Junta de Extremadura.',
    },
    ARAGON: {
        color: '#FCE100',
        confidence: 'official-value',
        note: 'Amarillo corporativo del Gobierno de Aragón, Pantone 109.',
    },
    NAVARRA: {
        color: '#DA291C',
        confidence: 'official-pantone',
        note: 'Rojo Pantone 485 del símbolo oficial del Gobierno de Navarra.',
    },
    CAM: {
        color: '#FF0000',
        confidence: 'official-value',
        note: 'Rojo corporativo de la Comunidad de Madrid, Pantone 032.',
    },
    UCM: {
        color: '#000000',
        confidence: 'official-value',
        note: 'Logotipo oficial de la Universidad Complutense de Madrid en negro 100%.',
    },
    'AYTO AVILA': {
        color: '#B21F2D',
        confidence: 'official-logo',
        note: 'Color aproximado desde la imagen institucional del Ayuntamiento de Ávila; la página oficial remite a PDF de colores.',
    },
};

export const ORGANISM_BRAND_COLORS = Object.fromEntries(
    Object.entries(ORGANISM_BRAND_COLOR_RECORDS).map(([organism, record]) => [organism, record.color])
) as Record<string, string>;

export function normalizeOrganismKey(organism: string): string {
    return organism
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/\bAYUNTAMIENTO\b/g, 'AYTO')
        .replace(/\b(DE LA|DE LAS|DE LOS|DEL|DE)\b/g, ' ')
        .replace(/[^A-Z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function getOrganismBrandColor(organism: string): string | undefined {
    return ORGANISM_BRAND_COLOR_RECORDS[normalizeOrganismKey(organism)]?.color;
}

export function getOrganismBrandColorRecord(organism: string): BrandColorRecord | undefined {
    return ORGANISM_BRAND_COLOR_RECORDS[normalizeOrganismKey(organism)];
}

export function buildOrganismBrandColorMap(
    organisms: string[],
    fallbackPalette: readonly string[] = COMPARISON_GROUP_COLORS
): Map<string, string> {
    const uniqueOrganisms: string[] = [];
    const seen = new Set<string>();

    for (const organism of organisms) {
        const displayValue = organism.trim();
        const key = normalizeOrganismKey(displayValue);
        if (!displayValue || seen.has(key)) continue;
        seen.add(key);
        uniqueOrganisms.push(displayValue);
    }

    const unknownOrganisms = uniqueOrganisms.filter(organism => !getOrganismBrandColor(organism));
    const fallbackMap = buildCategoricalColorMap(unknownOrganisms, fallbackPalette);
    const colorMap = new Map<string, string>();

    for (const organism of uniqueOrganisms) {
        colorMap.set(organism, getOrganismBrandColor(organism) ?? fallbackMap.get(organism) ?? 'var(--border-primary)');
    }

    return colorMap;
}
