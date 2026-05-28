import type { CuestionarioMeta, Pregunta } from '../../src/types';

type QuestionOverrides = Omit<Partial<Pregunta>, 'metadatos' | 'opciones'> & {
    metadatos?: Partial<Pregunta['metadatos']>;
    opciones?: Partial<Pregunta['opciones']>;
};

export function createQuestion(overrides: QuestionOverrides = {}): Pregunta {
    const base: Pregunta = {
        id: 'Q1_INAP_AUX_25_LI_UNI_1',
        id_cuestionario: 'Q1',
        numero_original: 1,
        metadatos: {
            organismo: 'INAP',
            escala: 'AUX',
            año: 2025,
            tipoConvocatoria: '',
            acceso: 'LI',
            cupo: '',
            tipo: 'UNI',
            modelo: '',
            variante: '',
            extraordinaria: false,
        },
        materia: 'informática',
        bloque: 'software',
        tema: 'Windows',
        aplicacion: 'Windows',
        enunciado: 'Pregunta de ejemplo sobre Windows.',
        opciones: {
            A: 'Opción A',
            B: 'Opción B',
            C: 'Opción C',
            D: 'Opción D',
        },
        correcta: 'A',
        anulada: false,
        observaciones: '',
        conceptos_clave: [],
        distractores: [],
    };

    return {
        ...base,
        ...overrides,
        metadatos: {
            ...base.metadatos,
            ...overrides.metadatos,
        },
        opciones: {
            ...base.opciones,
            ...overrides.opciones,
        },
    };
}

export function createCatalogItem(overrides: Partial<CuestionarioMeta> = {}): CuestionarioMeta {
    return {
        id_cuestionario: 'Q1',
        familia: 'INAP',
        cuestionario: 'Cuestionario de ejemplo',
        version: 'Windows 11',
        tipo: 'Test',
        estado: 'actualizado',
        recopilacion: true,
        preparacion: 'Completa',
        informatica: true,
        seguridad: false,
        version_sistema_operativo: 'Windows 11',
        sistema_operativo: true,
        paquete_ofimatico: 'Microsoft 365',
        descripcion: 'Catálogo de prueba',
        procesador_texto: true,
        hoja_de_calculo: true,
        sgbd: false,
        presentaciones: false,
        redes: false,
        cliente_correo: false,
        num_preguntas: 10,
        ...overrides,
    };
}

