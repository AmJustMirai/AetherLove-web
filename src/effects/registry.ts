// The match-effect pool. MatchHost picks one at random per match (web port of MatchScreen's random
// IMatchEffect selection). Nine are ported in this pass (3 original + 6 new); 11 remain.

import type { MatchEffect } from './types';
import { ClassicEffect } from './effects/classic';
import { CosmicEffect } from './effects/cosmic';
import { FireworkEffect } from './effects/firework';
import { SynthwaveEffect } from './effects/synthwave';
import { AuroraEffect } from './effects/aurora';
import { SupernovaEffect } from './effects/supernova';
import { KaleidoscopeEffect } from './effects/kaleidoscope';
import { TarotEffect } from './effects/tarot';
import { SkyLanternsEffect } from './effects/skylanterns';

export const EFFECT_FACTORIES: Array<() => MatchEffect> = [
  () => new ClassicEffect(),
  () => new CosmicEffect(),
  () => new FireworkEffect(),
  () => new SynthwaveEffect(),
  () => new AuroraEffect(),
  () => new SupernovaEffect(),
  () => new KaleidoscopeEffect(),
  () => new TarotEffect(),
  () => new SkyLanternsEffect(),
];

export function pickRandomEffect(): MatchEffect {
  return EFFECT_FACTORIES[(Math.random() * EFFECT_FACTORIES.length) | 0]();
}
