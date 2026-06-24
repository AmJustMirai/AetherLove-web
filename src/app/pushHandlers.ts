// Registers the server→client push handlers once at app start (web port of the OnXxx handlers wired in
// AetherSignalService.cs). Durable state lands in the session store; one-shot signals fan out on the
// live-event bus; match/ban pushes drive navigation.

import { hubClient } from '../services/signal/hubClient';
import { connection, SignalConnectionState } from '../services/signal/connection';
import { sessionStore } from '../state/session';
import { emitLive } from '../state/events';
import { setPendingMatch } from '../state/matchContext';
import { chatArchiveStore } from '../state/chatArchive';
import { pushToast } from '@/ui/components';
import { router, Screen } from './router';

let registered = false;

/** Idempotent: installs all push handlers exactly once. */
export function registerPushHandlers(): void {
  if (registered) return;
  registered = true;

  hubClient.on('MatchCreated', (p) => {
    const own = sessionStore.get().displayName;
    // The push carries only the peer name; fetch the avatar best-effort so the overlay has a face.
    setPendingMatch({
      peerProfileId: p.OtherProfileId,
      peerName: p.OtherDisplayName,
      peerAvatar: null,
      ownName: own ?? '',
      ownAvatar: sessionStore.get().ownAvatar,
    });
    void hubClient
      .getProfileDetail(p.OtherProfileId)
      .then((d) => {
        const avatar = d.Photos.find((ph) => ph.Order === 0)?.WebpBytes ?? null;
        setPendingMatch({
          peerProfileId: p.OtherProfileId,
          peerName: p.OtherDisplayName,
          peerAvatar: avatar,
          ownName: own ?? '',
          ownAvatar: sessionStore.get().ownAvatar,
        });
      })
      .catch(() => undefined);
    router.navigate(Screen.Match);
  });

  hubClient.on('MessageReceived', (p) => {
    // A new message un-archives the conversation (mirrors ChatArchiveStore auto-unarchive).
    chatArchiveStore.setArchived(p.FromProfileId, false);
    emitLive('messageReceived', {
      fromProfileId: p.FromProfileId,
      messageId: p.MessageId,
      ciphertext: p.Ciphertext,
      nonce: p.Nonce,
      createdAtUtc: p.CreatedAtUtc,
    });
  });

  hubClient.on('MessageRead', (p) => {
    emitLive('messageRead', {
      byProfileId: p.ByProfileId,
      messageIds: p.MessageIds,
      readAtUtc: p.ReadAtUtc,
    });
  });

  hubClient.on('DeckRefresh', (p) => emitLive('deckRefresh', { reason: p.Reason }));

  hubClient.on('Unmatched', (p) => {
    emitLive('unmatched', { otherProfileId: p.OtherProfileId });
  });

  hubClient.on('BlockedByPeer', (p) => {
    emitLive('blockedByPeer', { otherProfileId: p.OtherProfileId });
  });

  hubClient.on('WarningIssued', (p) => {
    sessionStore.update((s) =>
      s.connection
        ? { ...s, connection: { ...s.connection, Warnings: [...s.connection.Warnings, p.Warning] } }
        : s
    );
    pushToast(p.Warning.Reason, 'error', 8000);
  });

  hubClient.on('ModeratorMessageIssued', (p) => {
    // Append idempotently to the cached snapshot; the startup gate / settings list surface it from there.
    sessionStore.update((s) =>
      s.connection && !s.connection.ModeratorMessages.some((m) => m.Id === p.Message.Id)
        ? {
            ...s,
            connection: {
              ...s.connection,
              ModeratorMessages: [...s.connection.ModeratorMessages, p.Message],
            },
          }
        : s
    );
    pushToast(p.Message.Body, 'info', 8000);
  });

  hubClient.on('AccountBanned', (p) => {
    sessionStore.update((s) => ({ ...s, result: 'banned' }));
    if (p.Reason) {
      sessionStore.update((s) =>
        s.connection ? { ...s, connection: { ...s.connection, BanReason: p.Reason } } : s
      );
    }
    router.navigate(Screen.Banned);
  });

  registerConnectionWatcher();
}

// Screens that own the connection lifecycle themselves — the offline gate should not interrupt them.
const OFFLINE_EXEMPT = new Set<Screen>([
  Screen.Splash,
  Screen.Onboarding,
  Screen.Banned,
  Screen.Outdated,
]);

/** Routes to the Offline screen when the hub drops mid-session and back to the prior screen once restored
 *  (mirrors the plugin's AetherSignalService → ScreenRouter offline gate). */
function registerConnectionWatcher(): void {
  let screenBeforeOffline: Screen | null = null;
  connection.onStateChange((state) => {
    const current = router.current.screen;
    if (state === SignalConnectionState.Connected) {
      if (current === Screen.Offline) {
        router.navigate(screenBeforeOffline ?? Screen.Deck);
        screenBeforeOffline = null;
      }
      return;
    }
    // Disconnected / Reconnecting / Connecting: show the offline gate unless an exempt screen owns it.
    if (current !== Screen.Offline && !OFFLINE_EXEMPT.has(current)) {
      screenBeforeOffline = current;
      router.navigate(Screen.Offline);
    }
  });
}
