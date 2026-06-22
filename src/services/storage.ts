// Persistence layer replacing the Dalamud IPluginConfiguration (Config/Configuration.cs).
//
// Split per the plan: small structured prefs + auth tokens in localStorage (synchronous, tiny),
// and binary/secret material (wrapped private key, image cache, chat archive) in IndexedDB. Only
// the pieces the Phase 1 runtime needs are implemented here; UI prefs grow this as screens land.

const LS_PREFIX = 'aetherlove:';

interface PersistedAuthState {
    AccessToken: string;
    AccessTokenExpiresAtUtc: string;
    RefreshToken: string;
    RefreshTokenExpiresAtUtc: string;
}

const EMPTY_AUTH: PersistedAuthState = {
    AccessToken: '',
    AccessTokenExpiresAtUtc: '1970-01-01T00:00:00.000Z',
    RefreshToken: '',
    RefreshTokenExpiresAtUtc: '1970-01-01T00:00:00.000Z',
};

function lsGet<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(LS_PREFIX + key);
        return raw == null ? fallback : (JSON.parse(raw) as T);
    } catch {
        return fallback;
    }
}

function lsSet(key: string, value: unknown): void {
    try {
        localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
    } catch {
        /* private mode / quota — tolerate, runtime degrades to in-memory only */
    }
}

function lsRemove(key: string): void {
    try {
        localStorage.removeItem(LS_PREFIX + key);
    } catch {
        /* ignore */
    }
}

// ---- Auth tokens -------------------------------------------------------------------------

export const authStorage = {
    load: (): PersistedAuthState => lsGet('auth', EMPTY_AUTH),
    save: (state: PersistedAuthState): void => lsSet('auth', state),
    clear: (): void => lsSet('auth', EMPTY_AUTH),
};

// ---- Archived matches (mirrors Services/ChatArchiveStore.cs / Configuration.ArchivedMatches) ----

export const archiveStorage = {
    load: (): string[] => lsGet<string[]>('archivedMatches', []),
    save: (ids: string[]): void => lsSet('archivedMatches', ids),
};

// ---- Device id (mirrors AuthService.GetOrCreateDeviceId) ---------------------------------

// Crockford alphabet (no 0/O/1/I), matching the plugin's id format so the server sees a
// consistent "device name" namespace.
const CROCKFORD = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function getOrCreateDeviceId(): string {
    const existing = lsGet<string>('deviceId', '');
    if (existing) return existing;
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    let id = 'AetherLove-Web-';
    for (const b of bytes) id += CROCKFORD[b % CROCKFORD.length];
    lsSet('deviceId', id);
    return id;
}

// ---- IndexedDB key-value (secrets + binary) ----------------------------------------------

const DB_NAME = 'aetherlove';
const DB_VERSION = 1;
const STORE_KV = 'kv';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_KV)) db.createObjectStore(STORE_KV);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return dbPromise;
}

async function idbRun<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    const db = await openDb();
    return new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_KV, mode);
        const req = fn(tx.objectStore(STORE_KV));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
    });
}

/** Typed IndexedDB key-value store for secrets (wrapped private key) and cached binary. */
export const secureStore = {
    get: <T>(key: string): Promise<T | undefined> => idbRun('readonly', (s) => s.get(key)),
    put: (key: string, value: unknown): Promise<IDBValidKey> =>
        idbRun('readwrite', (s) => s.put(value, key)),
    delete: (key: string): Promise<undefined> => idbRun('readwrite', (s) => s.delete(key)),
};

/** Wipes all locally persisted state (sign-out / account deletion). */
export async function wipeAllLocalState(): Promise<void> {
    for (const k of ['auth', 'deviceId']) lsRemove(k);
    try {
        await idbRun('readwrite', (s) => s.clear());
    } catch {
        /* ignore */
    }
}
