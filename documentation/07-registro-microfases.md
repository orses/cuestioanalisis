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

## 2026-05-28 — Paletas categóricas sin colores semánticos

### Qué se ha cambiado

- La pestaña `Comparativa` usa una paleta categórica fría y morada para barras, radar, bordes de convocatorias y distribución A/B/C/D.
- Las materias dejan de usar rojo, verde o amarillo como identificadores de categoría.
- `seguridad` deja de mostrarse en rojo y pasa a morado.
- Los KPIs no semánticos de `Resumen`, como materias y bloques, dejan de usar verde o amarillo.
- Se ha creado `colorPalettes.ts` para centralizar paletas compartidas sin romper Fast Refresh.
- Se han añadido pruebas para impedir que las paletas categóricas vuelvan a ocupar rangos de rojo, verde o amarillo.

### Por qué se ha cambiado

Rojo, verde y amarillo tienen una carga semántica fuerte: error, éxito, peligro, aviso o estado. Usarlos como simples categorías en gráficas o materias podía inducir a interpretaciones incorrectas.

### Contrato vigente

- Rojo, verde y amarillo quedan reservados para estados semánticos.
- Las categorías comparativas usan azul, cian, morado, fucsia o grises neutros.
- Las materias usan una paleta categórica no semántica.
- `Anuladas` puede seguir usando rojo porque representa una condición real.

### Pruebas y verificaciones

- `npm run test -- colorPalettes`: 1 archivo de prueba, 3 pruebas superadas.
- `npm run test`: 19 archivos de prueba, 61 pruebas superadas.
- `npm run verify`: correcto.

### Riesgos, límites y pendientes

- Quedan otros paneles analíticos donde rojo, verde o amarillo sí expresan tendencia, alerta o estado; no se han cambiado por tener significado semántico.
- La paleta categórica se ha ajustado por código, no mediante un sistema de temas completo.

## 2026-05-28 — Cabecera informática básica en catálogo

### Qué se ha cambiado

- El parser del catálogo acepta `informática básica` como alias de `informatica`.
- También se aceptan variantes sin tilde y con guion bajo:
  - `informatica basica`;
  - `informática_básica`;
  - `informatica_basica`.
- La cabecera visible del catálogo pasa de `Informática` a `Informática básica`.
- Se amplía el ancho por defecto de esa columna.

### Por qué se ha cambiado

El catálogo podía traer datos en una columna llamada `informática básica`, pero el parser solo buscaba `informatica` o `informática`. Por eso los valores existían en origen, pero no se reflejaban en la tabla.

### Contrato vigente

- Todas las variantes admitidas de `informática básica` alimentan el campo interno `informatica`.
- La tabla del catálogo sigue usando el campo `informatica`, pero lo presenta como `Informática básica`.
- La normalización de catálogo sigue agrupando filas y acumulando banderas booleanas.

### Pruebas y verificaciones

- `npm run test -- parser colorPalettes`: 2 archivos de prueba, 14 pruebas superadas.
- `npm run test`: 19 archivos de prueba, 62 pruebas superadas.
- `npm run verify`: correcto.
- `security:check`: correcto.
- `npm audit` producción y completo: 0 vulnerabilidades.
- `npm run lint`: correcto.
- `npm run build`: correcto.

### Riesgos, límites y pendientes

- Si aparecen nuevas denominaciones en el catálogo real, habrá que añadirlas como alias explícitos.
- El modelo interno conserva el nombre histórico `informatica` para evitar una migración amplia.

## 2026-05-28 — Carga diferida y color estable por organismo en comparativa

### Qué se ha cambiado

- `App.tsx` carga con `React.lazy` las vistas principales y los modales pesados.
- `parser`, `Papa Parse` y el generador de informes se cargan bajo demanda desde las acciones que los necesitan.
- La normalización de programas se ha extraído a `utils/programs.ts` para que filtros, resumen, tabla, metadatos e informes no arrastren el parser CSV/Excel.
- El selector de `Comparativa` asigna el borde izquierdo por organismo, no por combinación de organismo y escala.
- Se ha añadido un helper de paletas para asignar colores categóricos estables sin consumir colores duplicados en claves repetidas.
- Se han añadido pruebas de componente y pruebas estructurales de bundle.

### Por qué se ha cambiado

La pestaña `Comparativa` podía mostrar organismos iguales con colores distintos cuando cambiaba la escala. Eso generaba una lectura visual incoherente. Además, el bundle inicial seguía cargando vistas y utilidades que solo son necesarias en acciones o pestañas concretas.

### Contrato vigente

- Todas las convocatorias del mismo organismo deben compartir exactamente el mismo color de borde izquierdo en `Comparativa`.
- Cambiar la escala no debe cambiar el color visual del organismo.
- Las vistas pesadas y los modales principales deben permanecer en carga diferida.
- `parser.ts` no debe importarse estáticamente fuera del propio parser; los consumidores que solo normalizan aplicaciones deben usar `utils/programs.ts`.
- Las categorías comparativas deben seguir evitando rojo, verde y amarillo como colores no semánticos.

### Pruebas y verificaciones

- `npm run test -- bundleStructure Comparativa colorPalettes parser`: 4 archivos de prueba, 19 pruebas superadas.
- `npm run test`: 21 archivos de prueba, 67 pruebas superadas.
- `npm run verify`: correcto.
- `security:check`: correcto.
- `npm audit` producción y completo: 0 vulnerabilidades.
- `npm run lint`: correcto.
- `npm run build`: correcto.
- Tamaño del chunk inicial principal: de 1.103,76 kB antes de la microfase a 246,41 kB tras la carga diferida y la extracción de `utils/programs.ts`.
- Chunks diferidos relevantes del build final: `parser` 109,57 kB, `papaparse.min` 19,79 kB y `BarChart` 372,39 kB.

### Riesgos, límites y pendientes

- La primera entrada a una vista diferida puede tener una espera breve de carga del chunk correspondiente.
- `BarChart` sigue siendo el chunk diferido más grande por la dependencia de gráficas; no bloquea el arranque inicial.
- La normalización de programas conserva el nombre histórico `normalizarPrograma` para evitar una migración amplia de dominio en esta microfase.

## 2026-05-28 — Colores corporativos por organismo en comparativa

### Qué se ha cambiado

- `Comparativa` deja de usar una paleta categórica genérica para el borde izquierdo de las convocatorias cuando el organismo tiene color corporativo documentado.
- Se crea `organismBrandColors.ts` con un registro explícito de colores por organismo, normalización de claves y fallback estable para organismos no documentados.
- Se corrige la normalización de organismos con abreviaturas, acentos y partículas administrativas, como `Ayuntamiento de Ávila`.
- Se amplían las pruebas de `Comparativa` para verificar que INAP y SERGAS reciben el color de marca esperado.
- Se añaden pruebas unitarias específicas para normalización, colores conocidos, grado de confianza de las fuentes y fallback.

### Por qué se ha cambiado

El color del borde izquierdo en el selector de convocatorias estaba resolviendo una identidad visual interna, no la identidad real del organismo. Esto era insuficiente para organismos con colores corporativos reconocibles, como INAP, Xunta, UDC, SESCAM, JCCM, Aragón o Comunidad de Madrid.

### Contrato vigente

- Si el organismo tiene color corporativo registrado, `Comparativa` debe usar exactamente ese color para su borde izquierdo.
- La normalización debe igualar variantes con acentos, mayúsculas, separadores y fórmulas largas de ayuntamiento.
- Si un organismo no tiene fuente cromática suficientemente documentada, debe conservar un fallback categórico estable y no semántico.
- Cada color registrado debe indicar su grado de confianza:
  - `official-value`, cuando la fuente oficial publica valor RGB, WEB, HEX o equivalente directo;
  - `official-pantone`, cuando la fuente oficial publica Pantone y se aplica una conversión web razonable;
  - `official-logo`, cuando la fuente oficial solo publica o referencia el logotipo y el color se aproxima desde esa identidad visual.

### Colores registrados

- INAP: `#F2C300`, aproximado desde el logotipo institucional.
- Xunta y SERGAS: `#007BC4`, azul corporativo Xunta, Pantone 7461 C.
- UDC: `#C3267D`, fucsia UDC, Pantone 233 CVC.
- JCCM: `#E51A4C`, rojo carmesí de la marca Castilla-La Mancha, Pantone 1925 C.
- SESCAM: `#012169`, conversión web de Pantone 280.
- Junta de Extremadura: `#00A651`, conversión web de Pantone 354.
- Aragón: `#FCE100`, amarillo corporativo, Pantone 109.
- Navarra: `#DA291C`, conversión web de Pantone 485.
- Comunidad de Madrid: `#FF0000`, HTML corporativo publicado para Pantone 032.
- UCM: `#000000`, logotipo oficial en negro.
- Ayuntamiento de Ávila: `#B21F2D`, aproximado desde la imagen institucional localizada.

### Fuentes cromáticas consultadas

- INAP: página oficial de uso del logotipo institucional.
- Xunta: manual de identidad corporativa, color principal `#007BC4`, Pantone 7461 C.
- UDC: página de identidad corporativa de la ETS de Náutica y Máquinas, fucsia `#C3267D`.
- SERGAS: instrucciones de publicaciones, que remiten al manual de identidad corporativa de la Xunta.
- JCCM: manual de marca resumido de Castilla-La Mancha, rojo carmesí `#E51A4C`.
- SESCAM: manual de identidad corporativa, versión a una tinta Pantone 280.
- Junta de Extremadura: manual de identidad corporativa, verde Pantone 354.
- Aragón: documento oficial de señalización de obras públicas, amarillo `#FCE100`.
- Navarra: decreto foral del símbolo oficial, rojo Pantone 485.
- Comunidad de Madrid: manual de identidad corporativa, HTML `#FF0000`.
- UCM: página oficial de logos de la Biblioteca Complutense, logotipo en negro.

### Pruebas y verificaciones

- `npm run test -- Comparativa organismBrandColors colorPalettes`: 3 archivos de prueba, 9 pruebas superadas.
- `npm run test`: 22 archivos de prueba, 71 pruebas superadas.
- `npm run verify`: correcto.
- `security:check`: correcto.
- `npm audit` producción y completo: 0 vulnerabilidades.
- `npm run lint`: correcto.
- `npm run build`: correcto.

### Riesgos, límites y pendientes

- Algunas administraciones publican Pantone o logotipo, pero no HEX; esos casos quedan marcados con `official-pantone` u `official-logo`.
- El color de INAP y el del Ayuntamiento de Ávila dependen de aproximación visual desde fuente oficial, por ausencia de equivalencia HEX pública en texto.
- Ayuntamiento de Cenes de la Vega conserva fallback hasta localizar una fuente cromática institucional sólida.
- Si se incorporan nuevos organismos, deberán añadirse al registro con fuente y grado de confianza antes de considerarlos corporativos.

## 2026-05-28 - Tarjetas configurables y ordenadas en comparativa

### Qué se ha cambiado

- Se ha sustituido la distribución por columnas del selector de convocatorias de `Comparativa` por una cuadrícula estable.
- Se ha añadido el control `Tarjetas por fila`, con opciones de 1 a 5 tarjetas por fila.
- Las tarjetas muestran la información principal sin truncado con puntos suspensivos y separan los metadatos en etiquetas legibles.
- La tarjeta seleccionada queda marcada mediante estado accesible, casilla activa, borde reforzado, sombra y etiqueta `Seleccionada`.
- `generarComparativa` incorpora los metadatos necesarios para ordenar y mostrar convocatorias: tipo de convocatoria, acceso, cupo, tipo de ejercicio, modelo y variante.
- Se han ampliado las pruebas focalizadas de `Comparativa` para cubrir orden, legibilidad, selección, límite de cuatro convocatorias y configuración de tarjetas por fila.

### Por qué se ha cambiado

El selector de comparativa dificultaba la lectura de convocatorias porque comprimía las tarjetas en columnas estrechas y truncaba el identificador. Además, el orden por etiqueta completa mezclaba organismos, escalas, años y accesos, lo que hacía más costoso localizar la convocatoria correcta y confirmar cuál estaba seleccionada.

### Contrato vigente

- Las convocatorias de comparativa se ordenan por organismo, escala, año, acceso, tipo de convocatoria, cupo, tipo de ejercicio, modelo, variante y etiqueta de ejercicio.
- La escala usa el orden de dominio `AUX`, `ADV`, `PSX`; las escalas desconocidas se ordenan alfabéticamente tras las conocidas.
- El selector permite elegir entre 1, 2, 3, 4 y 5 tarjetas por fila.
- El identificador de la convocatoria debe poder partir línea y no debe ocultarse mediante truncado visual.
- La selección debe ser visible y accesible mediante `aria-pressed`, `data-selected`, casilla activa y etiqueta textual.
- Se mantiene el límite máximo de cuatro convocatorias seleccionadas.

### Pruebas y verificaciones

- `npm run test -- tests/components/Comparativa.test.tsx`: 1 archivo de prueba, 5 pruebas superadas.
- `npm run test`: 22 archivos de prueba, 75 pruebas superadas.

### Riesgos, límites y pendientes

- En pantallas estrechas, elegir muchas tarjetas por fila puede activar desplazamiento horizontal; es intencionado para respetar el número de columnas elegido por el usuario.
- El orden de escalas queda codificado para `AUX`, `ADV` y `PSX`; si se incorporan nuevas escalas con orden de negocio específico, habrá que añadirlas al contrato.
- No se ha ejecutado `npm run verify` en esta microfase; las verificaciones realizadas cubren la prueba focalizada y la suite completa de Vitest.
