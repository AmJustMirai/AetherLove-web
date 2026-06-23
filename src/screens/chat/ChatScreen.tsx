// Web port of Screens/ChatScreen.cs — one E2E conversation. Decrypted message bubbles, a composer, live
// inbound messages, and read receipts. Back returns to the chat list. If the identity is locked, shows
// the unlock hint instead of plaintext.

import { useEffect, useRef, useState } from 'react';
import { useChat } from './useChat';
import { router, Screen } from '../../app/router';
import { useStore } from '../../state/hooks';
import { useT } from '../../i18n/useT';
import { LoadingSpinner } from '../../ui/components';
import { pushToast } from '../../ui/components/Toast';
import { cn } from '../../ui/cn';

export function ChatScreen() {
  const t = useT();
  const route = useStore(router.store);
  const peerId = route.params.peerId ?? '';
  const peerName = route.params.peerName ?? 'Chat';
  const chat = useChat(peerId);
  const [draft, setDraft] = useState('');
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [chat.messages.length]);

  // One-shot toast when the peer's key changes (the banner below stays until acknowledged). Keyed on
  // the fingerprint so re-entering the chat with the same changed key doesn't re-toast on every render.
  const alertFingerprint = chat.keyAlert?.fingerprint ?? null;
  useEffect(() => {
    if (alertFingerprint) pushToast(t('chat.key_changed_toast', peerName), 'error', 6000);
  }, [alertFingerprint, peerName, t]);

  async function onSend() {
    const text = draft;
    setDraft('');
    try {
      await chat.send(text);
    } catch {
      setDraft(text); // restore on failure
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <header className="flex items-center gap-3 border-b border-line/10 px-4 py-4">
        <button
          onClick={() => router.navigate(Screen.ChatList)}
          className="px-1 text-2xl leading-none text-subtle transition-colors hover:text-strong"
          aria-label={t('common.back')}
        >
          ‹
        </button>
        <button
          onClick={() =>
            router.navigate(Screen.Profile, { peerId, peerName, returnTo: Screen.Chat })
          }
          className="font-display text-xl font-bold text-strong transition-colors hover:text-accent-light"
        >
          {peerName}
        </button>
      </header>

      {chat.keyAlert && (
        <div className="border-b border-danger/40 bg-danger/10 px-4 py-3" role="alert">
          <p className="text-[13px] font-semibold text-danger">⚠️ {t('chat.key_changed_title')}</p>
          <p className="mt-1 text-[12px] leading-snug text-body">{t('chat.key_changed_body')}</p>
          <p className="mt-1.5 font-mono text-[12px] tracking-wide text-strong">
            {t('chat.key_safety_number', chat.keyAlert.fingerprint)}
          </p>
          <button
            onClick={() => void chat.acceptKey()}
            className="mt-2 rounded-lg border border-danger/50 px-3 py-1.5 text-[12px] font-medium text-danger transition-colors hover:bg-danger/15"
          >
            {t('chat.key_accept')}
          </button>
        </div>
      )}

      <div ref={scrollerRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {chat.loading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size={24} className="text-accent" />
          </div>
        ) : chat.locked ? (
          <p className="px-6 pt-10 text-center text-[14px] text-subtle">
            {chat.selfBroken ? t('chat.e2e_self_broken') : t('chat.locked')}
          </p>
        ) : (
          <>
            <p className="py-1 text-center text-[11px] text-muted">🔒 {t('chat.encrypted_note')}</p>
            {chat.messages.map((m) => (
              <div key={m.id} className={cn('flex', m.fromMe ? 'justify-end' : 'justify-start')}>
                {m.fromMe ? (
                  <div className="flex flex-col items-end max-w-[78%]">
                    <div
                      className={cn('rounded-2xl px-3.5 py-2 text-[14px] bg-accent text-strong')}
                    >
                      {m.text}
                    </div>
                    {m.read && (
                      <span className="mt-1 text-[9px] text-strong/60">{t('chat.read')}</span>
                    )}
                  </div>
                ) : (
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl px-3.5 py-2 text-[14px] bg-surface/10 text-body'
                    )}
                  >
                    {m.text}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {!chat.locked && (
        <footer className="flex items-center gap-2 border-t border-line/10 p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void onSend()}
            placeholder={t('chat.placeholder')}
            className="flex-1 rounded-full border border-line/10 bg-void/30 px-4 py-2 text-[15px] text-body outline-none focus:border-accent"
          />
          <button
            onClick={() => void onSend()}
            disabled={!draft.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-strong disabled:opacity-40"
            aria-label={t('chat.send')}
          >
            ➤
          </button>
        </footer>
      )}
    </div>
  );
}
