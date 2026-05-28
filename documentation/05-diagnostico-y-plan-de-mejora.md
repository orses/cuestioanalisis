# Diagnóstico y plan de mejora

## Diagnóstico general

El proyecto tiene una base práctica y útil: importa datos con límites de seguridad, normaliza metadatos, persiste sesión, ofrece filtros potentes y agrupa muchas herramientas analíticas. La deuda técnica principal no está en una mala elección de tecnología, sino en la concentración de responsabilidades y en la ausencia de pruebas automatizadas para contratos de datos críticos.

## Fortalezas

- TypeScript estricto activado.
- ESLint pasa correctamente.
- Límites explícitos para tamaño de CSV, Excel, XML, filas y celdas.
- Persistencia local separada en `storage.ts`.
- Filtros principales extraídos a hooks.
- GitHub Actions con build, auditoría npm y CodeQL.
- Variables CSS para modo claro y oscuro.
- Buena cobertura funcional para análisis, filtrado, simulacros y exportación.

## Riesgos y oportunidades

### 1. Falta de pruebas automatizadas

No hay script `test`. Los módulos más sensibles son precisamente los que más reglas implícitas tienen:

- `parser.ts`;
- `analytics.ts`;
- `similarity.ts`;
- `useFiltros.ts`;
- exportación CSV;
- renderizado de observaciones y detalle de pregunta.

Prioridad: alta.

### 2. Componentes y utilidades demasiado grandes

`App.tsx`, `TablaPreguntas.tsx`, `Resumen.tsx`, `VisorDataset.tsx`, `parser.ts` y `analytics.ts` concentran muchas responsabilidades. Esto eleva el coste de cambio y hace que pequeñas mejoras visuales afecten a zonas amplias.

Prioridad: alta.

### 3. Acoplamiento entre modal y tabla

`ModalPregunta` depende de `TablaPreguntas` con `soloDetalle=true`. Es una solución eficiente a corto plazo, pero el detalle de pregunta debería ser un componente propio:

- `QuestionDetail`;
- `QuestionOptions`;
- `QuestionObservations`;
- `QuestionMetadata`;
- `QuestionEditor`.

Prioridad: alta.

### 4. Contrato CSV implícito

Las cabeceras aceptadas, normalizaciones y valores permitidos viven dentro de `parser.ts`. Deberían declararse cerca de un esquema o documentación ejecutable para reducir regresiones.

Prioridad: alta.

### 5. Accesibilidad incompleta

Se observan buenas prácticas parciales, como `aria-label`, `role="tab"` y foco visible global. Aun así, conviene revisar:

- modales con `role="dialog"` y `aria-modal`;
- gestión de foco al abrir y cerrar modales;
- trampa de foco en modales;
- `MultiSelect` con semántica de combobox/listbox o alternativa accesible;
- botones con icono sin texto visible;
- navegación por teclado en popovers.

Prioridad: media-alta.

### 6. Rendimiento con datasets grandes

El parser permite hasta 50 000 filas, pero varias vistas renderizan tablas completas o recalculan análisis en cliente. Para datasets grandes conviene:

- virtualizar tablas;
- paginar vistas densas;
- memorizar cálculos costosos;
- dividir analytics por demanda;
- considerar Web Workers para análisis pesados.

Prioridad: media-alta.

### 7. Bundle grande

El build de Vite avisa de chunks superiores a 500 kB. El JavaScript principal observado ronda 1,09 MB minificado. Conviene valorar:

- carga diferida por vista;
- separación de librerías de gráficos;
- importaciones dinámicas de módulos analíticos;
- `manualChunks` si hace falta.

Prioridad: media.

### 8. Estilos mezclados

Conviven variables CSS, Tailwind, estilos inline y colores hardcodeados. Se recomienda consolidar tokens y patrones de componentes para reducir inconsistencias.

Prioridad: media.

### 9. Flujo mixto de CSV con y sin identificador

Si se cargan simultáneamente archivos con `id_cuestionario` y archivos sin él, el modal recibe todos los archivos y puede forzar identificación manual incluso donde el CSV ya trae identificador. El flujo debería conservar metadatos de detección por archivo y pedir datos solo para los que los necesitan.

Prioridad: media.

### 10. Estado de edición no persistido automáticamente

Las ediciones se mantienen en memoria y se aplican al exportar. Si el usuario recarga antes de exportar, puede perder correcciones. Hay que decidir si este comportamiento es contrato deseado o si se debe persistir.

Prioridad: media.

## Refactorización incremental sugerida

### Microfase 1: pruebas base de dominio

- Añadir Vitest y Testing Library.
- Probar `normalizarPrograma`.
- Probar `parsearMetadatosEjercicio` mediante funciones exportadas o fachada de test.
- Probar `procesarCSV` con `preguntas-con-id.csv` y `preguntas-sin-id.csv`.
- Probar `useFiltros` con dataset mínimo.

### Microfase 2: detalle de pregunta

Extraer desde `TablaPreguntas`:

- `QuestionDetail`;
- `QuestionOptions`;
- `QuestionObservations`;
- `QuestionMetadata`;
- `QuestionEditForm`.

Objetivo: que `ModalPregunta` use `QuestionDetail` directamente y que `TablaPreguntas` solo coordine la tabla.

### Microfase 3: contrato de importación

- Declarar cabeceras aceptadas en constantes nombradas.
- Documentar campos obligatorios y opcionales.
- Separar parseo de preguntas y catálogo.
- Añadir pruebas con archivos reales de `DATOS/`.

### Microfase 4: estado de aplicación

Extraer un hook de sesión:

- `useDatasetSession`;
- `useCatalogSession`;
- `useQuestionEditing`;
- `useThemePreference`;
- `useActiveView`.

Objetivo: reducir `App.tsx` a shell y composición.

### Microfase 5: analítica modular

Dividir `analytics.ts` por dominios:

- distribución y cobertura;
- dificultad;
- correlaciones;
- predicción;
- coocurrencia;
- simulación;
- vocabulario emergente.

Cada módulo debe tener pruebas unitarias con fixtures pequeños.

### Microfase 6: rendimiento y carga diferida

- Lazy loading por pestaña.
- Virtualización de `VisorDataset`.
- Importación dinámica de gráficos pesados.
- Evaluación de Web Worker para cálculos analíticos.

### Microfase 7: accesibilidad y sistema de diseño

- Revisar modales y popovers.
- Normalizar botones, chips, tarjetas y tablas.
- Reducir estilos inline.
- Asegurar responsive real en cabecera, modal y filtros.

## Regla de oro para futuras mejoras

No abordar una refactorización amplia sin una red mínima de pruebas. La primera inversión rentable es cubrir parser, filtros y detalle de pregunta. Después, extraer componentes será mucho más seguro.

