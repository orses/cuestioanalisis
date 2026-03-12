# CuestioAnálisis — Análisis Estratégico de Oposiciones

Aplicación web para el análisis de cuestionarios de oposiciones. Permite importar bancos de preguntas en formato CSV y obtener estadísticas, visualizaciones y herramientas de estudio avanzadas.

## Funcionalidades principales

- **Resumen estadístico**: distribución por organismo, escala, año, materia, bloque y tema.
- **Explorador de preguntas**: navegación, filtrado avanzado y edición inline de preguntas.
- **Visor de datos brutos**: vista tabular tipo hoja de cálculo con ordenación por columnas.
- **Análisis estadístico**: chi-cuadrado, correlación, análisis de distractores, posición de la respuesta correcta, preguntas anuladas y más.
- **Búsqueda semántica**: localización de preguntas por concepto o palabra clave.
- **Detección de duplicados**: identificación de preguntas repetidas o muy similares.
- **Comparativa entre ejercicios**: diferencias y tendencias entre convocatorias.
- **Tendencias históricas**: evolución temporal de materias, bloques y temas.
- **Predicción de temas**: análisis de probabilidad de aparición basado en datos históricos.
- **Simulacro inteligente**: generación de exámenes de práctica con corrección automática.
- **Generador de cuestionarios**: creación personalizada de cuestionarios con criterios a medida.
- **Catálogo de cuestionarios**: gestión de metadatos de los cuestionarios importados.
- **Exportación**: descarga de datos filtrados y generación de informes.

## Tecnologías

| Categoría       | Herramienta                    |
|-----------------|--------------------------------|
| Framework       | React 19 + TypeScript          |
| Bundler         | Vite 7                         |
| Estilos         | Tailwind CSS 4                 |
| Gráficos        | Recharts · Chart.js            |
| Iconos          | Lucide React                   |
| Análisis CSV    | PapaParse                      |

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/<usuario>/cuestioanalisis.git
cd cuestioanalisis

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173/cuestioanalisis/`.

## Uso

1. Abrir la aplicación en el navegador.
2. Pulsar «Seleccionar CSV de preguntas» para importar uno o varios archivos CSV (delimitador `|`).
3. Opcionalmente, cargar un catálogo CSV con metadatos de los cuestionarios.
4. Navegar entre las diferentes vistas mediante las pestañas de la barra superior.

## Despliegue en GitHub Pages

El repositorio incluye un workflow de GitHub Actions (`.github/workflows/deploy.yml`) que despliega automáticamente la aplicación en GitHub Pages al hacer push a la rama `main`.

Para activarlo, ir a **Settings → Pages** en el repositorio de GitHub y seleccionar **GitHub Actions** como fuente.

## Licencia

Proyecto de uso privado.
