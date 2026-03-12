export type Materia =
    | 'informática'
    | 'seguridad'
    | 'administración electrónica'
    | 'legislación'
    | 'psicotécnico'
    | 'comunicación'
    | 'varia';

export interface ConceptoAdyacente {
    id_origen: string;
    texto_opcion: string;
    año_aparicion: number;
}

export interface MetadatosEjercicio {
    organismo: string;
    escala: string;
    año: number;
    acceso: string;
    tipo: string;
    variante: string;
    extraordinaria: boolean;
}

export interface Pregunta {
    id: string;
    id_cuestionario: string;
    numero_original: number;
    metadatos: MetadatosEjercicio;
    materia: Materia | string;
    bloque: string;
    tema: string;
    aplicacion: string;
    enunciado: string;
    opciones: Record<string, string>;
    correcta: string | null;
    anulada: boolean;
    observaciones?: string;
    conceptos_clave: string[];
    distractores: ConceptoAdyacente[];
}

export interface CuestionarioMeta {
    id_cuestionario: string;
    cuestionario: string;
    version: string;
    tipo: string;
    estado: string;
    recopilacion: boolean;
    sistema_operativo: string;
    paquete_ofimatico: string;
    descripcion: string;
    procesador_texto: boolean;
    hoja_de_calculo: boolean;
    sgbd: boolean;
    presentaciones: boolean;
    cliente_correo: boolean;
    num_preguntas: number;
}

export interface DatasetAnalisis {
    preguntas: Pregunta[];
    conceptos_globales: ConceptoAdyacente[];
    ejercicios_unicos: string[];
    cuestionarios_cargados: string[];
}
