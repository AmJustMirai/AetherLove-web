import { describe, expect, it } from 'vitest';
import { computePhoneScale, DESIGN, PRESET_MULTIPLIER } from '../src/ui/scale';

describe('computePhoneScale', () => {
  it('caps at the preset multiplier on a large viewport', () => {
    // Plenty of room → bounded by the preset, not the fit.
    expect(computePhoneScale('small', 4000, 4000)).toBe(PRESET_MULTIPLIER.small);
    expect(computePhoneScale('large', 4000, 4000)).toBe(PRESET_MULTIPLIER.large);
  });

  it('shrinks below the preset to fit a small viewport', () => {
    const scale = computePhoneScale('large', DESIGN.width / 2, DESIGN.height / 2);
    expect(scale).toBeLessThan(PRESET_MULTIPLIER.large);
    expect(scale).toBeGreaterThan(0);
  });

  it('is height-bound on a tall-narrow viewport', () => {
    const scale = computePhoneScale('medium', 200, 4000);
    expect(scale).toBeCloseTo(200 / (DESIGN.width + 24), 5);
  });
});
