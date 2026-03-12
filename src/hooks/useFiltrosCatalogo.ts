import { useReducer, useMemo, useCallback } from 'react';
import type { CuestionarioMeta } from '../types';

// ——— Estado ———
export interface FiltrosCatalogoState {
    versiones: string[];
    tipos: string[];
    estados: string[];
    so: string[];
    ofimatica: string[];
}

const INITIAL_STATE: FiltrosCatalogoState = {
    versiones: [],
    tipos: [],
    estados: [],
    so: [],
    ofimatica: [],
};

// ——— Acciones ———
type CatAction =
    | { type: 'SET'; campo: keyof FiltrosCatalogoState; valor: string[] }
    | { type: 'LIMPIAR' };

function reducer(state: FiltrosCatalogoState, action: CatAction): FiltrosCatalogoState {
    switch (action.type) {
        case 'SET':
            return { ...state, [action.campo]: action.valor };
        case 'LIMPIAR':
            return INITIAL_STATE;
        default:
            return state;
    }
}

// ——— Hook ———
export function useFiltrosCatalogo(catalogo: CuestionarioMeta[]) {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

    // Opciones disponibles
    const versionesDisponibles = useMemo(() => Array.from(new Set(catalogo.map(c => c.version).filter(Boolean))).sort(), [catalogo]);
    const tiposDisponibles = useMemo(() => Array.from(new Set(catalogo.map(c => c.tipo).filter(Boolean))).sort(), [catalogo]);
    const estadosDisponibles = useMemo(() => Array.from(new Set(catalogo.map(c => c.estado).filter(Boolean))).sort(), [catalogo]);
    const soDisponibles = useMemo(() => Array.from(new Set(catalogo.map(c => c.sistema_operativo).filter(Boolean))).sort(), [catalogo]);
    const ofimaticaDisponibles = useMemo(() => Array.from(new Set(catalogo.map(c => c.paquete_ofimatico).filter(Boolean))).sort(), [catalogo]);

    // Catálogo filtrado
    const catalogoFiltrado = useMemo(() => {
        return catalogo.filter(c => {
            if (state.versiones.length > 0 && !state.versiones.includes(c.version)) return false;
            if (state.tipos.length > 0 && !state.tipos.includes(c.tipo)) return false;
            if (state.estados.length > 0 && !state.estados.includes(c.estado)) return false;
            if (state.so.length > 0 && !state.so.includes(c.sistema_operativo)) return false;
            if (state.ofimatica.length > 0 && !state.ofimatica.includes(c.paquete_ofimatico)) return false;
            return true;
        });
    }, [catalogo, state]);

    const hayFiltrosCatalogo = state.versiones.length > 0 || state.tipos.length > 0 ||
        state.estados.length > 0 || state.so.length > 0 || state.ofimatica.length > 0;

    // Setters
    const setVersiones = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'versiones', valor: v }), []);
    const setTipos = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'tipos', valor: v }), []);
    const setEstados = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'estados', valor: v }), []);
    const setSo = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'so', valor: v }), []);
    const setOfimatica = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'ofimatica', valor: v }), []);
    const limpiar = useCallback(() => dispatch({ type: 'LIMPIAR' }), []);

    return {
        state,
        catalogoFiltrado,
        hayFiltrosCatalogo,
        disponibles: {
            versiones: versionesDisponibles,
            tipos: tiposDisponibles,
            estados: estadosDisponibles,
            so: soDisponibles,
            ofimatica: ofimaticaDisponibles,
        },
        setVersiones,
        setTipos,
        setEstados,
        setSo,
        setOfimatica,
        limpiar,
    };
}
