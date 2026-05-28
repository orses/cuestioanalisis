# Arquitectura

## Resumen

La aplicación sigue una arquitectura de SPA cliente. No hay backend propio: toda la carga, normalización, análisis, filtrado, persistencia y exportación se realiza en el navegador.

La estructura actual es funcional, pero todavía no separa con claridad todas las capas. `App.tsx`, `parser.ts`, `analytics.ts` y algunos componentes de vista concentran demasiadas responsabilidades.

## Capas reales

```text
main.tsx
└─ App.tsx
   ├─ hooks de filtros
   ├─ layout global
   ├─ vistas principales
   ├─ modales
   ├─ utilidades de parseo
   ├─ utilidades de persistencia
   └─ utilidades de exportación
```

## Capas recomendadas conceptualmente

```text
Entrada y shell de aplicación
├─ Estado de sesión y orquestación
├─ Dominio de preguntas y catálogo
├─ Servicios de importación, normalización y persistencia
├─ Selectores y cálculos derivados
├─ Componentes de interfaz
└─ Exportación e informes
```

## Estado principal

`App.tsx` mantiene:

- `dataset`: dataset de preguntas cargado y normalizado.
- `catalogo`: catálogo de cuestionarios.
- `ediciones`: cambios inline por pregunta.
- `vistaActual`: pestaña activa, persistida en `localStorage`.
- `dark`: tema claro u oscuro, persistido en `localStorage`.
- `preguntaAExpandir`: pregunta abierta en modal.
- `mensajeError`: error visible para el usuario.
- `archivosEnEspera`: archivos pendientes de asignación de identificador.

## Datos derivados

`preguntasEditadas` se calcula en `App.tsx` con `useMemo`. Aplica `ediciones` sobre `dataset.preguntas` y deduplica por `id_cuestionario::id`.

`useFiltros` recibe `preguntasEditadas` y devuelve:

- `preguntasFiltradas`;
- opciones disponibles por filtro;
- estado de filtros;
- setters estables;
- indicador de filtros activos.

`useFiltrosCatalogo` calcula el catálogo filtrado y sus opciones disponibles.

## Servicios y utilidades

### Parseo y normalización

`src/utils/parser.ts` contiene:

- validación de tamaño y límites de filas;
- parseo de CSV de preguntas;
- detección de cabecera `id_cuestionario`;
- parseo de catálogo CSV;
- parseo manual de Excel mediante JSZip y XML;
- normalización de metadatos de ejercicio;
- normalización de catálogo;
- normalización de aplicación o programa.

### Persistencia

`src/utils/storage.ts` encapsula IndexedDB:

- base de datos: `analisis-oposiciones-db`;
- versión: `2`;
- almacén: `datasets`;
- clave de dataset: `ultimo`;
- clave de catálogo: `catalogo`.

Los filtros y preferencias de interfaz se guardan en `localStorage`.

### Analítica

`src/utils/analytics.ts`, `src/utils/estadisticas.ts` y `src/utils/similarity.ts` contienen cálculos estadísticos y algoritmos de análisis. `analytics.ts` es el módulo más grande y debería dividirse por dominios cuando se aborde una refactorización.

## Vistas principales

La navegación se define en `AppHeader.tsx` mediante el tipo `Vista`:

- `resumen`
- `estadisticas`
- `ejercicios`
- `tabla`
- `conceptos`
- `comparativa`
- `simulacro`
- `generador`
- `catalogo`
- `ayuda`

## Acoplamientos importantes

- `ModalPregunta` reutiliza `TablaPreguntas` con `soloDetalle=true`. Esto evita duplicación inmediata, pero acopla modal, tabla, detalle y edición.
- `TablaPreguntas` renderiza tabla, tarjeta expandida, detalle de pregunta, edición inline, copia al portapapeles, metadatos y filtros.
- `App.tsx` contiene lógica de importación, exportación, navegación, filtros, tema, persistencia y modales.
- `parser.ts` mezcla normalización de preguntas, catálogo, Excel, seguridad y compatibilidad de cabeceras.

## Patrón de evolución recomendado

La refactorización más segura debe ser incremental:

1. Extraer componentes puros desde componentes grandes.
2. Extraer servicios puros desde `App.tsx` y `parser.ts`.
3. Añadir pruebas focalizadas antes de cambiar contratos de datos.
4. Mantener compatibilidad con CSV existentes.
5. Documentar cada microfase después de confirmarla.

