# Guía rápida

## Qué es

`CuestioAnálisis` es una aplicación web de análisis de cuestionarios de oposiciones. Permite importar preguntas desde CSV, cargar un catálogo de cuestionarios, filtrar, explorar, editar datos de preguntas, generar informes, consultar estadísticas y preparar simulacros.

La aplicación es una SPA de React servida con Vite. El despliegue usa la base `/cuestioanalisis/`, configurada en `analisis-oposiciones/vite.config.ts`.

## Tecnologías

| Área | Tecnología |
| --- | --- |
| Interfaz | React 19, TypeScript, JSX |
| Bundler | Vite 7 |
| Estilos | Tailwind CSS 4, variables CSS propias |
| Gráficos | Recharts, Chart.js, React Chart.js 2 |
| Iconos | Lucide React |
| CSV | PapaParse |
| Excel | JSZip y lectura directa de XML interno |
| Persistencia local | IndexedDB y localStorage |
| Calidad | TypeScript estricto, ESLint, CodeQL, auditoría npm en GitHub Actions |

## Estructura de carpetas

```text
CUESTIONARIOS_ADATOS/
├─ AGENTS.md
├─ package.json
├─ iniciar_servidor.bat
├─ iniciar_servidor.sh
├─ DATOS/
├─ MATERIALES/
├─ documentation/
└─ analisis-oposiciones/
   ├─ package.json
   ├─ vite.config.ts
   ├─ src/
   ├─ public/
   ├─ dist/
   └─ .github/workflows/
```

## Puntos de entrada

- `analisis-oposiciones/src/main.tsx`: monta React en `#root`.
- `analisis-oposiciones/src/App.tsx`: orquestador principal de estado, carga, filtros, vistas, exportaciones y modales.
- `analisis-oposiciones/src/types/index.ts`: contratos TypeScript del dominio.
- `analisis-oposiciones/src/utils/parser.ts`: parseo de preguntas, catálogo, Excel, normalización y límites de seguridad.
- `analisis-oposiciones/src/hooks/useFiltros.ts`: motor de filtros generales.
- `analisis-oposiciones/src/hooks/useFiltrosCatalogo.ts`: filtros del catálogo.

## Modelo mental del flujo

1. El usuario carga uno o varios CSV de preguntas.
2. `App` llama a `csvTieneIdCuestionario` para detectar si falta `id_cuestionario`.
3. Si falta el identificador, se abre `ModalCuestionarioId`.
4. `procesarCSV` transforma filas en `Pregunta[]` y `ConceptoAdyacente[]`.
5. `normalizarDatasetAnalisis` recalcula metadatos y normaliza aplicaciones.
6. `App` guarda el resultado en estado y lo persiste en IndexedDB.
7. `useFiltros` calcula opciones disponibles y `preguntasFiltradas`.
8. Las vistas reciben `preguntasFiltradas` y renderizan resúmenes, tablas, análisis o simulacros.
9. La edición se guarda como un mapa de cambios en memoria (`ediciones`) y se aplica sobre el dataset original mediante `preguntasEditadas`.
10. Las exportaciones usan PapaParse para generar CSV o utilidades propias para Markdown.

## Comandos

Desde la raíz:

```bash
npm run dev
npm run build
npm run lint
```

Desde `analisis-oposiciones/`:

```bash
npm run dev:local
npm run dev
npm run build
npm run lint
```

No existe script `test` en el estado actual.

## Datos de ejemplo

La carpeta `DATOS/` contiene ficheros útiles para pruebas manuales:

- `dataset-ejemplo.csv`
- `preguntas-con-id.csv`
- `preguntas-sin-id.csv`
- `catalogo-prueba.csv`

## Observaciones operativas

- El repositorio Git detectado está en `analisis-oposiciones/`, no necesariamente en la raíz del workspace.
- En este entorno puede aparecer el aviso de Git por propiedad dudosa. Para consultar estado se usó:

```bash
git -c safe.directory="D:/A DATOS/PROYECTOS/CUESTIONARIOS_ADATOS/analisis-oposiciones" -C .\analisis-oposiciones status --short
```

- El servidor de desarrollo previsto es `http://127.0.0.1:5173/cuestioanalisis/`.

