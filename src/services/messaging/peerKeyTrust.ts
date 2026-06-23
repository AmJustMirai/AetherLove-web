// Trust-On-First-Use integrity check for a peer's chat public key. The conversation key is derived
// straight from the peer's X25519 public key (chatCrypto.deriveConversationFor), so a *silently
// swapped* peer key is exactly what a man-in-the-middle does: replace the peer's key with their own,
// and they can read/forge the conversation while everything still "works". The server hands us this
// key, so we don't blindly trust it changing.
//
// We pin the first key we ever see for each peer in origin-scoped IndexedDB and flag any later change
// so the user is warned before trusting it. This mirrors Signal's safety-number-change behaviour: we
// warn, we don't silently re-key. The pin only moves forward once the user explicitly accepts.

import { sha256 } from '@noble/hashes/sha256';
import { secureStore } from '../storage';
import type { Guid } from '../../shared/wire';

const keyOf = (peerId: Guid): string => `peerkey:${peerId}`;

export type PeerKeyStatus = 'first-seen' | 'unchanged' | 'changed';

export interface PeerKeyCheck {
  status: PeerKeyStatus;
  /** Human-comparable safety number of the key we just received. */
  fingerprint: string;
  /** Safety number of the previously pinned key. Only set when status === 'changed'. */
  previousFingerprint?: string;
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Short, human-comparable safety number: SHA-256 of the raw public key rendered as four 16-bit hex
 * groups (e.g. "A1B2 C3D4 E5F6 0718"). Two people can read these aloud out-of-band to confirm they
 * share the same key. Hashing (rather than showing raw key bytes) keeps the displayed string short
 * and uniform regardless of key encoding.
 */
export function keyFingerprint(publicKey: Uint8Array): string {
  const h = sha256(publicKey);
  const groups: string[] = [];
  for (let i = 0; i < 8; i += 2) {
    groups.push((((h[i] << 8) | h[i + 1]) >>> 0).toString(16).padStart(4, '0'));
  }
  return groups.join(' ').toUpperCase();
}

/**
 * Checks the peer's public key against the pinned one, pinning it on first sight. Does NOT overwrite a
 * changed key — call acceptPeerKey once the user has accepted the new identity, so the warning keeps
 * showing until they act on it.
 */
export async function verifyPeerKey(peerId: Guid, publicKey: Uint8Array): Promise<PeerKeyCheck> {
  const fingerprint = keyFingerprint(publicKey);
  const stored = await secureStore.get<Uint8Array>(keyOf(peerId));
  if (!stored || stored.length === 0) {
    await secureStore.put(keyOf(peerId), publicKey);
    return { status: 'first-seen', fingerprint };
  }
  if (equalBytes(stored, publicKey)) {
    return { status: 'unchanged', fingerprint };
  }
  return { status: 'changed', fingerprint, previousFingerprint: keyFingerprint(stored) };
}

/** Re-pins the current key, clearing a 'changed' warning once the user has verified it out-of-band. */
export async function acceptPeerKey(peerId: Guid, publicKey: Uint8Array): Promise<void> {
  await secureStore.put(keyOf(peerId), publicKey);
}

/** Drops a peer's pin (e.g. on unmatch/block) so a future re-match starts fresh. */
export async function forgetPeerKey(peerId: Guid): Promise<void> {
  await secureStore.delete(keyOf(peerId));
}
