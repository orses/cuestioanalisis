# Guía para agentes

## Antes de empezar

1. Leer `AGENTS.md`.
2. Leer `documentation/README.md`.
3. Revisar `git status` en `analisis-oposiciones/`.
4. Identificar si existen cambios del usuario o de sesiones anteriores.
5. No revertir cambios ajenos.
6. Confirmar el alcance autorizado de la microfase.

## Reglas de idioma

- Comentarios y documentación: español de España.
- Ortografía, gramática y puntuación con criterio normativo.
- Código: nombres en inglés profesional.
- Texto visible en la interfaz: español natural, breve y coherente.

## Comandos de verificación

Desde la raíz:

```bash
npm run lint
npm run build
```

Desde la aplicación:

```bash
npm run lint
npm run build
```

No hay pruebas automatizadas configuradas en el estado actual.

## Particularidades del entorno

El repositorio Git está en:

```text
analisis-oposiciones/
```

Si Git marca propiedad dudosa, se puede consultar con:

```bash
git -c safe.directory="D:/A DATOS/PROYECTOS/CUESTIONARIOS_ADATOS/analisis-oposiciones" -C .\analisis-oposiciones status --short
```

En este entorno también puede aparecer un aviso de permisos al leer `C:\Users\ceped\.config\git\ignore`. Ese aviso no implica necesariamente fallo del estado del repositorio.

## Cómo trabajar por microfases

Cada microfase debe tener:

- objetivo claro;
- archivos afectados;
- contrato vigente;
- verificación ejecutada;
- documentación posterior si hay commit.

Secuencia recomendada:

1. Leer el código implicado.
2. Formular el cambio mínimo.
3. Aplicar cambios.
4. Ejecutar verificación focalizada.
5. Ejecutar verificación completa si cambia un contrato compartido.
6. Documentar el resultado.

## Zonas delicadas

### `parser.ts`

No modificar normalizaciones sin pruebas o fixtures. El parser tolera muchas variantes de cabecera y contiene límites de seguridad para archivos grandes.

### `App.tsx`

Es el centro de estado. Cambios aparentemente pequeños pueden afectar carga, filtros, exportación, persistencia o navegación.

### `TablaPreguntas.tsx`

Actualmente sirve para tabla, detalle expandido y modal. Cualquier cambio visual debe comprobarse en:

- vista `ejercicios`;
- modal de pregunta;
- modo edición;
- observaciones;
- filtros desde metadatos.

### `useFiltros.ts`

Los filtros están persistidos en `localStorage`. Los cambios deben contemplar compatibilidad con estados antiguos.

### `storage.ts`

IndexedDB mantiene datos de usuario. Cualquier cambio de esquema requiere estrategia de migración.

## Criterios de diseño

- Mantener interfaz de herramienta de análisis: densa, clara y operativa.
- Evitar cambios cosméticos aislados que aumenten estilos inline.
- Preferir componentes pequeños con responsabilidad única.
- Usar iconos de Lucide cuando existan.
- Cuidar responsive en cabecera, filtros, tablas y modales.
- Preservar contraste y foco visible.

## Estado que conviene comprobar al retomar

- Si `src/components/TablaPreguntas.tsx` sigue modificado por el ajuste de observaciones.
- Si hay servidor Vite activo en `5173`.
- Si la documentación de esta carpeta ya está dentro del control de versiones que se vaya a usar.
- Si se ha añadido una suite de pruebas desde esta revisión.

