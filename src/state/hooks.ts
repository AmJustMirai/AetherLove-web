// React bindings over our observable stores and the Phase-1 service singletons. Everything that holds
// state outside React (theme/router/session stores, the AuthService, the SignalR connection) exposes a
// subscribe + snapshot pair, so a single useSyncExternalStore-based hook subscribes any of them.

import { useSyncExternalStore } from 'react';
import type { ReadableStore } from './store';

/** Subscribes a component to a ReadableStore (theme/router/session/etc.). */
export function useStore<T>(store: ReadableStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** Generic subscribe+snapshot binding for the Phase-1 singletons that aren't ReadableStores. */
export function useExternal<T>(subscribe: (cb: () => void) => () => void, getSnapshot: () => T): T {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
