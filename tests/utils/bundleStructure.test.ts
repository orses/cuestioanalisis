import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoot = join(process.cwd(), 'src');
const appSource = readFileSync(join(sourceRoot, 'App.tsx'), 'utf8');

const lazyViewModules = [
    './components/Resumen',
    './components/layout/PanelEstadisticas',
    './components/TablaPreguntas',
    './components/VisorDataset',
    './components/Generador',
    './components/BusquedaSemantica',
    './components/Comparativa',
    './components/ExamenSimulado',
    './components/Ayuda',
    './components/CatalogoCuestionarios',
    './components/layout/ModalPregunta',
    './components/layout/ModalCuestionarioId',
] as const;

const onDemandModules = [
    './utils/parser',
    './utils/generarInforme',
    'papaparse',
] as const;

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expectNoStaticImport(modulePath: string) {
    expect(appSource).not.toMatch(new RegExp(`from\\s+['"]${escapeRegExp(modulePath)}['"]`));
}

function expectDynamicImport(modulePath: string) {
    expect(appSource).toContain(`import('${modulePath}')`);
}

function listSourceFiles(directory: string): string[] {
    return readdirSync(directory).flatMap(entry => {
        const fullPath = join(directory, entry);
        if (statSync(fullPath).isDirectory()) return listSourceFiles(fullPath);
        return fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') ? [fullPath] : [];
    });
}

describe('estructura de carga de App', () => {
    it('mantiene las vistas pesadas mediante React.lazy', () => {
        for (const modulePath of lazyViewModules) {
            expectNoStaticImport(modulePath);
            expectDynamicImport(modulePath);
        }

        expect(appSource).toContain('lazy(() => import');
        expect(appSource).toContain('<Suspense fallback={<ViewLoadingFallback />}>');
    });

    it('carga parser, generador de informe y Papa Parse bajo demanda', () => {
        for (const modulePath of onDemandModules) {
            expectNoStaticImport(modulePath);
            expectDynamicImport(modulePath);
        }
    });

    it('evita imports estáticos del parser fuera del propio parser', () => {
        const staticParserImportPattern = /from\s+['"][^'"]*parser['"]/;
        const offenders = listSourceFiles(sourceRoot)
            .filter(filePath => !filePath.endsWith(join('utils', 'parser.ts')))
            .filter(filePath => staticParserImportPattern.test(readFileSync(filePath, 'utf8')))
            .map(filePath => relative(sourceRoot, filePath));

        expect(offenders).toEqual([]);
    });
});
