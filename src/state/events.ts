// Minimal typed event emitter for live hub pushes that screens react to imperatively (a new message
// landing in the open conversation, a deck refresh, an unmatch). Stores hold durable state; this bus
// carries one-shot signals. Screens subscribe in an effect and unsubscribe on unmount.

import type { Guid } from '../shared/wire';

export interface LiveEventMap {
  messageReceived: {
    fromProfileId: Guid;
    messageId: Guid;
    ciphertext: Uint8Array;
    nonce: Uint8Array;
    createdAtUtc: string;
  };
  messageRead: { byProfileId: Guid; messageIds: Guid[]; readAtUtc: string };
  deckRefresh: { reason: string };
  unmatched: { otherProfileId: Guid };
  blockedByPeer: { otherProfileId: Guid };
}

type Handler<E extends keyof LiveEventMap> = (payload: LiveEventMap[E]) => void;
type AnyHandler = (payload: never) => void;

// Internally untyped (the per-event key/handler relationship can't be expressed through a generic index
// without casts); the exported functions re-impose the typed surface.
const listeners = new Map<keyof LiveEventMap, Set<AnyHandler>>();

export function onLive<E extends keyof LiveEventMap>(event: E, handler: Handler<E>): () => void {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(handler as AnyHandler);
  return () => set!.delete(handler as AnyHandler);
}

export function emitLive<E extends keyof LiveEventMap>(event: E, payload: LiveEventMap[E]): void {
  listeners.get(event)?.forEach((h) => (h as Handler<E>)(payload));
}
