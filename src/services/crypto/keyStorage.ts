// Web port of Services/Crypto/KeyStorageService.cs. The plugin persisted the *unwrapped* identity key
// locally so the user didn't re-enter their passphrase every launch (HasLocalKey). We mirror that: the
// unlocked IdentityKeyPair lives in IndexedDB (secureStore), which is origin-scoped and not sent
// anywhere. The wrapped KeyBundleDto still lives server-side; passphrase unlock rebuilds the local key
// when this store is empty (e.g. a new browser).

import { secureStore } from '../storage';
import type { IdentityKeyPair } from './cryptoService';

const KEY = 'identity';

interface StoredIdentity {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export const keyStorage = {
  async load(): Promise<IdentityKeyPair | null> {
    const raw = await secureStore.get<StoredIdentity>(KEY);
    if (!raw?.publicKey || !raw?.privateKey) return null;
    return { publicKey: raw.publicKey, privateKey: raw.privateKey };
  },
  async save(identity: IdentityKeyPair): Promise<void> {
    await secureStore.put(KEY, {
      publicKey: identity.publicKey,
      privateKey: identity.privateKey,
    });
  },
  async hasLocalKey(): Promise<boolean> {
    return (await keyStorage.load()) !== null;
  },
  async clear(): Promise<void> {
    await secureStore.delete(KEY);
  },
};
