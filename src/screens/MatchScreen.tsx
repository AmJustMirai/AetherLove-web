// Web port of Screens/MatchScreen.cs — the match host. Reads the pending match, decodes the avatars,
// picks a random celebration effect, and overlays the action buttons (open the chat / keep swiping).
// Consuming the pending match here means dismissing can't re-trigger it.

import { useEffect, useMemo, useRef, useState } from 'react';
import { MatchCanvas } from '../effects/MatchCanvas';
import { pickRandomEffect } from '../effects/registry';
import type { MatchContent } from '../effects/types';
import { useStore } from '../state/hooks';
import { clearPendingMatch, pendingMatchStore } from '../state/matchContext';
import { router, Screen } from '../app/router';
import { webpUrl } from '../ui/image';
import { Button } from '../ui/components';
import { useT } from '../i18n/useT';

function useImage(bytes: Uint8Array | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const url = webpUrl(bytes);
    if (!url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImg(null);
      return;
    }
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [bytes]);
  return img;
}

export function MatchScreen() {
  const t = useT();
  const pending = useStore(pendingMatchStore);
  // Pick the effect once per mount (stable across re-renders), like MatchScreen.OnShow.
  const effect = useMemo(() => pickRandomEffect(), []);

  const ownImg = useImage(pending?.ownAvatar ?? null);
  const peerImg = useImage(pending?.peerAvatar ?? null);

  // Snapshot peer routing info before we clear the pending match on unmount.
  const peerRef = useRef<{ id: string; name: string } | null>(null);
  // eslint-disable-next-line react-hooks/refs
  if (pending) peerRef.current = { id: pending.peerProfileId, name: pending.peerName };

  useEffect(() => () => clearPendingMatch(), []);

  // If we somehow land here with nothing pending, bail back to the deck.
  useEffect(() => {
    if (!pending && !peerRef.current) router.navigate(Screen.Deck);
  }, [pending]);

  const content: MatchContent = {
    ownAvatar: ownImg,
    peerAvatar: peerImg,
    ownName: pending?.ownName || t('deck.match_you'),
    peerName: pending?.peerName || t('deck.match_your_match'),
  };

  function openChat() {
    const peer = peerRef.current;
    if (peer) router.navigate(Screen.Chat, { peerId: peer.id, peerName: peer.name });
    else router.navigate(Screen.Deck);
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="relative aspect-[464/835] h-full max-h-[860px] w-auto max-w-full overflow-hidden rounded-[28px] border border-line/10 shadow-[0_30px_90px_-30px_rgb(var(--al-accent)/0.6)]">
        <MatchCanvas effect={effect} content={content} />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-6">
          <Button className="w-full max-w-[280px]" onClick={openChat}>
            {t('deck.match_send_message')}
          </Button>
          <Button
            variant="ghost"
            className="w-full max-w-[280px]"
            onClick={() => router.navigate(Screen.Deck)}
          >
            {t('deck.match_keep_swiping')}
          </Button>
        </div>
      </div>
    </div>
  );
}
