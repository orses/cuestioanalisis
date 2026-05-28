import { describe, expect, it } from 'vitest';
import { detectarDuplicados, normalizar } from '../../src/utils/similarity';
import { createQuestion } from '../fixtures/questions';

describe('similarity', () => {
    it('normaliza tildes, puntuación y espacios', () => {
        expect(normalizar('  Gestión,   información y SEGURIDAD.  ')).toBe('gestion informacion y seguridad');
    });

    it('agrupa duplicados exactos ignorando diferencias superficiales', () => {
        const grupos = detectarDuplicados([
            createQuestion({ id: 'p1', enunciado: '¿Qué es un sistema de información?' }),
            createQuestion({ id: 'p2', enunciado: 'Que es un sistema de informacion' }),
            createQuestion({ id: 'p3', enunciado: 'Pregunta diferente sobre redes.' }),
        ]);

        expect(grupos).toHaveLength(1);
        expect(grupos[0].tipo).toBe('exacto');
        expect(grupos[0].preguntas.map(p => p.id)).toEqual(['p1', 'p2']);
    });

    it('agrupa preguntas similares cuando superan el umbral', () => {
        const grupos = detectarDuplicados([
            createQuestion({ id: 'p1', enunciado: 'La seguridad de la información protege confidencialidad integridad disponibilidad.' }),
            createQuestion({ id: 'p2', enunciado: 'La seguridad de información garantiza confidencialidad integridad y disponibilidad.' }),
            createQuestion({ id: 'p3', enunciado: 'La hoja de cálculo permite usar fórmulas.' }),
        ], 0.45);

        expect(grupos.some(grupo => grupo.tipo === 'similar' && grupo.preguntas.some(p => p.id === 'p1') && grupo.preguntas.some(p => p.id === 'p2'))).toBe(true);
    });
});

