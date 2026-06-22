// Effective reduce-motion flag: the OS `prefers-reduced-motion` OR the user's in-app setting (mirrors
// AccessibilityService.ReduceMotion). Match effects render their static end-frame when this is true.

import {settingsStore} from '../state/settings';

export function prefersReducedMotion(): boolean {
    const os =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    return Boolean(os) || settingsStore.get().reduceMotion;
}
