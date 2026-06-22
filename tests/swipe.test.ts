import {describe, expect, it} from 'vitest';
import {SwipeDirection} from '../src/shared/enums';

// Guards the wire mapping the deck relies on (DeckCard throw → hubClient.swipe). The numeric values ride
// the MessagePack contract, so a drift here would silently mis-swipe.
describe('SwipeDirection wire values', () => {
    it('matches the server contract', () => {
        expect(SwipeDirection.Pass).toBe(1);
        expect(SwipeDirection.Like).toBe(2);
    });
});
