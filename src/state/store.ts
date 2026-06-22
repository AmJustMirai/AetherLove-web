// Minimal observable store, the shared primitive behind the web port's state (theme, router, session).
// Mirrors the role of the plugin's singleton services without pulling in a state library: a snapshot
// plus a subscribe API, which is exactly what React's useSyncExternalStore consumes (see hooks.ts).

export interface ReadableStore<T> {
    get(): T;

    subscribe(fn: () => void): () => void;
}

export interface Store<T> extends ReadableStore<T> {
    set(next: T): void;

    update(fn: (prev: T) => T): void;
}

export function createStore<T>(initial: T): Store<T> {
    let value = initial;
    const listeners = new Set<() => void>();

    return {
        get: () => value,
        set(next: T) {
            if (Object.is(next, value)) return;
            value = next;
            for (const fn of listeners) fn();
        },
        update(fn: (prev: T) => T) {
            this.set(fn(value));
        },
        subscribe(fn: () => void) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
    };
}
