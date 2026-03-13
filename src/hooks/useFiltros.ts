import { useReducer, useMemo, useCallback, useEffect } from 'react';
import type { Pregunta, CuestionarioMeta } from '../types';

// ═══════════════════════════════════════════════════════
// Motor de búsqueda lógica (extraído de App.tsx)
// ═══════════════════════════════════════════════════════

/**
 * Motor de búsqueda lógico.
 * Divide la consulta por OR/O. Cada segmento es una cláusula AND.
 * Admite 'Y', 'AND', espacio como operadores de suma implícitos.
 * Admite 'NO', 'NOT', '-' como operadores de negación.
 */
function cumpleBusquedaLogica(textoBusqueda: string, queryOriginal: string): boolean {
    if (!queryOriginal.trim()) return true;

    const orClauses = queryOriginal.split(/\s+OR\s+|\s+O\s+/i).filter(c => c.trim() !== '');
    if (orClauses.length === 0) return true;

    return orClauses.some(clause => {
        const tokens = clause.trim().split(/\s+/);
        let expectNot = false;

        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i].toLowerCase();

            if (token === 'and' || token === 'y') continue;
            if (token === 'not' || token === 'no' || token === '-') {
                expectNot = true;
                continue;
            }

            let isNegated = expectNot;
            expectNot = false;

            if (token.startsWith('-')) {
                isNegated = true;
                token = token.substring(1);
            }

            if (!token) continue;

            const match = textoBusqueda.includes(token);
            if (isNegated && match) return false;
            if (!isNegated && !match) return false;
        }

        return true;
    });
}

// ═══════════════════════════════════════════════════════
// Estado y acciones
// ═══════════════════════════════════════════════════════

export interface FiltrosState {
    materias: string[];
    bloques: string[];
    temas: string[];
    aplicaciones: string[];
    correctas: string[];
    anulada: string[];
    años: string[];
    organismos: string[];
    escalas: string[];
    accesos: string[];
    ejercicios: string[];
    cuestionarios: string[];
    busqueda: string;
}

const INITIAL_STATE: FiltrosState = {
    materias: [],
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
    busqueda: '',
};

type FiltroAction =
    | { type: 'SET'; campo: keyof FiltrosState; valor: string[] | string }
    | { type: 'SET_MATERIA'; valor: string[] }
    | { type: 'SET_BLOQUE'; valor: string[] }
    | { type: 'LIMPIAR' };

function reducer(state: FiltrosState, action: FiltroAction): FiltrosState {
    switch (action.type) {
        case 'SET':
            return { ...state, [action.campo]: action.valor };
        case 'SET_MATERIA':
            // Reset en cascada: al cambiar materia se limpian bloque, tema y aplicación
            return { ...state, materias: action.valor, bloques: [], temas: [], aplicaciones: [] };
        case 'SET_BLOQUE':
            // Reset en cascada: al cambiar bloque se limpia tema
            return { ...state, bloques: action.valor, temas: [] };
        case 'LIMPIAR':
            return INITIAL_STATE;
        default:
            return state;
    }
}

// ═══════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════

interface UseFiltrosOpts {
    preguntasEditadas: Pregunta[];
    catalogoFiltrado: CuestionarioMeta[];
    hayFiltrosCatalogo: boolean;
}

export function useFiltros({ preguntasEditadas, catalogoFiltrado, hayFiltrosCatalogo }: UseFiltrosOpts) {
    // Inicializar desde localStorage si existe
    const init = (): FiltrosState => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('filtrosGenerales');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    return {
                        ...INITIAL_STATE,
                        ...parsed,
                    };
                }
            } catch (e) {
                console.error("Error leyendo filtros generales de localStorage", e);
            }
        }
        return INITIAL_STATE;
    };

    const [state, dispatch] = useReducer(reducer, INITIAL_STATE, init);

    // Guardar en localStorage cada vez que cambie el estado
    useEffect(() => {
        localStorage.setItem('filtrosGenerales', JSON.stringify(state));
    }, [state]);

    // ——— Opciones disponibles por filtro ———
    const materiasDisponibles = useMemo(() =>
        Array.from(new Set(preguntasEditadas.map(p => p.materia.toString()))).sort(),
        [preguntasEditadas]
    );

    const bloquesDisponibles = useMemo(() => {
        let filtradas = preguntasEditadas;
        if (state.materias.length > 0) filtradas = filtradas.filter(p => state.materias.includes(p.materia.toString()));
        return Array.from(new Set(filtradas.map(p => p.bloque).filter(Boolean))).sort();
    }, [preguntasEditadas, state.materias]);

    const temasDisponibles = useMemo(() => {
        let filtradas = preguntasEditadas;
        if (state.materias.length > 0) filtradas = filtradas.filter(p => state.materias.includes(p.materia.toString()));
        if (state.bloques.length > 0) filtradas = filtradas.filter(p => state.bloques.includes(p.bloque));
        return Array.from(new Set(filtradas.map(p => p.tema).filter(Boolean))).sort();
    }, [preguntasEditadas, state.materias, state.bloques]);

    const aplicacionesDisponibles = useMemo(() => {
        let filtradas = preguntasEditadas;
        if (state.materias.length > 0) filtradas = filtradas.filter(p => state.materias.includes(p.materia.toString()));
        return Array.from(new Set(filtradas.map(p => p.aplicacion).filter(Boolean))).sort();
    }, [preguntasEditadas, state.materias]);

    const añosDisponibles = useMemo(() =>
        Array.from(new Set(preguntasEditadas.map(p => String(p.metadatos.año)).filter(a => a !== '0'))).sort(),
        [preguntasEditadas]
    );

    const organismosDisponibles = useMemo(() =>
        Array.from(new Set(preguntasEditadas.map(p => p.metadatos.organismo).filter(Boolean))).sort(),
        [preguntasEditadas]
    );

    const escalasDisponibles = useMemo(() =>
        Array.from(new Set(preguntasEditadas.map(p => p.metadatos.escala).filter(Boolean))).sort(),
        [preguntasEditadas]
    );

    const accesosDisponibles = useMemo(() =>
        Array.from(new Set(preguntasEditadas.map(p => p.metadatos.acceso).filter(Boolean))).sort(),
        [preguntasEditadas]
    );

    const ejerciciosDisponibles = useMemo(() =>
        Array.from(new Set(preguntasEditadas.map(p => p.metadatos.tipo).filter(Boolean))).sort(),
        [preguntasEditadas]
    );

    const cuestionariosDisponibles = useMemo(() =>
        Array.from(new Set(preguntasEditadas.map(p => p.id_cuestionario).filter(Boolean))).sort(),
        [preguntasEditadas]
    );

    // ——— Preguntas filtradas ———
    const preguntasFiltradas = useMemo(() => {
        return preguntasEditadas.filter(p => {
            if (state.materias.length > 0 && !state.materias.includes(p.materia.toString())) return false;
            if (state.bloques.length > 0 && !state.bloques.includes(p.bloque)) return false;
            if (state.temas.length > 0 && !state.temas.includes(p.tema)) return false;
            if (state.aplicaciones.length > 0 && !state.aplicaciones.includes(p.aplicacion)) return false;
            if (state.correctas.length > 0 && !state.correctas.includes(p.correcta || '')) return false;
            if (state.años.length > 0 && !state.años.includes(String(p.metadatos.año))) return false;
            if (state.organismos.length > 0 && !state.organismos.includes(p.metadatos.organismo)) return false;
            if (state.escalas.length > 0 && !state.escalas.includes(p.metadatos.escala)) return false;
            if (state.accesos.length > 0 && !state.accesos.includes(p.metadatos.acceso)) return false;
            if (state.ejercicios.length > 0 && !state.ejercicios.includes(p.metadatos.tipo)) return false;
            if (state.cuestionarios.length > 0 && !state.cuestionarios.includes(p.id_cuestionario)) return false;
            if (state.anulada.length > 0) {
                const quiereSi = state.anulada.includes('Sí');
                const quiereNo = state.anulada.includes('No');
                if (quiereSi && !quiereNo && !p.anulada) return false;
                if (quiereNo && !quiereSi && p.anulada) return false;
            }
            if (state.busqueda) {
                const textoBusqueda = [
                    p.enunciado,
                    Object.values(p.opciones).join(' '),
                    p.id,
                    p.materia,
                    p.bloque,
                    p.tema
                ].join(' ').toLowerCase();

                if (!cumpleBusquedaLogica(textoBusqueda, state.busqueda)) {
                    return false;
                }
            }

            if (hayFiltrosCatalogo) {
                if (!catalogoFiltrado.some(c => c.id_cuestionario === p.id_cuestionario)) {
                    return false;
                }
            }

            return true;
        });
    }, [preguntasEditadas, state, catalogoFiltrado, hayFiltrosCatalogo]);

    const hayFiltrosActivos = state.materias.length > 0 || state.bloques.length > 0 ||
        state.temas.length > 0 || state.aplicaciones.length > 0 ||
        state.correctas.length > 0 || state.anulada.length > 0 ||
        state.años.length > 0 || state.organismos.length > 0 ||
        state.escalas.length > 0 || state.accesos.length > 0 ||
        state.ejercicios.length > 0 || state.cuestionarios.length > 0 ||
        state.busqueda !== '' || hayFiltrosCatalogo;

    // ——— Setters estables ———
    const setMaterias = useCallback((v: string[]) => dispatch({ type: 'SET_MATERIA', valor: v }), []);
    const setBloques = useCallback((v: string[]) => dispatch({ type: 'SET_BLOQUE', valor: v }), []);
    const setTemas = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'temas', valor: v }), []);
    const setAplicaciones = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'aplicaciones', valor: v }), []);
    const setCorrectas = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'correctas', valor: v }), []);
    const setAnulada = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'anulada', valor: v }), []);
    const setAños = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'años', valor: v }), []);
    const setOrganismos = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'organismos', valor: v }), []);
    const setEscalas = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'escalas', valor: v }), []);
    const setAccesos = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'accesos', valor: v }), []);
    const setEjercicios = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'ejercicios', valor: v }), []);
    const setCuestionarios = useCallback((v: string[]) => dispatch({ type: 'SET', campo: 'cuestionarios', valor: v }), []);
    const setBusqueda = useCallback((v: string) => dispatch({ type: 'SET', campo: 'busqueda', valor: v }), []);
    const limpiar = useCallback(() => dispatch({ type: 'LIMPIAR' }), []);

    return {
        state,
        preguntasFiltradas,
        hayFiltrosActivos,
        disponibles: {
            materias: materiasDisponibles,
            bloques: bloquesDisponibles,
            temas: temasDisponibles,
            aplicaciones: aplicacionesDisponibles,
            correctas: ['A', 'B', 'C', 'D'] as string[],
            anulada: ['Sí', 'No'] as string[],
            años: añosDisponibles,
            organismos: organismosDisponibles,
            escalas: escalasDisponibles,
            accesos: accesosDisponibles,
            ejercicios: ejerciciosDisponibles,
            cuestionarios: cuestionariosDisponibles,
        },
        setMaterias,
        setBloques,
        setTemas,
        setAplicaciones,
        setCorrectas,
        setAnulada,
        setAños,
        setOrganismos,
        setEscalas,
        setAccesos,
        setEjercicios,
        setCuestionarios,
        setBusqueda,
        limpiar,
    };
}
