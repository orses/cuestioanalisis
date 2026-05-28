# Flujos principales

## Carga inicial

1. `App` intenta recuperar dataset y catálogo desde IndexedDB.
2. Si hay dataset, lo normaliza con `normalizarDatasetAnalisis`.
3. Si hay catálogo, lo normaliza con `normalizarCatalogo`.
4. Se restaura `vistaActual`, tema y filtros desde `localStorage`.
5. Si no hay dataset, se muestra la pantalla de carga inicial.

## Importación de preguntas

1. El usuario selecciona uno o varios CSV.
2. `handleFileUpload` comprueba si cada CSV tiene la columna `id_cuestionario`.
3. Si falta en alguno, se abre `ModalCuestionarioId`.
4. Tras confirmar, `procesarArchivos` ejecuta `procesarCSV` por archivo.
5. Se combinan preguntas, conceptos, ejercicios y cuestionarios.
6. Se deduplican preguntas con `id_cuestionario::id`.
7. Se normaliza el dataset completo.
8. Se actualiza el estado de React.
9. Se guarda el dataset en IndexedDB.

Punto que conviene revisar: si se cargan a la vez archivos con `id_cuestionario` y archivos sin él, el modal recibe actualmente todos los archivos, no solo los que carecen de identificador.

## Carga de catálogo

1. El usuario selecciona CSV, XLSX o XLSM.
2. `parsearCatalogo` delega en lector CSV o Excel.
3. Se crean objetos `CuestionarioMeta`.
4. Se normaliza y agrupa el catálogo.
5. Se actualiza estado e IndexedDB.
6. `useFiltrosCatalogo` recalcula opciones y catálogo filtrado.

## Filtros generales

`useFiltros` centraliza filtros por:

- materia;
- bloque;
- tema;
- aplicación;
- respuesta correcta;
- anulada;
- año;
- organismo;
- escala;
- acceso;
- tipo de ejercicio;
- cuestionario;
- búsqueda textual.

La búsqueda admite cláusulas `OR`/`O`, `AND`/`Y` y negación con `NO`, `NOT` o `-`.

## Filtros de catálogo

`useFiltrosCatalogo` filtra por:

- versión;
- tipo;
- estado;
- sistema operativo;
- paquete ofimático.

Cuando hay filtros de catálogo activos, `useFiltros` limita también las preguntas a los cuestionarios incluidos en el catálogo filtrado.

## Edición de preguntas

1. `TablaPreguntas` permite iniciar edición.
2. Los campos temporales viven en el componente.
3. Al guardar, se llama a `guardarEdicion` de `App`.
4. `guardarEdicion` filtra claves permitidas con `ALLOWED_EDICION_KEYS`.
5. Los cambios se guardan en `ediciones`.
6. `preguntasEditadas` aplica los cambios sobre el dataset original.

Las ediciones no modifican inmediatamente IndexedDB. Se reflejan en la exportación CSV y en las vistas derivadas de `preguntasEditadas`.

## Exportación CSV

Hay dos exportaciones:

- dataset completo con ediciones aplicadas;
- subconjunto filtrado.

Ambas usan PapaParse con delimitador `|` y descargan un CSV con BOM UTF-8.

## Informe Markdown

`descargarInforme` genera un informe Markdown a partir de las preguntas filtradas, el nombre de archivos y contexto de filtrado.

## Modal de pregunta

1. Una vista llama a `navegarAPregunta`.
2. `App` guarda el identificador en `preguntaAExpandir`.
3. `ModalPregunta` busca la pregunta en el dataset.
4. La navegación izquierda/derecha usa `preguntasNavegacion`, normalmente filtradas.
5. El detalle se renderiza reutilizando `TablaPreguntas` con `soloDetalle=true`.

## Tabla de dataset

`VisorDataset` permite:

- cambiar entre vista reducida y cruda;
- ordenar columnas;
- redimensionar columnas;
- sincronizar barras de desplazamiento;
- abrir pregunta mediante `onVerPregunta`.

No hay virtualización de filas. Con datasets grandes, el coste de renderizado puede ser relevante.

