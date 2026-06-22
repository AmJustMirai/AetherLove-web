// i18n engine. Web port of Services/Localization (LanguageProvider + Loc.T). The English catalog is
// the source of truth; the other five languages are parallel records keyed by the same StringKeys,
// loaded in a later batch. The active language is an observable store so a switch re-renders the tree.

import {createStore} from '../state/store';
import {Language} from '../shared/enums';
import {en, type StringKey} from './strings.en';

/** Catalogs registered so far. English ships now; ES/FR/RU/DE/PT get added later. */
const CATALOGS: Partial<Record<Language, Partial<Record<StringKey, string>>>> = {
    [Language.English]: en,
};

/** BCP-47 locale per app language, for Intl date/number formatting. */
const LOCALE: Record<Language, string> = {
    [Language.English]: 'en',
    [Language.Spanish]: 'es',
    [Language.French]: 'fr',
    [Language.Russian]: 'ru',
    [Language.German]: 'de',
    [Language.Portuguese]: 'pt',
};

const STORAGE_KEY = 'aetherlove:lang';

function loadInitial(): Language {
    try {
        const raw = Number(localStorage.getItem(STORAGE_KEY));
        if (raw in LOCALE) return raw as Language;
    } catch {
        /* ignore */
    }
    return Language.English;
}

export const languageStore = createStore<Language>(loadInitial());

export function setLanguage(lang: Language): void {
    languageStore.set(lang);
    try {
        localStorage.setItem(STORAGE_KEY, String(lang));
    } catch {
        /* ignore */
    }
}

function interpolate(template: string, args: unknown[]): string {
    if (args.length === 0) return template;
    return template.replace(/\{(\d+)\}/g, (m, i) => {
        const v = args[Number(i)];
        return v === undefined ? m : String(v);
    });
}

/** Resolves a key for a given language, falling back to English then the raw key. */
export function translate(lang: Language, key: StringKey, ...args: unknown[]): string {
    const template = CATALOGS[lang]?.[key] ?? en[key] ?? key;
    return interpolate(template, args);
}

export function currentLocale(): string {
    return LOCALE[languageStore.get()];
}

export type {StringKey};
