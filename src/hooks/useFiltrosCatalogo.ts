import { useReducer, useMemo, useCallback, useEffect } from 'react';
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
// ——— Hook ———
export function useFiltrosCatalogo(catalogo: CuestionarioMeta[]) {
    // Inicializar desde localStorage si existe, respetando la estructura del estado
    const init = (): FiltrosCatalogoState => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('filtrosCatalogo');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Validar y mantener la forma del estado por si hay versiones antiguas o datos corruptos
                    return {
                        versiones: Array.isArray(parsed.versiones) ? parsed.versiones : INITIAL_STATE.versiones,
                        tipos: Array.isArray(parsed.tipos) ? parsed.tipos : INITIAL_STATE.tipos,
                        estados: Array.isArray(parsed.estados) ? parsed.estados : INITIAL_STATE.estados,
                        so: Array.isArray(parsed.so) ? parsed.so : INITIAL_STATE.so,
                        ofimatica: Array.isArray(parsed.ofimatica) ? parsed.ofimatica : INITIAL_STATE.ofimatica,
                    };
                }
            } catch (e) {
                console.error("Error leyendo filtros del catálogo de localStorage", e);
            }
        }
        return INITIAL_STATE;
    };

    const [state, dispatch] = useReducer(reducer, INITIAL_STATE, init);

    // Guardar en localStorage cada vez que cambie el estado
    useEffect(() => {
        localStorage.setItem('filtrosCatalogo', JSON.stringify(state));
    }, [state]);

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
