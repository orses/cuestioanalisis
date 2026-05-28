import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('contrato visual de radios', () => {
    it('fija un radio global de 3 px para la interfaz HTML y los rectángulos SVG', () => {
        const css = readFileSync(join(process.cwd(), 'src', 'index.css'), 'utf8');

        expect(css).toContain(':where(#root, #root *, #root *::before, #root *::after)');
        expect(css).toContain('border-radius: 3px !important;');
        expect(css).toContain(':where(#root svg rect)');
        expect(css).toContain('rx: 3px;');
        expect(css).toContain('ry: 3px;');
    });
});
