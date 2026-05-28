import { describe, expect, it } from 'vitest';
import { generarInformeMarkdown } from '../../src/utils/generarInforme';
import { createQuestion } from '../fixtures/questions';

describe('generarInformeMarkdown', () => {
    it('genera un informe con resumen, ejercicios y distribuciones principales', () => {
        const informe = generarInformeMarkdown([
            createQuestion({ id: 'p1', materia: 'informática', bloque: 'software', tema: 'Windows', aplicacion: 'Word 2019' }),
            createQuestion({ id: 'p2', materia: 'seguridad', bloque: 'normativa', tema: 'ISO', aplicacion: 'Excel 365', anulada: true }),
        ], 'dataset-prueba.csv');

        expect(informe).toContain('# Informe de Análisis — dataset-prueba.csv');
        expect(informe).toContain('## Resumen general');
        expect(informe).toContain('| Preguntas totales | 2 |');
        expect(informe).toContain('| Anuladas | 1 (50.0%) |');
        expect(informe).toContain('## Ejercicios');
        expect(informe).toContain('## Distribución por materia');
        expect(informe).toContain('| informática | 1 | 50.0% |');
        expect(informe).toContain('| seguridad | 1 | 50.0% |');
        expect(informe).toContain('## Radiografía de anulaciones');
    });

    it('marca explícitamente los informes generados sobre subconjuntos filtrados', () => {
        const informe = generarInformeMarkdown([
            createQuestion({ id: 'p1' }),
        ], 'dataset-filtrado.csv', { filtrado: true, totalSinFiltrar: 10 });

        expect(informe).toContain('Informe sobre subconjunto filtrado');
        expect(informe).toContain('1 de 10 preguntas');
    });
});

