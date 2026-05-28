import { describe, expect, it } from 'vitest';
import {
    buildOrganismBrandColorMap,
    getOrganismBrandColor,
    getOrganismBrandColorRecord,
    normalizeOrganismKey,
    ORGANISM_BRAND_COLORS,
} from '../../src/utils/organismBrandColors';

describe('colores corporativos por organismo', () => {
    it('normaliza abreviaturas, acentos y separadores antes de buscar el color', () => {
        expect(normalizeOrganismKey('Ayuntamiento de Ávila')).toBe('AYTO AVILA');
        expect(getOrganismBrandColor('Aragón')).toBe(ORGANISM_BRAND_COLORS.ARAGON);
        expect(getOrganismBrandColor('ayuntamiento de ávila')).toBe(ORGANISM_BRAND_COLORS['AYTO AVILA']);
    });

    it('usa colores corporativos verificados para los organismos principales', () => {
        expect(getOrganismBrandColor('INAP')).toBe('#F2C300');
        expect(getOrganismBrandColor('XUNTA')).toBe('#007BC4');
        expect(getOrganismBrandColor('UDC')).toBe('#C3267D');
        expect(getOrganismBrandColor('JCCM')).toBe('#E51A4C');
        expect(getOrganismBrandColor('SESCAM')).toBe('#012169');
        expect(getOrganismBrandColor('CAM')).toBe('#FF0000');
    });

    it('distingue el grado de confianza del color aplicado', () => {
        expect(getOrganismBrandColorRecord('XUNTA')?.confidence).toBe('official-value');
        expect(getOrganismBrandColorRecord('SESCAM')?.confidence).toBe('official-pantone');
        expect(getOrganismBrandColorRecord('INAP')?.confidence).toBe('official-logo');
    });

    it('prioriza marca corporativa y mantiene fallback estable para organismos no documentados', () => {
        const colorMap = buildOrganismBrandColorMap(['INAP', 'Organismo Nuevo', 'UDC', 'Organismo Nuevo'], ['#111111']);

        expect(colorMap.get('INAP')).toBe('#F2C300');
        expect(colorMap.get('UDC')).toBe('#C3267D');
        expect(colorMap.get('Organismo Nuevo')).toBe('#111111');
        expect(colorMap.size).toBe(3);
    });
});
