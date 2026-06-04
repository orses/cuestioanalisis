import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

type LockPackage = {
    version?: string;
    resolved?: string;
    integrity?: string;
    hasInstallScript?: boolean;
    inBundle?: boolean;
    optional?: boolean;
};

let tempDirs: string[] = [];

const safeNpmrc = [
    'ignore-scripts=true',
    'audit=true',
    'fund=false',
    'package-lock=true',
    'save-exact=true',
    'strict-ssl=true',
    'registry=https://registry.npmjs.org/',
].join('\n');

function createProject(files: {
    npmrc?: string;
    packageJson?: Record<string, unknown>;
    packages?: Record<string, LockPackage>;
}) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-security-'));
    tempDirs.push(tempDir);

    fs.writeFileSync(path.join(tempDir, '.npmrc'), files.npmrc ?? safeNpmrc, 'utf8');
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(files.packageJson ?? {
        private: true,
        scripts: {
            'security:lockfile': 'node scripts/security/verify-npm-supply-chain.mjs',
            'security:check': 'npm run security:lockfile',
            'install:safe': 'npm ci --ignore-scripts && npm run security:check',
        },
    }, null, 2), 'utf8');
    fs.writeFileSync(path.join(tempDir, 'package-lock.json'), JSON.stringify({
        name: 'fixture',
        lockfileVersion: 3,
        packages: {
            '': {
                name: 'fixture',
                version: '0.0.0',
            },
            ...(files.packages ?? {
                'node_modules/safe-package': {
                    version: '1.0.0',
                    resolved: 'https://registry.npmjs.org/safe-package/-/safe-package-1.0.0.tgz',
                    integrity: 'sha512-abc=',
                },
            }),
        },
    }, null, 2), 'utf8');

    return tempDir;
}

async function loadVerifier() {
    return import('../../scripts/security/verify-npm-supply-chain.mjs');
}

afterEach(() => {
    for (const tempDir of tempDirs) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    tempDirs = [];
});

describe('verifyNpmSupplyChain', () => {
    it('acepta lockfiles con registro oficial, HTTPS, integridad e instalación sin scripts', async () => {
        const { verifyNpmSupplyChain } = await loadVerifier();
        const report = verifyNpmSupplyChain(createProject({}));

        expect(report.errors).toEqual([]);
        expect(report.stats.checkedPackages).toBe(1);
    });

    it('acepta dependencias empaquetadas si el contenedor declara tarball e integridad', async () => {
        const { verifyNpmSupplyChain } = await loadVerifier();
        const report = verifyNpmSupplyChain(createProject({
            packages: {
                'node_modules/container': {
                    version: '1.0.0',
                    resolved: 'https://registry.npmjs.org/container/-/container-1.0.0.tgz',
                    integrity: 'sha512-abc=',
                },
                'node_modules/container/node_modules/bundled-package': {
                    version: '1.0.0',
                    inBundle: true,
                    optional: true,
                },
            },
        }));

        expect(report.errors).toEqual([]);
        expect(report.stats.checkedPackages).toBe(2);
    });

    it('bloquea orígenes no oficiales o sin HTTPS', async () => {
        const { verifyNpmSupplyChain } = await loadVerifier();
        const report = verifyNpmSupplyChain(createProject({
            packages: {
                'node_modules/bad-package': {
                    version: '1.0.0',
                    resolved: 'http://evil.example/bad-package.tgz',
                    integrity: 'sha512-abc=',
                },
            },
        }));

        expect(report.errors.join('\n')).toContain('debe resolverse por HTTPS');
        expect(report.errors.join('\n')).toContain('registro no permitido');
    });

    it('bloquea dependencias sin integridad SRI', async () => {
        const { verifyNpmSupplyChain } = await loadVerifier();
        const report = verifyNpmSupplyChain(createProject({
            packages: {
                'node_modules/no-integrity': {
                    version: '1.0.0',
                    resolved: 'https://registry.npmjs.org/no-integrity/-/no-integrity-1.0.0.tgz',
                },
            },
        }));

        expect(report.errors.join('\n')).toContain('no declara una integridad SRI segura');
    });

    it('bloquea scripts de instalación si ignore-scripts no está activo', async () => {
        const { verifyNpmSupplyChain } = await loadVerifier();
        const report = verifyNpmSupplyChain(createProject({
            npmrc: safeNpmrc.replace('ignore-scripts=true', 'ignore-scripts=false'),
            packages: {
                'node_modules/installer': {
                    version: '1.0.0',
                    resolved: 'https://registry.npmjs.org/installer/-/installer-1.0.0.tgz',
                    integrity: 'sha512-abc=',
                    hasInstallScript: true,
                },
            },
        }));

        expect(report.errors.join('\n')).toContain('ignore-scripts=true');
        expect(report.errors.join('\n')).toContain('Deben bloquearse');
    });

    it('avisa de scripts de instalación cuando están neutralizados por ignore-scripts', async () => {
        const { verifyNpmSupplyChain } = await loadVerifier();
        const report = verifyNpmSupplyChain(createProject({
            packages: {
                'node_modules/installer': {
                    version: '1.0.0',
                    resolved: 'https://registry.npmjs.org/installer/-/installer-1.0.0.tgz',
                    integrity: 'sha512-abc=',
                    hasInstallScript: true,
                },
            },
        }));

        expect(report.errors).toEqual([]);
        expect(report.warnings.join('\n')).toContain('Quedan neutralizados');
    });
});
