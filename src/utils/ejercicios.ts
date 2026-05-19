import type { Pregunta } from '../types';

type PreguntaConEjercicio = Pick<Pregunta, 'id' | 'id_cuestionario'>;

export function obtenerEjercicioBase(pregunta: PreguntaConEjercicio): string {
    const idSinDuplicado = pregunta.id.replace(/_dup\d+$/, '');
    const idSinNumero = idSinDuplicado.replace(/_[^_]*$/, '');
    const prefijoCuestionario = pregunta.id_cuestionario ? `${pregunta.id_cuestionario}_` : '';

    if (prefijoCuestionario && idSinNumero.startsWith(prefijoCuestionario)) {
        return idSinNumero.slice(prefijoCuestionario.length) || '(sin ejercicio)';
    }

    return idSinNumero || '(sin ejercicio)';
}

export function obtenerClaveEjercicioCuestionario(pregunta: PreguntaConEjercicio): string {
    const ejercicio = obtenerEjercicioBase(pregunta);
    return pregunta.id_cuestionario
        ? `${pregunta.id_cuestionario}::${ejercicio}`
        : ejercicio;
}

export function obtenerEtiquetaEjercicioCuestionario(pregunta: PreguntaConEjercicio): string {
    const ejercicio = obtenerEjercicioBase(pregunta);
    return pregunta.id_cuestionario
        ? `${pregunta.id_cuestionario} - ${ejercicio}`
        : ejercicio;
}
