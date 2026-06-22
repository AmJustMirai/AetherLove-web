// The match-effect pool. MatchHost picks one at random per match (web port of MatchScreen's random
// IMatchEffect selection). Three are ported in this pass; the remaining 17 land in later batches and
// register here.

import type {MatchEffect} from './types';
import {ClassicEffect} from './effects/classic';
import {CosmicEffect} from './effects/cosmic';
import {FireworkEffect} from './effects/firework';

export const EFFECT_FACTORIES: Array<() => MatchEffect> = [
    () => new ClassicEffect(),
    () => new CosmicEffect(),
    () => new FireworkEffect(),
];

export function pickRandomEffect(): MatchEffect {
    return EFFECT_FACTORIES[(Math.random() * EFFECT_FACTORIES.length) | 0]();
}
