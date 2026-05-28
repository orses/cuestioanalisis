import { describe, expect, it } from 'vitest';
import {
    formatAccessLabel,
    formatCallTypeLabel,
    formatExerciseTypeLabel,
    formatModelLabel,
    formatQuotaLabel,
    formatScaleLabel,
    formatVariantLabel,
} from '../../src/utils/metadata';

describe('metadata formatters', () => {
    it('formatea códigos conocidos en etiquetas de usuario', () => {
        expect(formatScaleLabel('AUX')).toBe('Auxiliar administrativo');
        expect(formatScaleLabel('ADV', 'short')).toBe('Administrativo');
        expect(formatAccessLabel('PI')).toBe('Promoción interna');
        expect(formatCallTypeLabel('BT', 'short')).toBe('Bolsa trab.');
        expect(formatQuotaLabel('DI')).toBe('Discapacidad');
        expect(formatExerciseTypeLabel('UNI')).toBe('Único');
        expect(formatModelLabel('a')).toBe('A');
        expect(formatVariantLabel('EXT_BIB')).toBe('Extraordinario BIB');
    });

    it('mantiene valores desconocidos y usa raya cuando no hay dato', () => {
        expect(formatScaleLabel('XYZ')).toBe('XYZ');
        expect(formatAccessLabel('')).toBe('—');
        expect(formatExerciseTypeLabel('')).toBe('—');
        expect(formatModelLabel('')).toBe('—');
    });
});

