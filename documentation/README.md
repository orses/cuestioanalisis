# Documentación del proyecto

Última revisión: 28 de mayo de 2026.

Esta carpeta resume el estado técnico de `CUESTIONARIOS_ADATOS` para que una sesión futura pueda retomar el trabajo con rapidez y con el contexto suficiente. La aplicación principal está en `analisis-oposiciones/`.

## Lectura recomendada

1. `00-guia-rapida.md`: visión general, comandos y mapa mental del proyecto.
2. `01-arquitectura.md`: capas, responsabilidades y dependencias principales.
3. `02-modelo-datos-y-csv.md`: contratos de datos, CSV, catálogo y persistencia.
4. `03-flujos-principales.md`: carga, filtros, edición, exportación y navegación.
5. `04-componentes-y-vistas.md`: componentes, utilidades y puntos calientes.
6. `05-diagnostico-y-plan-de-mejora.md`: diagnóstico técnico y plan de mejora incremental.
7. `06-guia-para-agentes.md`: reglas prácticas para futuras sesiones de trabajo.
8. `07-registro-microfases.md`: registro de microfases completadas, verificaciones y contratos.
9. `08-seguridad-npm.md`: política de seguridad para instalaciones y cadena de suministro npm.

## Reglas esenciales

- Leer `AGENTS.md` antes de tocar el proyecto.
- Documentación y comentarios siempre en español de España, con ortografía y gramática cuidadas.
- Código, variables, funciones, clases y objetos con nombres en inglés profesional.
- No editar, crear, borrar, mover, confirmar ni ejecutar mantenimiento sin autorización explícita de la microfase.
- Tras un commit autorizado, documentar la microfase antes de iniciar otra.

## Comandos habituales

Desde la raíz del workspace:

```bash
npm run dev
npm run build
npm run lint
```

Desde `analisis-oposiciones/`:

```bash
npm run dev:local
npm run build
npm run lint
```

La URL de desarrollo prevista es:

```text
http://127.0.0.1:5173/cuestioanalisis/
```

## Estado técnico observado

- `npm run lint` termina correctamente.
- `npm run build` terminó correctamente en la revisión previa del componente de observaciones.
- No hay script de pruebas automatizadas en `package.json`.
- En esta revisión existía un cambio no confirmado en `analisis-oposiciones/src/components/TablaPreguntas.tsx`, asociado al renderizado de observaciones con saltos de línea y separación entre párrafos.
