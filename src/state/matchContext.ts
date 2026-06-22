// Web port of Screens/MatchContent.cs + PendingMatchContext. Holds the pair whose match the celebration
// overlay is about to show: set either from the local swipe result (we already have the deck card's
// avatar) or from a MatchCreated push (name only; avatar fetched best-effort). Cleared once consumed.

import {createStore} from './store';
import type {Guid} from '../shared/wire';

export interface PendingMatch {
    peerProfileId: Guid;
    peerName: string;
    peerAvatar: Uint8Array | null;
    ownName: string;
    ownAvatar: Uint8Array | null;
}

export const pendingMatchStore = createStore<PendingMatch | null>(null);

export function setPendingMatch(match: PendingMatch): void {
    pendingMatchStore.set(match);
}

export function clearPendingMatch(): void {
    pendingMatchStore.set(null);
}
