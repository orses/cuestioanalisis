import { describe, expect, it } from 'vitest';
import { splitObservationParagraphs } from '../../src/utils/observations';

describe('splitObservationParagraphs', () => {
    it('conserva el orden y elimina líneas vacías', () => {
        expect(splitObservationParagraphs('Primero.\n\nSegundo.\r\n  Tercero.  ')).toEqual([
            'Primero.',
            'Segundo.',
            'Tercero.',
        ]);
    });

    it('devuelve una lista vacía cuando no hay texto útil', () => {
        expect(splitObservationParagraphs(' \n\t\r\n ')).toEqual([]);
    });

    it('no divide textos sin saltos de línea', () => {
        expect(splitObservationParagraphs('Una única observación.')).toEqual(['Una única observación.']);
    });
});

