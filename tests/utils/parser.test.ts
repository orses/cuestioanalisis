import { describe, expect, it } from 'vitest';
import {
    csvTieneIdCuestionario,
    normalizarCatalogo,
    normalizarDatasetAnalisis,
    normalizarPrograma,
    parsearCatalogo,
    procesarCSV,
} from '../../src/utils/parser';
import { createCatalogItem, createQuestion } from '../fixtures/questions';

function createCsvFile(contents: string, name = 'preguntas.csv'): File {
    return new File([contents], name, { type: 'text/csv;charset=utf-8' });
}

describe('normalizarPrograma', () => {
    it('elimina versiones, años y sufijos habituales', () => {
        expect(normalizarPrograma('Word 2019')).toBe('Word');
        expect(normalizarPrograma('Excel 365')).toBe('Excel');
        expect(normalizarPrograma('Windows 11')).toBe('Windows');
        expect(normalizarPrograma('Word Word 2021')).toBe('Word');
    });

    it('aplica alias conocidos', () => {
        expect(normalizarPrograma('palabra')).toBe('Word');
        expect(normalizarPrograma('sobresalir')).toBe('Excel');
        expect(normalizarPrograma('perspectiva')).toBe('Outlook');
        expect(normalizarPrograma('ventanas')).toBe('Windows');
    });
});

describe('csvTieneIdCuestionario', () => {
    it('detecta la cabecera aunque use espacios', async () => {
        const file = createCsvFile('id cuestionario|ejercicio|pregunta\nQ1|E1|Texto');

        await expect(csvTieneIdCuestionario(file)).resolves.toBe(true);
    });

    it('devuelve falso cuando no existe identificador de cuestionario', async () => {
        const file = createCsvFile('ejercicio|pregunta\nE1|Texto');

        await expect(csvTieneIdCuestionario(file)).resolves.toBe(false);
    });
});

describe('procesarCSV', () => {
    it('parsea preguntas y conserva saltos de línea en observaciones', async () => {
        const file = createCsvFile([
            'id_cuestionario|ejercicio|año|num_pregunta|pregunta|respuesta_a|respuesta_b|respuesta_c|respuesta_d|correcta|anulada|materia|bloque|tema|aplicacion|observaciones',
            'Q1|INAP - AUX - 25 - LI - UNI - A|2025|12|Según la ISO, ¿qué nombre recibe?|Sistema de Información.|Sistema de Gestión de la Seguridad de la Información.|Seguridad de la Información.|Gestión de Incidentes.|B|FALSO|informática|seguridad|ISO 27000|Word 2019|"Definición ISO: línea 1\nNo confundir: línea 2"',
        ].join('\n'));

        const dataset = await procesarCSV(file);
        const pregunta = dataset.preguntas[0];

        expect(dataset.preguntas).toHaveLength(1);
        expect(dataset.cuestionarios_cargados).toEqual(['Q1']);
        expect(pregunta.id_cuestionario).toBe('Q1');
        expect(pregunta.numero_original).toBe(12);
        expect(pregunta.correcta).toBe('B');
        expect(pregunta.anulada).toBe(false);
        expect(pregunta.aplicacion).toBe('Word');
        expect(pregunta.observaciones).toBe('Definición ISO: línea 1\nNo confundir: línea 2');
        expect(pregunta.metadatos).toMatchObject({
            organismo: 'INAP',
            escala: 'AUX',
            año: 2025,
            acceso: 'LI',
            tipo: 'UNI',
            modelo: 'A',
        });
        expect(pregunta.distractores.map(d => d.texto_opcion)).toEqual([
            'Sistema de Información.',
            'Seguridad de la Información.',
            'Gestión de Incidentes.',
        ]);
    });

    it('usa el identificador manual cuando el CSV no trae id_cuestionario', async () => {
        const file = createCsvFile([
            'ejercicio|año|num_pregunta|pregunta|respuesta_a|respuesta_b|correcta|anulada',
            'INAP_AUX_25_LI_UNI|25|1|Pregunta sin id.|A.|B.|A|no',
        ].join('\n'));

        const dataset = await procesarCSV(file, 'MANUAL');
        const pregunta = dataset.preguntas[0];

        expect(pregunta.id_cuestionario).toBe('MANUAL');
        expect(pregunta.id).toBe('MANUAL_INAP_AUX_25_LI_UNI_1');
        expect(dataset.cuestionarios_cargados).toEqual(['MANUAL']);
    });

    it('añade sufijos a identificadores duplicados dentro del mismo CSV', async () => {
        const file = createCsvFile([
            'id_cuestionario|ejercicio|año|num_pregunta|pregunta|respuesta_a|respuesta_b|correcta|anulada',
            'Q1|INAP_AUX_25_LI_UNI|2025|1|Pregunta duplicada.|A.|B.|A|no',
            'Q1|INAP_AUX_25_LI_UNI|2025|1|Pregunta duplicada repetida.|A.|B.|B|no',
        ].join('\n'));

        const dataset = await procesarCSV(file);

        expect(dataset.preguntas.map(p => p.id)).toEqual([
            'Q1_INAP_AUX_25_LI_UNI_1',
            'Q1_INAP_AUX_25_LI_UNI_1_dup1',
        ]);
    });
});

describe('normalizarDatasetAnalisis', () => {
    it('recalcula metadatos desde el ejercicio base y normaliza aplicaciones', () => {
        const dataset = normalizarDatasetAnalisis({
            preguntas: [
                createQuestion({
                    id: 'Q1_INAP_AUX_25_LI_UNI_1',
                    id_cuestionario: 'Q1',
                    aplicacion: 'Excel 365',
                    metadatos: {
                        organismo: '',
                        escala: '',
                        año: 25,
                        acceso: '',
                        tipo: '',
                    },
                }),
            ],
            conceptos_globales: [],
            ejercicios_unicos: [],
            cuestionarios_cargados: ['Q1'],
        });

        expect(dataset.preguntas[0].aplicacion).toBe('Excel');
        expect(dataset.preguntas[0].metadatos).toMatchObject({
            organismo: 'INAP',
            escala: 'AUX',
            año: 2025,
            acceso: 'LI',
            tipo: 'UNI',
        });
    });
});

describe('parsearCatalogo', () => {
    it('normaliza y agrupa filas de catálogo por identificador', async () => {
        const file = createCsvFile([
            'id_cuestionario|cuestionario|version|tipo|estado|recopilacion|informatica|seguridad|num_preguntas|version_sistema_operativo|paquete_ofimatico',
            'Q1|Cuestionario base|WIN11|Test|actualizado|sí|x||10|Windows 11|Microsoft 365',
            'Q1||||||x|sí|12||',
        ].join('\n'), 'catalogo.csv');

        const catalogo = await parsearCatalogo(file);

        expect(catalogo).toHaveLength(1);
        expect(catalogo[0]).toMatchObject({
            id_cuestionario: 'Q1',
            cuestionario: 'Cuestionario base',
            version_sistema_operativo: 'Windows 11',
            paquete_ofimatico: 'Microsoft 365',
            informatica: true,
            seguridad: true,
            num_preguntas: 12,
        });
    });
});

describe('normalizarCatalogo', () => {
    it('conserva texto disponible y acumula banderas booleanas', () => {
        const catalogo = normalizarCatalogo([
            createCatalogItem({ id_cuestionario: 'Q1', seguridad: false, num_preguntas: 10 }),
            createCatalogItem({ id_cuestionario: 'Q1', cuestionario: '', seguridad: true, num_preguntas: 12 }),
        ]);

        expect(catalogo).toHaveLength(1);
        expect(catalogo[0].cuestionario).toBe('Cuestionario de ejemplo');
        expect(catalogo[0].seguridad).toBe(true);
        expect(catalogo[0].num_preguntas).toBe(12);
    });
});

