import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useFiltros } from '../../src/hooks/useFiltros';
import { createCatalogItem, createQuestion } from '../fixtures/questions';

describe('useFiltros', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('filtra por materia, bloque y tema', () => {
        const preguntas = [
            createQuestion({ id: 'p1', materia: 'informática', bloque: 'software', tema: 'Windows' }),
            createQuestion({ id: 'p2', materia: 'informática', bloque: 'hardware', tema: 'CPU' }),
            createQuestion({ id: 'p3', materia: 'seguridad', bloque: 'normativa', tema: 'ISO' }),
        ];

        const { result } = renderHook(() => useFiltros({
            preguntasEditadas: preguntas,
            catalogoFiltrado: [],
            hayFiltrosCatalogo: false,
        }));

        act(() => result.current.setMaterias(['informática']));
        act(() => result.current.setBloques(['software']));
        act(() => result.current.setTemas(['Windows']));

        expect(result.current.preguntasFiltradas.map(p => p.id)).toEqual(['p1']);
        expect(result.current.hayFiltrosActivos).toBe(true);
    });

    it('reinicia filtros dependientes al cambiar materia o bloque', () => {
        const { result } = renderHook(() => useFiltros({
            preguntasEditadas: [createQuestion()],
            catalogoFiltrado: [],
            hayFiltrosCatalogo: false,
        }));

        act(() => {
            result.current.setBloques(['software']);
            result.current.setTemas(['Windows']);
            result.current.setAplicaciones(['Word']);
        });

        act(() => result.current.setMaterias(['informática']));

        expect(result.current.state.bloques).toEqual([]);
        expect(result.current.state.temas).toEqual([]);
        expect(result.current.state.aplicaciones).toEqual([]);

        act(() => {
            result.current.setBloques(['software']);
            result.current.setTemas(['Windows']);
        });

        act(() => result.current.setBloques(['hardware']));

        expect(result.current.state.bloques).toEqual(['hardware']);
        expect(result.current.state.temas).toEqual([]);
    });

    it('aplica búsqueda lógica con negación', () => {
        const preguntas = [
            createQuestion({ id: 'p1', enunciado: 'Windows permite administrar archivos.' }),
            createQuestion({ id: 'p2', enunciado: 'Windows y Excel aparecen en la misma pregunta.' }),
            createQuestion({ id: 'p3', tema: 'Linux', enunciado: 'Linux usa permisos de archivo.' }),
        ];

        const { result } = renderHook(() => useFiltros({
            preguntasEditadas: preguntas,
            catalogoFiltrado: [],
            hayFiltrosCatalogo: false,
        }));

        act(() => result.current.setBusqueda('windows NO excel'));

        expect(result.current.preguntasFiltradas.map(p => p.id)).toEqual(['p1']);
    });

    it('interseca preguntas con el catálogo filtrado cuando hay filtros de catálogo activos', () => {
        const preguntas = [
            createQuestion({ id: 'p1', id_cuestionario: 'Q1' }),
            createQuestion({ id: 'p2', id_cuestionario: 'Q2' }),
        ];

        const { result } = renderHook(() => useFiltros({
            preguntasEditadas: preguntas,
            catalogoFiltrado: [createCatalogItem({ id_cuestionario: 'Q2' })],
            hayFiltrosCatalogo: true,
        }));

        expect(result.current.preguntasFiltradas.map(p => p.id)).toEqual(['p2']);
        expect(result.current.hayFiltrosActivos).toBe(true);
    });

    it('persiste y restaura filtros generales desde localStorage', () => {
        localStorage.setItem('filtrosGenerales', JSON.stringify({
            materias: ['informática'],
            bloques: [],
            temas: [],
            aplicaciones: [],
            correctas: [],
            anulada: [],
            años: [],
            organismos: [],
            escalas: [],
            accesos: [],
            ejercicios: [],
            cuestionarios: [],
            busqueda: 'windows',
        }));

        const { result } = renderHook(() => useFiltros({
            preguntasEditadas: [
                createQuestion({ id: 'p1', materia: 'informática', enunciado: 'Windows 11' }),
                createQuestion({ id: 'p2', materia: 'seguridad', enunciado: 'ISO 27001' }),
            ],
            catalogoFiltrado: [],
            hayFiltrosCatalogo: false,
        }));

        expect(result.current.state.materias).toEqual(['informática']);
        expect(result.current.state.busqueda).toBe('windows');
        expect(result.current.preguntasFiltradas.map(p => p.id)).toEqual(['p1']);
    });
});
