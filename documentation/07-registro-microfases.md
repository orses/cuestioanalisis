# Registro de microfases

## 2026-05-28 — Infraestructura de pruebas y documentación versionable

### Qué se ha cambiado

- Se ha añadido infraestructura de pruebas con Vitest, Testing Library, Jest DOM y jsdom.
- Se han añadido scripts `test` y `test:watch` en `analisis-oposiciones/package.json`.
- Se ha añadido el script `test` en el `package.json` de la raíz para delegar en la aplicación.
- Se ha configurado Vitest en `vite.config.ts` con entorno `jsdom`, `setupFiles` y patrón de tests en `tests/`.
- Se ha creado `tests/setup.ts`.
- Se han añadido fixtures de preguntas y catálogo.
- Se han añadido pruebas de regresión para:
  - observaciones;
  - componente `QuestionObservations`;
  - metadatos;
  - utilidades de ejercicios;
  - similitud y duplicados;
  - parser de CSV;
  - detección de `id_cuestionario`;
  - normalización de dataset;
  - parseo y normalización de catálogo;
  - filtros generales;
  - filtros de catálogo;
  - generación de informes Markdown.
- Se ha extraído el tratamiento de observaciones a:
  - `src/utils/observations.ts`;
  - `src/components/questions/QuestionObservations.tsx`.
- Se ha actualizado `TablaPreguntas` para usar `QuestionObservations`.
- Se ha ajustado `formatVariantLabel` para expandir `EXT` también cuando venga en valores con guion bajo, como `EXT_BIB`.
- Se ha copiado la documentación a `analisis-oposiciones/documentation/`, que pertenece al repositorio Git de la aplicación.

### Por qué se ha cambiado

El proyecto carecía de una suite automatizada de regresión. Antes de refactorizar componentes grandes o tocar contratos de importación, era necesario cubrir los comportamientos más frágiles: parseo de CSV, normalización de metadatos, filtros, observaciones, catálogo, informes y duplicados.

También era necesario que la documentación creada estuviera dentro del repositorio real de la aplicación para poder versionarla.

### Contrato vigente

- Las observaciones se dividen por saltos de línea, ignoran líneas vacías y se renderizan como párrafos separados.
- El CSV de preguntas sigue usando delimitador `|`.
- `procesarCSV` conserva saltos de línea dentro de campos CSV entrecomillados.
- Si el CSV no trae `id_cuestionario`, `procesarCSV` acepta un identificador manual.
- Los identificadores duplicados dentro de un mismo CSV reciben sufijo `_dupN`.
- Los filtros generales siguen persistiendo en `localStorage` con la clave `filtrosGenerales`.
- Los filtros de catálogo siguen persistiendo en `localStorage` con la clave `filtrosCatalogo`.
- Los informes Markdown deben incluir resumen general, ejercicios y distribuciones principales.
- `formatVariantLabel` normaliza guiones bajos antes de expandir `EXT`.

### Pruebas y verificaciones

- `npm run test`: 9 archivos de prueba, 31 pruebas superadas.
- `npm run lint`: correcto.
- `npm run build`: correcto.

El build conserva el aviso de Vite sobre chunks superiores a 500 kB. No es una regresión introducida por esta microfase.

### Riesgos, límites y pendientes

- No se ha añadido medición de cobertura.
- No se ha cubierto IndexedDB porque requeriría una estrategia específica de mock o una dependencia adicional como `fake-indexeddb`.
- No se ha refactorizado aún `TablaPreguntas` completo; solo se ha extraído observaciones.
- `analytics.ts` sigue concentrando muchos cálculos y necesita división por dominios en una microfase posterior.
- El aviso de motor indica que alguna dependencia espera Node 22.13.0 o superior, mientras el entorno actual usa Node 22.12.0.
- El chunk principal sigue siendo grande; conviene abordarlo con carga diferida por vistas.

## 2026-05-28 — Seguridad npm y cadena de suministro

### Qué se ha cambiado

- Se ha añadido `.npmrc` endurecido en la raíz del workspace.
- Se ha ampliado `.npmrc` de `analisis-oposiciones/` con la política completa.
- Se ha añadido `scripts/security/verify-npm-supply-chain.mjs`.
- Se han añadido scripts npm:
  - `security:lockfile`;
  - `security:audit:prod`;
  - `security:audit:all`;
  - `security:check`;
  - `install:safe`;
  - `verify`.
- Se han añadido delegaciones equivalentes en el `package.json` de la raíz.
- Se ha integrado `npm run security:check` en el workflow de despliegue.
- Se han añadido pruebas automatizadas para el verificador de seguridad npm.
- Se ha creado `08-seguridad-npm.md`.

### Por qué se ha cambiado

El objetivo es reducir el riesgo de que una instalación npm descargue paquetes desde orígenes no autorizados, ejecute scripts maliciosos de instalación o incorpore dependencias sin integridad verificable.

### Contrato vigente

- Las instalaciones deben ejecutarse con `ignore-scripts=true`.
- El registro permitido es `https://registry.npmjs.org/`.
- Todas las dependencias del lockfile deben resolverse por HTTPS.
- Todas las dependencias deben declarar integridad SRI.
- No se permiten orígenes `file:`, `git:`, `ssh:`, `github:` o equivalentes en `package-lock.json`.
- El proyecto debe permanecer privado.
- `npm run security:check` es obligatorio tras cambios en dependencias, build, scripts o código ejecutable.

### Pruebas y verificaciones

- `npm run security:lockfile`: correcto.
- `npm run security:check`: correcto.
- `npm run test`: 10 archivos de prueba, 36 pruebas superadas.

La comprobación actual avisa de `esbuild` y `fsevents` porque declaran scripts de instalación, pero quedan neutralizados por `ignore-scripts=true`.

### Riesgos, límites y pendientes

- El sistema no detecta lógica maliciosa embebida en código legítimamente importado y ejecutado en tiempo de ejecución.
- No se ha activado verificación de firmas npm por compatibilidad del ecosistema.
- Si una dependencia futura requiere ejecutar scripts de instalación, debe tratarse como excepción documentada.

## 2026-05-28 — Extracción del detalle de pregunta

### Qué se ha cambiado

- Se ha extraído el bloque de detalle de `TablaPreguntas` a componentes específicos:
  - `QuestionDetail`;
  - `QuestionOptions`;
  - `QuestionMetadata`.
- `TablaPreguntas` conserva la responsabilidad de tabla, expansión y estado temporal de edición, pero delega la presentación del detalle.
- Se mantiene `QuestionObservations` como componente especializado para observaciones.
- Se han añadido pruebas de regresión para:
  - opción correcta e incorrectas;
  - omisión de opciones vacías;
  - metadatos formateados;
  - callbacks de filtrado desde metadatos;
  - controles de edición de clasificación;
  - acciones de copiar, editar, guardar y cancelar;
  - edición de enunciado y observaciones.

### Por qué se ha cambiado

`TablaPreguntas` concentraba demasiadas responsabilidades. Esta microfase reduce su tamaño y prepara el terreno para que `ModalPregunta` pueda usar un detalle independiente sin depender de una tabla completa.

### Contrato vigente

- El comportamiento visible del detalle de pregunta se conserva.
- La opción correcta sigue resaltada con borde de éxito y mayor peso visual.
- Las opciones incorrectas siguen mostrando icono de descarte.
- Los campos de metadatos clicables siguen llamando a los callbacks de filtrado existentes.
- El estado de edición sigue viviendo en `TablaPreguntas`.
- Las observaciones siguen renderizándose como párrafos separados.

### Pruebas y verificaciones

- `npm run verify`: correcto.
- `security:check`: correcto.
- `npm audit` producción y completo: 0 vulnerabilidades.
- `npm run test`: 13 archivos de prueba, 42 pruebas superadas.
- `npm run lint`: correcto.
- `npm run build`: correcto.

### Riesgos, límites y pendientes

- `ModalPregunta` todavía reutiliza `TablaPreguntas` con `soloDetalle=true`.
- La edición sigue acoplada al estado de `TablaPreguntas`; una microfase posterior debería extraer un modelo de edición o un hook dedicado.
- `TablaPreguntas` todavía contiene la tabla resumida, expansión, navegación a modal y acciones de copia.
- El aviso de chunk grande de Vite sigue pendiente.

## 2026-05-28 — Desacoplamiento del modal de pregunta

### Qué se ha cambiado

- `ModalPregunta` deja de renderizar `TablaPreguntas` con una única pregunta y usa `QuestionDetail` directamente.
- El modal gestiona localmente el estado temporal de edición y copia necesario para el detalle embebido.
- La navegación lateral y por teclado limpia el estado temporal antes de cambiar de pregunta.
- Se han añadido atributos de accesibilidad al modal:
  - `role="dialog"`;
  - `aria-modal="true"`;
  - nombre accesible mediante `aria-labelledby`;
  - etiquetas accesibles para cerrar y navegar.
- Se ha añadido una prueba específica de `ModalPregunta`.

### Por qué se ha cambiado

El modal dependía de una tabla completa para mostrar un único detalle. Esa dependencia mezclaba responsabilidades, dificultaba pruebas focalizadas y hacía más costosa cualquier evolución del detalle de pregunta.

### Contrato vigente

- `ModalPregunta` muestra el detalle mediante `QuestionDetail`.
- El comportamiento visible del detalle se conserva: enunciado, opciones, observaciones, metadatos, copia, edición, guardado y filtros.
- La navegación por botones y por flechas izquierda/derecha sigue llamando a `onNavegar`.
- El clic sobre el fondo cierra el modal; el clic dentro del diálogo no lo cierra.
- El modal mantiene un contrato accesible para pruebas y tecnologías de asistencia.

### Pruebas y verificaciones

- `npm run test -- ModalPregunta`: 1 archivo de prueba, 6 pruebas superadas.
- `npm run test`: 14 archivos de prueba, 48 pruebas superadas.
- `npm run verify`: correcto.
- `security:check`: correcto.
- `npm audit` producción y completo: 0 vulnerabilidades.
- `npm run lint`: correcto.
- `npm run build`: correcto.

### Riesgos, límites y pendientes

- La lógica de copia todavía está duplicada entre `TablaPreguntas` y `ModalPregunta`; conviene extraerla a una utilidad compartida.
- La edición del detalle todavía se gestiona con estado local repetido; una microfase posterior debería extraer un hook específico.
- El aviso de chunk grande de Vite sigue pendiente y no forma parte de esta microfase.

## 2026-05-28 — Paginación de tablas pesadas

### Qué se ha cambiado

- Se ha añadido el hook compartido `usePaginatedRows`.
- Se ha añadido el componente común `PaginationControls`.
- `TablaPreguntas`, usada por la pestaña `Ejercicios`, renderiza solo la página visible.
- `VisorDataset`, usado por la pestaña `Tabla`, renderiza solo la página visible.
- La vista inicial queda limitada a 100 filas, con opciones de 50, 100, 250 y 500 filas.
- `VisorDataset` deja de copiar todo el array de preguntas cuando no hay ordenación activa.

### Por qué se ha cambiado

Las pestañas `Ejercicios` y `Tabla` renderizaban todos los resultados filtrados de una vez. Con datasets grandes, ese montaje inicial bloqueaba la interfaz al cambiar de pestaña. La paginación reduce el trabajo inicial de React y mantiene estable la navegación por registros.

### Contrato vigente

- Las tablas grandes deben renderizar una ventana paginada, no todo el dataset.
- La paginación mantiene el total real de resultados y muestra el rango visible.
- Los filtros siguen actuando sobre el dataset completo.
- La ordenación de `VisorDataset` sigue aplicándose sobre todos los resultados antes de paginar.
- La apertura del modal desde filas visibles se conserva.
- Las opciones de tamaño de página permitidas son 50, 100, 250 y 500.

### Pruebas y verificaciones

- `npm run test -- usePaginatedRows PaginationControls TablaPreguntas VisorDataset`: 4 archivos de prueba, 10 pruebas superadas.
- `npm run test`: 18 archivos de prueba, 58 pruebas superadas.
- `npm run verify`: correcto.
- `security:check`: correcto.
- `npm audit` producción y completo: 0 vulnerabilidades.
- `npm run lint`: correcto.
- `npm run build`: correcto.

### Riesgos, límites y pendientes

- La paginación reduce el coste de render inicial, pero no virtualiza filas; si se necesitan miles de filas visibles simultáneamente, convendrá incorporar virtualización.
- La ordenación de `VisorDataset` sigue ordenando todo el conjunto filtrado; es correcto funcionalmente, aunque podría optimizarse si el dataset crece mucho más.
- El aviso de chunk grande de Vite sigue pendiente y no forma parte de esta microfase.
