// Web port of Screens/ChatListScreen.cs — the matches/conversations list. Each row shows the peer
// avatar, name, a decrypted last-message preview, unread badge, and pinned marker. Tapping opens the
// conversation. markMatchListSeen clears the new-match badge. The same list, filtered by the client-side
// archive store, also backs the archive view (DrawArchiveView) via the `archived` prop.

import { useEffect, useState } from 'react';
import { hubClient } from '../../services/signal/hubClient';
import { decryptFromPeer } from '../../services/messaging/chatCrypto';
import { sessionStore } from '../../state/session';
import { chatArchiveStore } from '../../state/chatArchive';
import type { MatchSummaryDto } from '../../shared/dtos';
import { router, Screen } from '../../app/router';
import { useStore } from '../../state/hooks';
import { useT } from '../../i18n/useT';
import { Avatar, LoadingSpinner } from '../../ui/components';
import { cn } from '../../ui/cn';

interface Row extends MatchSummaryDto {
  preview: string;
}

/** Shared matches list. `archived=false` is the main view; `archived=true` is the archive view. */
function MatchListView({ archived }: { archived: boolean }) {
  const t = useT();
  const session = useStore(sessionStore);
  const archive = useStore(chatArchiveStore);
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await hubClient.getMyMatches();
        const identity = session.identity;
        const decorated: Row[] = await Promise.all(
          list.Matches.map(async (m) => {
            let preview = t('chatlist.no_messages');
            if (identity && m.LastMessageCiphertext?.length) {
              try {
                const text = await decryptFromPeer(identity, m.PeerPublicKey, {
                  Ciphertext: m.LastMessageCiphertext,
                  Nonce: m.LastMessageNonce,
                });
                preview = (m.LastMessageFromMe ? `${t('common.you')}: ` : '') + text;
              } catch {
                preview = '🔒';
              }
            }
            return { ...m, preview };
          })
        );
        if (!cancelled) setRows(decorated);
        if (!archived) {
          void hubClient.markMatchListSeen().catch(() => undefined);
          sessionStore.update((s) =>
            s.connection ? { ...s, connection: { ...s.connection, NewMatchCount: 0 } } : s
          );
        }
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archived]);

  const visible = (rows ?? []).filter((m) => archive.has(m.PeerProfileId) === archived);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <header className="flex items-end justify-between px-6 pb-3 pt-6 lg:px-8 lg:pt-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-light/80">
            Linkpearl
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-strong">
            {archived ? t('chat.archive_title') : t('chatlist.title')}
          </h1>
        </div>
        <button
          onClick={() => router.navigate(archived ? Screen.ChatList : Screen.ChatArchive)}
          className="rounded-full px-3 py-1.5 text-[12px] font-medium text-accent-light transition-colors hover:bg-surface/5"
        >
          {archived ? t('chat.matches_title') : t('chat.archive_title')}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 lg:px-5">
        {rows === null ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size={26} className="text-accent" />
          </div>
        ) : visible.length === 0 ? (
          <p className="px-6 pt-16 text-center text-[14px] text-subtle">
            {archived ? t('chat.no_archived') : t('chatlist.empty')}
          </p>
        ) : (
          <ul className="space-y-1">
            {visible
              .slice()
              .sort((a, b) => Number(b.IsPinned) - Number(a.IsPinned))
              .map((m) => (
                <li key={m.PeerProfileId} className="group flex items-center gap-1">
                  <button
                    onClick={() =>
                      router.navigate(Screen.Chat, {
                        peerId: m.PeerProfileId,
                        peerName: m.PeerDisplayName,
                      })
                    }
                    className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-surface/5"
                  >
                    <Avatar bytes={m.PeerAvatarWebp} size={56} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-strong">
                          {m.PeerDisplayName}
                        </span>
                        {!archived && m.IsPinned && (
                          <span className="text-[11px] text-accent-light">📌</span>
                        )}
                      </div>
                      <p
                        className={cn(
                          'truncate text-sm',
                          m.UnreadCount > 0 ? 'text-body' : 'text-muted'
                        )}
                      >
                        {m.preview}
                      </p>
                    </div>
                    {!archived && m.UnreadCount > 0 && (
                      <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-strong">
                        {m.UnreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => chatArchiveStore.setArchived(m.PeerProfileId, !archived)}
                    title={archived ? t('chat.menu_unarchive') : t('chat.menu_archive')}
                    aria-label={archived ? t('chat.menu_unarchive') : t('chat.menu_archive')}
                    className="rounded-full px-2 py-2 text-muted opacity-0 transition-opacity hover:text-strong focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    {archived ? '📤' : '🗄'}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ChatListScreen() {
  return <MatchListView archived={false} />;
}

export function ChatArchiveScreen() {
  return <MatchListView archived />;
}
