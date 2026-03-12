import type { Pregunta } from '../types';
import { promptMaestroV48 } from './prompts';

export interface PromptConfig {
    materia: string;
    bloque: string;
    tema: string;
    cantidad: number;
    nivel: 'Básico' | 'Intermedio' | 'Avanzado';
    tipo: 'TEÓRICO' | 'PRÁCTICO' | 'TEÓRICO-PRÁCTICO';
    proporcion: string; // Ej: "70-30"
}

/**
 * Función auxiliar para obtener una muestra aleatoria de un array
 */
const obtenerMuestraAleatoria = <T>(array: T[], tamaño: number): T[] => {
    const mezclado = [...array].sort(() => 0.5 - Math.random());
    return mezclado.slice(0, Math.min(tamaño, array.length));
};

/**
 * Compila el macro-prompt basado en la configuración del usuario y la base de conocimiento empírica.
 */
export const compilarPromptSimulacro = (config: PromptConfig, preguntasBase: Pregunta[]): string => {
    // 1. Filtrar preguntas que coincidan con los criterios (si se especifican)
    let preguntasFiltradas = preguntasBase;

    if (config.materia && config.materia !== 'todas') {
        preguntasFiltradas = preguntasFiltradas.filter(p => p.materia.toString() === config.materia);
    }
    if (config.bloque && config.bloque !== 'todos') {
        preguntasFiltradas = preguntasFiltradas.filter(p => p.bloque === config.bloque);
    }
    if (config.tema && config.tema !== 'todos') {
        preguntasFiltradas = preguntasFiltradas.filter(p => p.tema === config.tema);
    }

    // Si no hay datos, cogemos de toda la base para no fallar
    if (preguntasFiltradas.length === 0) {
        preguntasFiltradas = preguntasBase;
    }

    // 2. Extraer "Base de Conocimiento" (Materia prima para Gemini)
    // Tomamos una muestra representativa (ej. 3 veces la cantidad solicitada para no saturar el token limit, max 100)
    const muestraPreguntas = obtenerMuestraAleatoria(preguntasFiltradas, Math.min(config.cantidad * 3, 100));

    const conceptosMateria: string[] = [];
    const enunciadosEjemplo: string[] = [];
    const distractoresComunes: Set<string> = new Set();

    muestraPreguntas.forEach(p => {
        enunciadosEjemplo.push(`- ${p.enunciado}`);

        // Extraer opciones como conceptos
        if (p.correcta && p.opciones[p.correcta]) {
            conceptosMateria.push(p.opciones[p.correcta]);
        }

        p.distractores.forEach(d => {
            if (d && d.texto_opcion.trim().length > 3) distractoresComunes.add(d.texto_opcion.trim());
        });
    });

    const distractoresMuestra = obtenerMuestraAleatoria(Array.from(distractoresComunes), 30);
    const conceptosMuestra = obtenerMuestraAleatoria(conceptosMateria, 20);

    // 3. Montar el comando de ejecución exigido por la v4.8
    let comandoEjecucion = `CREAR ${config.tipo}: ${config.tema !== 'todos' ? config.tema : config.materia} - ${config.nivel} - ${config.cantidad}`;
    if (config.tipo === 'TEÓRICO-PRÁCTICO') {
        comandoEjecucion += ` - ${config.proporcion}`;
    }

    // 4. Ensamblar Megaprompt
    const promptFinal = `
${promptMaestroV48}

---

# 🧠 BASE DE CONOCIMIENTO (CONTEXTO VINCULANTE)
A continuación tienes material de entrenamiento (Enunciados, Conceptos Clave y Distractores Oficiales) extraídos de exámenes anteriores reales. 
**TU MISIÓN ES CREAR UN SIMULACRO NUEVO.** 
No debes copiar estas preguntas literalmente, sino inspirarte en ellas. 
Debes tomar los DISTRACTORES y CONCEPTOS de este material y redactar nuevas preguntas donde estos terminen siendo la respuesta correcta, obligando al alumno a dominar las alternativas.

## Enunciados Históricos de Ejemplo:
${enunciadosEjemplo.slice(0, 10).join('\n')}

## Conceptos que se deben evaluar:
${conceptosMuestra.map(c => `- ${c}`).join('\n')}

## Distractores Oficiales Recurrentes (Úsalos como trampas O como respuestas correctas de nuevas preguntas):
${distractoresMuestra.map(d => `- ${d}`).join('\n')}

---

# 🚀 ORDEN DE EJECUCIÓN (MODO CREACIÓN)
Genera el cuestionario AHORA utilizando el formato estricto de salida (Reglas RAE, Psicometría y Formato Markdown obligatorios).

**COMANDO:**
${comandoEjecucion}
`;

    return promptFinal;
};
