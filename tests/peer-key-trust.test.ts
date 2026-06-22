// Trust-On-First-Use peer-key integrity check. secureStore is IndexedDB-backed (unavailable in node),
// so we stub it with an in-memory map and exercise the pin/compare/accept state machine.

import {beforeEach, describe, expect, it, vi} from 'vitest';
import {acceptPeerKey, forgetPeerKey, keyFingerprint, verifyPeerKey,} from '../src/services/messaging/peerKeyTrust';

const store = new Map<string, unknown>();
vi.mock('../src/services/storage', () => ({
    secureStore: {
        get: async <T>(k: string): Promise<T | undefined> => store.get(k) as T | undefined,
        put: async (k: string, v: unknown): Promise<void> => void store.set(k, v),
        delete: async (k: string): Promise<void> => void store.delete(k),
    },
}));

const keyA = new Uint8Array(32).fill(1);
const keyB = new Uint8Array(32).fill(2);
const PEER = '11111111-1111-1111-1111-111111111111';

beforeEach(() => store.clear());

describe('keyFingerprint', () => {
    it('is deterministic and differs per key', () => {
        expect(keyFingerprint(keyA)).toBe(keyFingerprint(keyA));
        expect(keyFingerprint(keyA)).not.toBe(keyFingerprint(keyB));
        // Four space-separated 16-bit hex groups, e.g. "72CD 40DE 7F9A 1B2C".
        expect(keyFingerprint(keyA)).toMatch(/^[0-9A-F]{4}( [0-9A-F]{4}){3}$/);
    });
});

describe('verifyPeerKey', () => {
    it('pins on first sight, then reports unchanged', async () => {
        expect((await verifyPeerKey(PEER, keyA)).status).toBe('first-seen');
        expect((await verifyPeerKey(PEER, keyA)).status).toBe('unchanged');
    });

    it('flags a changed key without re-pinning it, until explicitly accepted', async () => {
        await verifyPeerKey(PEER, keyA);

        const changed = await verifyPeerKey(PEER, keyB);
        expect(changed.status).toBe('changed');
        expect(changed.fingerprint).toBe(keyFingerprint(keyB));
        expect(changed.previousFingerprint).toBe(keyFingerprint(keyA));

        // Still warns on the next load — the pin did not silently move.
        expect((await verifyPeerKey(PEER, keyB)).status).toBe('changed');

        // After the user verifies and accepts, the new key becomes the trusted pin.
        await acceptPeerKey(PEER, keyB);
        expect((await verifyPeerKey(PEER, keyB)).status).toBe('unchanged');
    });

    it('starts fresh after the pin is forgotten', async () => {
        await verifyPeerKey(PEER, keyA);
        await forgetPeerKey(PEER);
        expect((await verifyPeerKey(PEER, keyA)).status).toBe('first-seen');
    });
});
