// User UI preferences not tied to the profile: phone size preset (UiScale) and a reduce-motion override
// (the plugin's AccessibilityService.ReduceMotion). The OS `prefers-reduced-motion` is honoured too; the
// effective value is the OR of the two (see effects/reduceMotion.ts).

import {createStore} from './store';
import type {PhoneScalePreset} from '../ui/scale';

export interface Settings {
    phoneScale: PhoneScalePreset;
    reduceMotion: boolean;
    soundEffects: boolean;
    /** Always blur NSFW imagery in the deck/profiles, even when the viewer has opted in (Settings → Privacy). */
    alwaysBlurNsfw: boolean;
}

const STORAGE_KEY = 'aetherlove:settings';

const DEFAULTS: Settings = {
    phoneScale: 'medium',
    reduceMotion: false,
    soundEffects: true,
    alwaysBlurNsfw: false,
};

function loadInitial(): Settings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return {...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>)};
    } catch {
        /* ignore */
    }
    return DEFAULTS;
}

export const settingsStore = createStore<Settings>(loadInitial());

export function updateSettings(patch: Partial<Settings>): void {
    settingsStore.update((s) => {
        const next = {...s, ...patch};
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            /* ignore */
        }
        return next;
    });
}
