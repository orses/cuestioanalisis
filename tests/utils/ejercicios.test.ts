import { describe, expect, it } from 'vitest';
import {
    obtenerClaveEjercicioCuestionario,
    obtenerEjercicioBase,
    obtenerEtiquetaEjercicioCuestionario,
} from '../../src/utils/ejercicios';

describe('ejercicios', () => {
    it('extrae el ejercicio base eliminando cuestionario, número y sufijo de duplicado', () => {
        const pregunta = {
            id: 'Q1_INAP_AUX_25_LI_UNI_12_dup1',
            id_cuestionario: 'Q1',
        };

        expect(obtenerEjercicioBase(pregunta)).toBe('INAP_AUX_25_LI_UNI');
        expect(obtenerClaveEjercicioCuestionario(pregunta)).toBe('Q1::INAP_AUX_25_LI_UNI');
        expect(obtenerEtiquetaEjercicioCuestionario(pregunta)).toBe('Q1 - INAP_AUX_25_LI_UNI');
    });

    it('funciona con preguntas sin identificador de cuestionario', () => {
        const pregunta = {
            id: 'INAP_AUX_25_LI_UNI_12',
            id_cuestionario: '',
        };

        expect(obtenerEjercicioBase(pregunta)).toBe('INAP_AUX_25_LI_UNI');
        expect(obtenerClaveEjercicioCuestionario(pregunta)).toBe('INAP_AUX_25_LI_UNI');
        expect(obtenerEtiquetaEjercicioCuestionario(pregunta)).toBe('INAP_AUX_25_LI_UNI');
    });
});

