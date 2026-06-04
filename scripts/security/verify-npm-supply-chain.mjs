import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const REQUIRED_NPMRC = new Map([
    ['ignore-scripts', 'true'],
    ['audit', 'true'],
    ['fund', 'false'],
    ['package-lock', 'true'],
    ['save-exact', 'true'],
    ['strict-ssl', 'true'],
    ['registry', 'https://registry.npmjs.org/'],
]);

const ALLOWED_REGISTRY_HOSTS = new Set(['registry.npmjs.org']);
const SAFE_INTEGRITY = /^sha(?:256|384|512)-[A-Za-z0-9+/=]+$/;

function readText(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
    return JSON.parse(readText(filePath));
}

function parseNpmrc(content) {
    const result = new Map();

    content
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && !line.startsWith(';'))
        .forEach(line => {
            const separator = line.indexOf('=');
            if (separator < 0) return;
            const key = line.slice(0, separator).trim().toLowerCase();
            const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
            result.set(key, value);
        });

    return result;
}

function verifyNpmrc(rootDir, report) {
    const npmrcPath = path.join(rootDir, '.npmrc');

    if (!fs.existsSync(npmrcPath)) {
        report.errors.push('Falta el archivo .npmrc con la política de instalación segura.');
        return new Map();
    }

    const npmrc = parseNpmrc(readText(npmrcPath));

    for (const [key, expected] of REQUIRED_NPMRC) {
        const actual = npmrc.get(key);
        if (actual !== expected) {
            report.errors.push(`.npmrc debe declarar ${key}=${expected}. Valor actual: ${actual ?? '(sin declarar)'}.`);
        }
    }

    return npmrc;
}

function verifyPackageJson(rootDir, report) {
    const packagePath = path.join(rootDir, 'package.json');

    if (!fs.existsSync(packagePath)) {
        report.errors.push('Falta package.json.');
        return null;
    }

    const packageJson = readJson(packagePath);

    if (packageJson.private !== true) {
        report.errors.push('package.json debe declarar "private": true para evitar publicaciones accidentales.');
    }

    const scripts = packageJson.scripts ?? {};
    for (const scriptName of ['security:lockfile', 'security:check', 'install:safe']) {
        if (typeof scripts[scriptName] !== 'string') {
            report.errors.push(`package.json debe declarar el script ${scriptName}.`);
        }
    }

    return packageJson;
}

function verifyResolvedUrl(packagePath, resolved, report) {
    if (!resolved) return;

    if (/^(?:git|git\+ssh|git\+https|ssh|file|link|github):/i.test(resolved)) {
        report.errors.push(`${packagePath} usa un origen no permitido: ${resolved}`);
        return;
    }

    let parsed;
    try {
        parsed = new URL(resolved);
    } catch {
        report.errors.push(`${packagePath} tiene una URL resolved no válida: ${resolved}`);
        return;
    }

    if (parsed.protocol !== 'https:') {
        report.errors.push(`${packagePath} debe resolverse por HTTPS. Valor actual: ${resolved}`);
    }

    if (!ALLOWED_REGISTRY_HOSTS.has(parsed.hostname)) {
        report.errors.push(`${packagePath} procede de un registro no permitido: ${parsed.hostname}`);
    }

    if (!parsed.pathname.endsWith('.tgz')) {
        report.warnings.push(`${packagePath} no apunta a un tarball .tgz del registro npm: ${resolved}`);
    }
}

function getParentPackagePath(packagePath) {
    const nestedNodeModulesIndex = packagePath.lastIndexOf('/node_modules/');
    if (nestedNodeModulesIndex < 0) return null;
    return packagePath.slice(0, nestedNodeModulesIndex);
}

function hasVerifiableBundledContainer(packagePath, packages) {
    let parentPath = getParentPackagePath(packagePath);

    while (parentPath) {
        const parentInfo = packages[parentPath];
        if (!parentInfo) return false;

        if (parentInfo.resolved && parentInfo.integrity && SAFE_INTEGRITY.test(parentInfo.integrity)) {
            return true;
        }

        if (!parentInfo.inBundle) return false;
        parentPath = getParentPackagePath(parentPath);
    }

    return false;
}

function verifyPackageLock(rootDir, npmrc, report) {
    const lockPath = path.join(rootDir, 'package-lock.json');

    if (!fs.existsSync(lockPath)) {
        report.errors.push('Falta package-lock.json. Las instalaciones deben ser reproducibles.');
        return;
    }

    const lock = readJson(lockPath);

    if (!Number.isInteger(lock.lockfileVersion) || lock.lockfileVersion < 3) {
        report.errors.push(`package-lock.json debe usar lockfileVersion 3 o superior. Valor actual: ${lock.lockfileVersion}.`);
    }

    const packages = lock.packages ?? {};
    const installScriptPackages = [];
    let checkedPackages = 0;

    for (const [packagePath, packageInfo] of Object.entries(packages)) {
        if (packagePath === '') continue;
        if (packageInfo.link) continue;

        checkedPackages += 1;

        const usesBundledContainerIntegrity = packageInfo.inBundle && hasVerifiableBundledContainer(packagePath, packages);

        if (!usesBundledContainerIntegrity) {
            if (!packageInfo.resolved) {
                report.errors.push(`${packagePath} no declara resolved en package-lock.json.`);
            } else {
                verifyResolvedUrl(packagePath, packageInfo.resolved, report);
            }

            if (!packageInfo.integrity || !SAFE_INTEGRITY.test(packageInfo.integrity)) {
                report.errors.push(`${packagePath} no declara una integridad SRI segura.`);
            }
        }

        if (packageInfo.hasInstallScript) {
            installScriptPackages.push(packagePath);
        }
    }

    report.stats.checkedPackages = checkedPackages;
    report.stats.installScriptPackages = installScriptPackages;

    if (installScriptPackages.length > 0) {
        const message = `Dependencias con scripts de instalación declarados: ${installScriptPackages.join(', ')}.`;
        if (npmrc.get('ignore-scripts') === 'true') {
            report.warnings.push(`${message} Quedan neutralizados por ignore-scripts=true.`);
        } else {
            report.errors.push(`${message} Deben bloquearse con ignore-scripts=true.`);
        }
    }
}

function createReport() {
    return {
        errors: [],
        warnings: [],
        stats: {
            checkedPackages: 0,
            installScriptPackages: [],
        },
    };
}

export function verifyNpmSupplyChain(rootDir) {
    const report = createReport();
    const resolvedRoot = path.resolve(rootDir);
    const npmrc = verifyNpmrc(resolvedRoot, report);
    verifyPackageJson(resolvedRoot, report);
    verifyPackageLock(resolvedRoot, npmrc, report);
    return report;
}

export function formatReport(report) {
    const lines = [];

    lines.push('Comprobación de seguridad npm');
    lines.push(`Paquetes verificados en lockfile: ${report.stats.checkedPackages}`);

    if (report.stats.installScriptPackages.length > 0) {
        lines.push(`Dependencias con scripts de instalación neutralizados: ${report.stats.installScriptPackages.length}`);
    }

    if (report.warnings.length > 0) {
        lines.push('');
        lines.push('Advertencias:');
        report.warnings.forEach(warning => lines.push(`- ${warning}`));
    }

    if (report.errors.length > 0) {
        lines.push('');
        lines.push('Errores:');
        report.errors.forEach(error => lines.push(`- ${error}`));
    }

    lines.push('');
    lines.push(report.errors.length === 0 ? 'Resultado: correcto.' : 'Resultado: bloqueado.');

    return lines.join('\n');
}

function isMainModule() {
    return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
    const rootDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
    const report = verifyNpmSupplyChain(rootDir);
    console.log(formatReport(report));
    process.exit(report.errors.length === 0 ? 0 : 1);
}
