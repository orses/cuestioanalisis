import type { DatasetAnalisis, CuestionarioMeta } from '../types';

const DB_NAME = 'analisis-oposiciones-db';
const DB_VERSION = 2;
const STORE_NAME = 'datasets';
const KEY = 'ultimo';
const KEY_CATALOGO = 'catalogo';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function guardarDataset(data: DatasetAnalisis, nombreArchivos: string[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ data, nombreArchivos, timestamp: Date.now() }, KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function recuperarDataset(): Promise<{ data: DatasetAnalisis; nombreArchivos: string[] } | null> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(KEY);
            request.onsuccess = () => {
                if (request.result) {
                    // Compatibilidad: aceptar tanto nombreArchivo (antiguo) como nombreArchivos (nuevo)
                    const nombres = request.result.nombreArchivos
                        || (request.result.nombreArchivo ? [request.result.nombreArchivo] : []);
                    resolve({ data: request.result.data, nombreArchivos: nombres });
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch {
        return null;
    }
}

export async function borrarDataset(): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch {
        // silently fail
    }
}

export async function guardarCatalogo(catalogo: CuestionarioMeta[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ catalogo, timestamp: Date.now() }, KEY_CATALOGO);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function recuperarCatalogo(): Promise<CuestionarioMeta[] | null> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(KEY_CATALOGO);
            request.onsuccess = () => {
                resolve(request.result?.catalogo || null);
            };
            request.onerror = () => reject(request.error);
        });
    } catch {
        return null;
    }
}
