// Deck data + swipe orchestration. Loads MatchDeckDto, hands out the top card, sends swipes, and surfaces
// the cooldown window (NextPullAtUtc) when the slot empties. Refetches on a DeckRefresh push. Mirrors
// DeckScreen's data half; the gesture/animation lives in DeckScreen.tsx.

import { useCallback, useEffect, useState } from 'react';
import { hubClient } from '../../services/signal/hubClient';
import { SwipeDirection } from '../../shared/enums';
import type { DeckCardDto, MatchDeckDto } from '../../shared/dtos';
import { onLive } from '../../state/events';
import { setPendingMatch } from '../../state/matchContext';
import { sessionStore } from '../../state/session';
import { router, Screen } from '../../app/router';

interface DeckState {
  loading: boolean;
  cards: DeckCardDto[];
  nextPullAtUtc: string | null;
  noPool: boolean;
  error: string | null;
}

export function useDeck() {
  const [state, setState] = useState<DeckState>({
    loading: true,
    cards: [],
    nextPullAtUtc: null,
    noPool: false,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const deck: MatchDeckDto = await hubClient.getMatchDeck();
      setState({
        loading: false,
        cards: deck.Cards,
        nextPullAtUtc: deck.NextPullAtUtc,
        noPool: deck.NoPoolForPreferences,
        error: null,
      });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }, []);

  useEffect(() => {
    void load();
    return onLive('deckRefresh', () => void load());
  }, [load]);

  const top = state.cards[0] ?? null;

  const swipe = useCallback(
    async (direction: SwipeDirection) => {
      const card = state.cards[0];
      if (!card) return;
      // Pop the card optimistically so the next one is ready under the gesture.
      setState((s) => ({ ...s, cards: s.cards.slice(1) }));
      try {
        const result = await hubClient.swipe(card.ProfileId, direction);
        if (result.IsMatch) {
          setPendingMatch({
            peerProfileId: card.ProfileId,
            peerName: card.DisplayName,
            peerAvatar: card.AvatarWebp,
            ownName: sessionStore.get().displayName ?? '',
            ownAvatar: null,
          });
          router.navigate(Screen.Match);
        }
      } catch {
        // Swipe failed — put the card back on top so it isn't silently lost.
        setState((s) => ({ ...s, cards: [card, ...s.cards] }));
      }
    },
    [state.cards]
  );

  return {
    ...state,
    top,
    hasCards: state.cards.length > 0,
    swipe,
    like: () => swipe(SwipeDirection.Like),
    pass: () => swipe(SwipeDirection.Pass),
    reload: load,
  };
}
