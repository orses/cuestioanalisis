# Componentes y vistas

## Componentes de layout

### `AppHeader`

Responsable de:

- cabecera fija;
- navegación entre vistas;
- acciones globales de exportación;
- cambio de tema;
- reemplazo y añadido de CSV.

Define el tipo `Vista`.

### `BarraFiltros`

Renderiza filtros generales, búsqueda y chips activos. Recibe estado y setters desde `useFiltros`.

### `PanelEstadisticas`

Agrupa vistas analíticas y accesos a preguntas desde resultados estadísticos.

### `ModalPregunta`

Muestra el detalle de una pregunta y navegación entre preguntas filtradas. Reutiliza `TablaPreguntas` en modo detalle.

### `ModalCuestionarioId`

Pide identificadores de cuestionario cuando un CSV no contiene `id_cuestionario`.

## Vistas principales

### `Resumen`

Vista de síntesis. Presenta agregados y accesos rápidos a filtros y ejercicios. Es uno de los componentes más grandes y mezcla cálculo local, presentación y navegación.

### `TablaPreguntas`

Vista de preguntas en formato tabla y tarjeta expandida. También sirve como detalle del modal.

Responsabilidades actuales:

- tabla resumida;
- expansión de filas;
- detalle completo;
- edición inline;
- copia al portapapeles;
- renderizado de opciones;
- renderizado de observaciones;
- renderizado de metadatos;
- disparo de filtros desde campos clicables.

Es un buen candidato a división.

### `VisorDataset`

Tabla tipo hoja de cálculo para datos reducidos o crudos. Gestiona ordenación, anchuras y scroll sincronizado.

### `CatalogoCuestionarios`

Vista de catálogo con columnas, filtros externos y anchuras persistidas.

### `Generador`

Genera cuestionarios personalizados a partir de preguntas filtradas.

### `BusquedaSemantica`

Permite localizar preguntas por conceptos o términos relacionados.

### `Comparativa`

Compara ejercicios y tendencias.

### `ExamenSimulado`

Construye y corrige simulacros.

### `Ayuda`

Documentación funcional visible dentro de la aplicación.

## Utilidades de dominio

- `parser.ts`: importación, normalización y catálogo.
- `metadata.ts`: códigos y etiquetas de metadatos.
- `ejercicios.ts`: extracción de ejercicio base y etiquetas.
- `analytics.ts`: análisis estadístico avanzado.
- `estadisticas.ts`: insights estadísticos.
- `similarity.ts`: duplicados y similitud.
- `generarInforme.ts`: informe Markdown.
- `storage.ts`: IndexedDB.
- `colores.ts`: color por materia.
- `prompts.ts` y `prompter.ts`: generación de prompts.
- `stopwords.ts`: términos excluidos para análisis textual.

## Hooks

### `useFiltros`

Encapsula estado, persistencia y cálculo de filtros generales.

### `useFiltrosCatalogo`

Encapsula estado, persistencia y cálculo de filtros del catálogo.

## Archivos más grandes observados

| Archivo | Líneas aproximadas | Comentario |
| --- | ---: | --- |
| `src/utils/analytics.ts` | 1297 | Múltiples dominios analíticos en un solo módulo. |
| `src/components/Resumen.tsx` | 752 | Vista extensa con cálculo y presentación. |
| `src/utils/parser.ts` | 702 | Parseo, normalización, Excel, seguridad y catálogo. |
| `src/App.tsx` | 591 | Orquestación global y varios efectos laterales. |
| `src/components/VisorDataset.tsx` | 577 | Tabla compleja con lógica de layout. |
| `src/components/ExamenSimulado.tsx` | 523 | Flujo interactivo extenso. |
| `src/components/TablaPreguntas.tsx` | 488 | Tabla, detalle y edición en un único componente. |
| `src/components/CatalogoCuestionarios.tsx` | 425 | Catálogo con tabla y preferencias. |
| `src/components/Comparativa.tsx` | 408 | Vista analítica amplia. |

## Criterio de diseño actual

La interfaz usa una estética de herramienta de análisis: tarjetas, tablas densas, filtros, chips, navegación superior y paneles de datos. Hay un sistema de variables CSS para tema claro y oscuro, pero todavía conviven:

- clases Tailwind;
- variables CSS;
- estilos inline;
- colores hardcodeados;
- SVG manual en algún botón.

