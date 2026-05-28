# Modelo de datos y CSV

## Tipos principales

Los tipos de dominio están en `analisis-oposiciones/src/types/index.ts`.

### `Pregunta`

Representa una pregunta importada y normalizada:

- `id`: identificador interno calculado.
- `id_cuestionario`: identificador del cuestionario.
- `numero_original`: número de pregunta en el cuestionario.
- `metadatos`: datos estructurados del ejercicio.
- `materia`, `bloque`, `tema`, `aplicacion`: clasificación temática.
- `enunciado`: texto de la pregunta.
- `opciones`: respuestas por letra.
- `correcta`: letra correcta o `null`.
- `anulada`: indicador booleano.
- `observaciones`: texto libre.
- `conceptos_clave`: lista de conceptos.
- `distractores`: opciones incorrectas transformadas en conceptos adyacentes.

### `MetadatosEjercicio`

Se obtiene principalmente desde el campo `ejercicio`:

- `organismo`
- `escala`
- `año`
- `tipoConvocatoria`
- `acceso`
- `cupo`
- `tipo`
- `modelo`
- `variante`
- `extraordinaria`

Los códigos se formatean en `src/utils/metadata.ts`.

### `CuestionarioMeta`

Representa una fila del catálogo de cuestionarios:

- identificador, familia, cuestionario, versión, tipo, estado y preparación;
- banderas temáticas;
- paquete ofimático;
- versión del sistema operativo;
- descripción;
- número de preguntas.

### `DatasetAnalisis`

Contenedor de trabajo:

- `preguntas`
- `conceptos_globales`
- `ejercicios_unicos`
- `cuestionarios_cargados`

## CSV de preguntas

El CSV de preguntas usa delimitador `|`. Los campos admitidos se leen de forma tolerante con acentos y separadores.

Campos relevantes:

| Campo conceptual | Cabeceras aceptadas o uso |
| --- | --- |
| Identificador de cuestionario | `id_cuestionario` |
| Ejercicio | `ejercicio`, `id_ejercicio` |
| Número | `numero`, `num_pregunta`, `num`, `nº`, `n.º`, variantes codificadas |
| Año | `año`, `ano`, o inferencia desde `ejercicio` |
| Enunciado | `pregunta` |
| Opciones | `respuesta_a`, `respuesta_b`, `respuesta_c`, `respuesta_d` |
| Correcta | `correcta` |
| Anulada | `anulada` |
| Clasificación | `materia`, `bloque`, `tema`, `aplicacion` |
| Observaciones | `observaciones` |

Si falta `id_cuestionario`, la aplicación pide un identificador manual mediante `ModalCuestionarioId`.

## Identificadores y deduplicación

`procesarCSV` crea un `baseId` con:

```text
id_cuestionario + ejercicio + numero
```

Si no hay `id_cuestionario`, usa:

```text
ejercicio + numero
```

Los duplicados dentro del mismo lote reciben sufijo `_dupN`.

En `App.tsx`, la deduplicación de preguntas se hace con la clave compuesta:

```text
id_cuestionario::id
```

## Normalización de metadatos

`parsearMetadatosEjercicio` intenta extraer códigos desde el texto de `ejercicio`. Reconoce:

- escalas: `AUX`, `ADV`, `PSX`;
- convocatoria: `ES`, `BT`;
- acceso: `LI`, `PI`, `PC`, `PV`;
- cupo: `GE`, `DI`;
- ejercicio: `PRI`, `SEG`, `TER`, `UNI`, `ESP`;
- modelo: `A`, `B`;
- extraordinaria: token `EXT` o texto relacionado.

`normalizarDatasetAnalisis` reevalúa metadatos a partir del ejercicio base y normaliza `aplicacion`.

## Normalización de aplicación

`normalizarPrograma` elimina años, versiones numéricas y variantes como «Clásico». También corrige algunos alias:

- `palabra` → `Word`
- `sobresalir` → `Excel`
- `acceso` → `Access`
- `perspectiva` → `Outlook`
- `borde` → `Edge`
- `ventanas` → `Windows`

## Catálogo

El catálogo se puede cargar desde CSV, XLSX o XLSM.

La lectura de Excel es manual:

1. Se abre el ZIP con JSZip.
2. Se validan límites de entradas y tamaño descomprimido.
3. Se leen `workbook.xml`, relaciones, `sharedStrings.xml` y la primera hoja.
4. Se convierte la hoja en filas de objetos.
5. Se normalizan cabeceras y valores.

El catálogo se normaliza y agrupa por `id_cuestionario` o por una clave derivada de cuestionario, versión y tipo.

## Persistencia

IndexedDB guarda:

- dataset cargado y nombres de archivo;
- catálogo.

`localStorage` guarda:

- tema (`theme`);
- vista activa (`vistaActual`);
- filtros generales (`filtrosGenerales`);
- filtros de catálogo (`filtrosCatalogo`);
- anchuras del catálogo (`catalogoColumnWidths`).

## Riesgos del contrato actual

- El contrato CSV está implícito en `parser.ts`, no en un esquema declarativo.
- El parseo de Excel es manual y requiere pruebas de regresión.
- Las normalizaciones alteran datos de entrada; hay que distinguir claramente dato crudo y dato visual.
- La asignación de `id_cuestionario` para cargas mixtas con archivos con y sin identificador necesita revisión de experiencia y contrato.

