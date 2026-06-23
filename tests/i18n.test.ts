import { describe, expect, it } from 'vitest';
import { translate } from '../src/i18n';
import { Language } from '../src/shared/enums';

describe('translate', () => {
  it('resolves an English key', () => {
    expect(translate(Language.English, 'common.next')).toBe('Next');
  });

  it('interpolates positional args', () => {
    expect(translate(Language.English, 'chatlist.unread_many', 5)).toBe('5 new messages');
  });

  it('falls back to English for an unported language', () => {
    expect(translate(Language.German, 'common.back')).toBe('Back');
  });
});
