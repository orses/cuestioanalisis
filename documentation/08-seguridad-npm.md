# Seguridad npm y cadena de suministro

## Objetivo

Reducir el riesgo de introducir o ejecutar software malicioso al instalar dependencias npm, actualizar librerías o ejecutar herramientas del ecosistema Node.

Este sistema no sustituye una revisión humana de dependencias nuevas, pero añade barreras automáticas contra los vectores más habituales:

- scripts de instalación maliciosos;
- paquetes descargados desde registros no autorizados;
- URLs no HTTPS;
- dependencias sin integridad verificable;
- vulnerabilidades conocidas de severidad alta o crítica;
- despliegues sin comprobación previa de cadena de suministro.

## Controles implantados

### 1. `.npmrc` endurecido

Hay `.npmrc` en la raíz del workspace y en `analisis-oposiciones/`.

Política obligatoria:

```ini
ignore-scripts=true
audit=true
fund=false
package-lock=true
save-exact=true
strict-ssl=true
registry=https://registry.npmjs.org/
```

El punto más importante es `ignore-scripts=true`: bloquea la ejecución automática de scripts `preinstall`, `install`, `postinstall` y similares durante instalaciones npm.

### 2. Verificación del lockfile

El script `scripts/security/verify-npm-supply-chain.mjs` comprueba:

- que existe `.npmrc` con la política obligatoria;
- que `package.json` declara `private: true`;
- que existen los scripts de seguridad;
- que `package-lock.json` usa `lockfileVersion` 3 o superior;
- que cada dependencia procede de `https://registry.npmjs.org/`;
- que cada dependencia usa HTTPS;
- que cada dependencia tiene integridad SRI;
- que las dependencias con scripts de instalación quedan neutralizadas por `ignore-scripts=true`;
- que no se usan orígenes `file:`, `git:`, `ssh:`, `github:` o equivalentes.

### 3. Auditoría npm

`security:check` ejecuta:

```bash
npm run security:lockfile
npm run security:audit:prod
npm run security:audit:all
```

La auditoría falla si hay vulnerabilidades de severidad alta o superior.

### 4. Integración en despliegue

El workflow de GitHub Pages ejecuta `npm run security:check` antes de construir la aplicación. Un fallo bloquea el despliegue.

## Comandos obligatorios

### Instalación segura

```bash
npm run install:safe
```

Este comando ejecuta:

```bash
npm ci --ignore-scripts
npm run security:check
```

### Comprobación de seguridad

```bash
npm run security:check
```

### Verificación completa del proyecto

```bash
npm run verify
```

Ejecuta seguridad, pruebas, lint y build.

## Norma de trabajo

No se debe considerar finalizada ninguna modificación que cambie código, dependencias, scripts, build o importación de datos sin ejecutar:

```bash
npm run security:check
npm run test
npm run lint
npm run build
```

Si el cambio solo afecta documentación, basta con revisar coherencia documental y estado de Git, salvo que la documentación describa comandos o contratos técnicos.

## Añadir o actualizar dependencias

Procedimiento obligatorio:

1. Justificar por qué hace falta la dependencia.
2. Preferir dependencias mantenidas, conocidas y con API estable.
3. Instalar con la política del proyecto activa.
4. Ejecutar `npm run security:check`.
5. Revisar cambios en `package.json` y `package-lock.json`.
6. Ejecutar pruebas, lint y build.
7. Documentar la microfase.

## Resultado actual

La comprobación actual detecta dos dependencias con scripts de instalación declarados:

- `esbuild`;
- `fsevents`.

No bloquean la instalación porque `ignore-scripts=true` impide que esos scripts se ejecuten automáticamente.

`npm audit --audit-level=high` no informa vulnerabilidades en producción ni en desarrollo.

## Límites conocidos

- El sistema no prueba si una librería legítima contiene lógica maliciosa en tiempo de ejecución.
- El sistema no sustituye la revisión humana al añadir dependencias.
- No se ha activado verificación de firmas de paquetes porque no todos los paquetes del ecosistema npm la ofrecen de forma homogénea.
- Si en el futuro una dependencia necesita scripts de instalación reales, habrá que evaluarla explícitamente y documentar la excepción.

