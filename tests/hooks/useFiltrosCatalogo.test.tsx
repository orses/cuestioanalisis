import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useFiltrosCatalogo } from '../../src/hooks/useFiltrosCatalogo';
import { createCatalogItem } from '../fixtures/questions';

describe('useFiltrosCatalogo', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('filtra por versión, tipo, estado, sistema operativo y ofimática', () => {
        const catalogo = [
            createCatalogItem({ id_cuestionario: 'Q1', version: 'Windows 11', tipo: 'Test', estado: 'actualizado', version_sistema_operativo: 'Windows 11', paquete_ofimatico: 'Microsoft 365' }),
            createCatalogItem({ id_cuestionario: 'Q2', version: 'Windows 10', tipo: 'Caso práctico', estado: 'antiguo', version_sistema_operativo: 'Windows 10', paquete_ofimatico: 'LibreOffice' }),
        ];

        const { result } = renderHook(() => useFiltrosCatalogo(catalogo));

        act(() => {
            result.current.setVersiones(['Windows 11']);
            result.current.setTipos(['Test']);
            result.current.setEstados(['actualizado']);
            result.current.setSo(['Windows 11']);
            result.current.setOfimatica(['Microsoft 365']);
        });

        expect(result.current.catalogoFiltrado.map(c => c.id_cuestionario)).toEqual(['Q1']);
        expect(result.current.hayFiltrosCatalogo).toBe(true);
    });

    it('restaura filtros guardados y los limpia bajo demanda', () => {
        localStorage.setItem('filtrosCatalogo', JSON.stringify({
            versiones: ['Windows 11'],
            tipos: [],
            estados: [],
            so: [],
            ofimatica: [],
        }));

        const { result } = renderHook(() => useFiltrosCatalogo([
            createCatalogItem({ id_cuestionario: 'Q1', version: 'Windows 11' }),
            createCatalogItem({ id_cuestionario: 'Q2', version: 'Windows 10' }),
        ]));

        expect(result.current.catalogoFiltrado.map(c => c.id_cuestionario)).toEqual(['Q1']);

        act(() => result.current.limpiar());

        expect(result.current.state.versiones).toEqual([]);
        expect(result.current.catalogoFiltrado.map(c => c.id_cuestionario)).toEqual(['Q1', 'Q2']);
    });
});

