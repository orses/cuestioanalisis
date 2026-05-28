import { describe, expect, it } from 'vitest';
import {
    ANSWER_DISTRIBUTION_COLORS,
    buildCategoricalColorMap,
    COMPARISON_GROUP_COLORS,
    COMPARISON_SERIES_COLORS,
    SUMMARY_ANSWER_COLORS,
} from '../../src/utils/colorPalettes';
import { SUBJECT_COLORS, getMateriaColor } from '../../src/utils/colores';

function hexToHsl(hex: string) {
    const normalized = hex.replace('#', '');
    const r = parseInt(normalized.slice(0, 2), 16) / 255;
    const g = parseInt(normalized.slice(2, 4), 16) / 255;
    const b = parseInt(normalized.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;

    if (max === min) {
        return { hue: 0, saturation: 0, lightness };
    }

    const delta = max - min;
    const saturation = lightness > 0.5
        ? delta / (2 - max - min)
        : delta / (max + min);
    let hue = 0;

    if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
    if (max === g) hue = ((b - r) / delta + 2) * 60;
    if (max === b) hue = ((r - g) / delta + 4) * 60;

    return { hue, saturation, lightness };
}

function expectNoReservedSemanticColors(colors: string[]) {
    for (const color of colors) {
        const { hue, saturation } = hexToHsl(color);
        const isGray = saturation < 0.12;
        const isRed = hue <= 20 || hue >= 345;
        const isYellow = hue >= 40 && hue <= 70;
        const isGreen = hue >= 80 && hue <= 165;

        expect(
            isGray || (!isRed && !isYellow && !isGreen),
            `${color} no debe ocupar rangos reservados para estados semánticos`
        ).toBe(true);
    }
}

describe('paletas de color categóricas', () => {
    it('no usa rojo, verde ni amarillo para materias', () => {
        const subjectColors = Object.values(SUBJECT_COLORS);

        expect(getMateriaColor('seguridad')).toBe('#7c3aed');
        expectNoReservedSemanticColors(subjectColors);
    });

    it('no usa rojo, verde ni amarillo en las series de comparativa', () => {
        expectNoReservedSemanticColors([
            ...COMPARISON_SERIES_COLORS,
            ...COMPARISON_GROUP_COLORS,
            ...Object.values(ANSWER_DISTRIBUTION_COLORS),
        ]);
    });

    it('no usa rojo, verde ni amarillo para respuestas categóricas del resumen', () => {
        expectNoReservedSemanticColors(Object.values(SUMMARY_ANSWER_COLORS));
    });

    it('asigna un único color por categoría y no consume paleta en repetidos', () => {
        const colorMap = buildCategoricalColorMap(['INAP', 'SERGAS', 'INAP', '  JCCM  '], ['#111111', '#222222', '#333333']);

        expect(colorMap.size).toBe(3);
        expect(colorMap.get('INAP')).toBe('#111111');
        expect(colorMap.get('SERGAS')).toBe('#222222');
        expect(colorMap.get('JCCM')).toBe('#333333');
    });
});
