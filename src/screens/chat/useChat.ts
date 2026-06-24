// Conversation state for one peer: loads + decrypts history, sends encrypted messages, and folds in live
// MessageReceived / MessageRead pushes for this peer. Ports ChatScreen's data half. All crypto goes
// through chatCrypto with the session's unlocked identity.

import { useCallback, useEffect, useRef, useState } from 'react';
import { hubClient } from '../../services/signal/hubClient';
import { decryptFromPeer, encryptForPeer } from '../../services/messaging/chatCrypto';
import {
  acceptPeerKey,
  type PeerKeyCheck,
  verifyPeerKey,
} from '../../services/messaging/peerKeyTrust';
import { sessionStore } from '../../state/session';
import { onLive } from '../../state/events';
import type { Guid } from '../../shared/wire';

export interface ChatMessage {
  id: Guid;
  fromMe: boolean;
  text: string;
  createdAtUtc: string;
  /** UTC ISO timestamp when the peer read this message; null if unread. Only meaningful for fromMe messages. */
  readAtUtc: string | null;
}

interface ChatState {
  loading: boolean;
  locked: boolean;
  /** The account itself has no server key bundle (E2E never set up / broken), distinct from `locked`
   *  which means a bundle exists but is not unlocked on this device. Mirrors chat.e2e_self_broken. */
  selfBroken: boolean;
  messages: ChatMessage[];
  error: string | null;
  /** Set when the peer's pinned public key changed (possible MITM); null when the key is trusted. */
  keyAlert: PeerKeyCheck | null;
}

export function useChat(peerId: Guid) {
  const [state, setState] = useState<ChatState>({
    loading: true,
    locked: false,
    selfBroken: false,
    messages: [],
    error: null,
    keyAlert: null,
  });
  const peerKeyRef = useRef<Uint8Array | null>(null);

  const load = useCallback(async () => {
    const identity = sessionStore.get().identity;
    if (!identity) {
      // No unlocked identity: if the server holds no bundle at all, the user's own E2E is broken
      // (self-broken); otherwise the bundle just needs unlocking on this device (locked).
      const selfBroken = sessionStore.get().connection?.HasKeyBundle === false;
      setState({
        loading: false,
        locked: true,
        selfBroken,
        messages: [],
        error: null,
        keyAlert: null,
      });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const convo = await hubClient.getConversation(peerId);
      peerKeyRef.current = convo.PeerPublicKey;
      // Integrity check the peer key before we trust it to derive the conversation key. A changed key
      // is surfaced (banner + toast) but not silently re-pinned — see peerKeyTrust.
      const keyCheck = await verifyPeerKey(peerId, convo.PeerPublicKey);
      const keyAlert = keyCheck.status === 'changed' ? keyCheck : null;
      const messages: ChatMessage[] = await Promise.all(
        convo.Messages.map(async (m) => ({
          id: m.Id,
          // The sender is the peer when SenderProfileId equals the peer id; otherwise it's us.
          fromMe: m.SenderProfileId !== peerId,
          text: await decryptFromPeer(identity, convo.PeerPublicKey, m),
          createdAtUtc: m.CreatedAtUtc,
          readAtUtc: m.ReadByOtherAtUtc ?? null,
        }))
      );
      setState({
        loading: false,
        locked: false,
        selfBroken: false,
        messages,
        error: null,
        keyAlert,
      });
      // Mark read on open (mirrors MarkConversationReadAsync).
      void hubClient.markConversationRead(peerId).catch(() => undefined);
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }, [peerId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live: a message from this peer lands → decrypt + append, then mark read.
  useEffect(() => {
    const offRecv = onLive('messageReceived', async (p) => {
      if (p.fromProfileId !== peerId) return;
      const identity = sessionStore.get().identity;
      const key = peerKeyRef.current;
      if (!identity || !key) return;
      const text = await decryptFromPeer(identity, key, {
        Ciphertext: p.ciphertext,
        Nonce: p.nonce,
      });
      setState((s) => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: p.messageId,
            fromMe: false,
            text,
            createdAtUtc: p.createdAtUtc,
            readAtUtc: null,
          },
        ],
      }));
      void hubClient.markConversationRead(peerId).catch(() => undefined);
    });
    const offRead = onLive('messageRead', (p) => {
      if (p.byProfileId !== peerId) return;
      const ids = new Set(p.messageIds);
      setState((s) => ({
        ...s,
        messages: s.messages.map((m) =>
          ids.has(m.id) ? { ...m, readAtUtc: m.readAtUtc ?? p.readAtUtc } : m
        ),
      }));
    });
    return () => {
      offRecv();
      offRead();
    };
  }, [peerId]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      const identity = sessionStore.get().identity;
      const key = peerKeyRef.current;
      if (!trimmed || !identity || !key) return;
      const req = await encryptForPeer(identity, peerId, key, trimmed);
      const resp = await hubClient.sendMessage(req);
      setState((s) => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: resp.MessageId,
            fromMe: true,
            text: trimmed,
            createdAtUtc: resp.CreatedAtUtc,
            readAtUtc: null,
          },
        ],
      }));
    },
    [peerId]
  );

  // User has verified the new key out-of-band: re-pin it and clear the warning.
  const acceptKey = useCallback(async () => {
    const key = peerKeyRef.current;
    if (!key) return;
    await acceptPeerKey(peerId, key);
    setState((s) => ({ ...s, keyAlert: null }));
  }, [peerId]);

  return { ...state, send, reload: load, acceptKey };
}
