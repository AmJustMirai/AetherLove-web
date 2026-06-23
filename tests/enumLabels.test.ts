import { describe, expect, it } from 'vitest';
import { labelOf, LOOKING_FOR_OPTIONS, maskLabels, RACE_OPTIONS } from '../src/shared/enumLabels';
import { LookingFor, Race } from '../src/shared/enums';

describe('enum label helpers', () => {
  it('labelOf resolves a single flag', () => {
    expect(labelOf(RACE_OPTIONS, Race.AuRa)).toBe('Au Ra');
  });

  it('maskLabels returns only the set bits', () => {
    const mask = LookingFor.Chatting | LookingFor.LongTermRelationship;
    expect(maskLabels(LOOKING_FOR_OPTIONS, mask)).toEqual(['Chatting', 'Long-term relationship']);
  });

  it('maskLabels is empty for an unset mask', () => {
    expect(maskLabels(LOOKING_FOR_OPTIONS, 0)).toEqual([]);
  });
});
