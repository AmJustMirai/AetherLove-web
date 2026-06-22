// React binding for translations. useT() returns a `t(key, ...args)` bound to the active language and
// re-renders when the language changes; useLocale() exposes the BCP-47 code for Intl formatters.

import {useCallback} from 'react';
import {useStore} from '../state/hooks';
import {languageStore, type StringKey, translate} from './index';

export function useT(): (key: StringKey, ...args: unknown[]) => string {
    const lang = useStore(languageStore);
    return useCallback((key: StringKey, ...args: unknown[]) => translate(lang, key, ...args), [lang]);
}
