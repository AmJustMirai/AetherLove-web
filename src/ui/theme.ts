// Web port of Services/ThemeService.cs + ThemeDefinition.cs.
//
// The three palettes are reproduced exactly (the C# Vector4s, converted to 8-bit RGB). Each theme is
// applied by setting CSS custom properties on the phone-shell root; switching themes swaps the whole
// set. Colours are stored as "R G B" triplets so they compose with Tailwind's
// `rgb(var(--al-accent) / <alpha-value>)` mapping and with `rgb(var(--x) / 0.4)` at any call site.

import { createStore } from '../state/store';

export type AppTheme = 'crystalVoid' | 'vanillaSunrise' | 'allaganPassion' | 'thanalanSands';

/** RGB triplet string, e.g. "186 107 201", for use inside rgb(var(--x) / a). */
type Rgb = string;

/** Surface palette: the page chrome (backgrounds, text, lines) that flips between dark and light modes.
 *  Dark themes omit it and inherit DARK_SURFACES; a light theme supplies its own. */
export interface SurfacePalette {
  void: Rgb; // page background
  textStrong: Rgb; // headings / high-emphasis text (replaces literal white)
  body: Rgb; // body text
  subtle: Rgb; // dimmed text
  muted: Rgb; // most dimmed text
  surface: Rgb; // tint composited at low alpha for cards/panels
  line: Rgb; // tint composited at low alpha for borders/dividers
  scrim: Rgb; // modal / toast backdrop
}

export interface ThemeDefinition {
  name: string;
  mode: 'dark' | 'light';
  accent: Rgb;
  accentLight: Rgb;
  accentDark: Rgb;
  chipFill: Rgb;
  secondaryStart: Rgb;
  secondaryEnd: Rgb;
  buttonNormal: Rgb;
  buttonHovered: Rgb;
  buttonActive: Rgb;
  /** Optional per-theme surfaces; dark themes inherit DARK_SURFACES. */
  surfaces?: SurfacePalette;
}

/** The original dark chrome — the values that lived only in index.css before themes drove surfaces. */
const DARK_SURFACES: SurfacePalette = {
  void: '11 6 18',
  textStrong: '245 240 255',
  body: '217 217 217',
  subtle: '179 179 189',
  muted: '140 140 140',
  surface: '255 255 255',
  line: '255 255 255',
  scrim: '0 0 0',
};

export const THEMES: Record<AppTheme, ThemeDefinition> = {
  crystalVoid: {
    name: 'Crystal Void',
    mode: 'dark',
    accent: '186 107 201',
    accentLight: '217 143 230',
    accentDark: '122 64 161',
    chipFill: '38 18 59',
    secondaryStart: '158 102 235',
    secondaryEnd: '250 115 199',
    buttonNormal: '128 56 179',
    buttonHovered: '173 87 224',
    buttonActive: '97 31 140',
  },
  vanillaSunrise: {
    name: 'Vanilla Sunrise',
    mode: 'dark',
    accent: '255 184 77',
    accentLight: '255 217 128',
    accentDark: '184 112 15',
    chipFill: '56 33 5',
    secondaryStart: '255 199 77',
    secondaryEnd: '102 230 173',
    buttonNormal: '184 112 15',
    buttonHovered: '255 184 77',
    buttonActive: '128 71 5',
  },
  allaganPassion: {
    name: 'Allagan Passion',
    mode: 'dark',
    accent: '242 71 102',
    accentLight: '255 122 148',
    accentDark: '153 26 51',
    chipFill: '51 10 20',
    secondaryStart: '242 77 102',
    secondaryEnd: '92 143 245',
    buttonNormal: '153 26 51',
    buttonHovered: '217 56 89',
    buttonActive: '102 13 31',
  },
  // The desert capital at high noon: warm sand canvas, terracotta accent, ink-brown text. The one light
  // theme — supplies its own surfaces so the whole app flips from the void to daylight.
  thanalanSands: {
    name: 'Thanalan Sands',
    mode: 'light',
    accent: '194 106 74',
    accentLight: '224 146 110',
    accentDark: '150 74 48',
    chipFill: '232 214 190',
    secondaryStart: '224 162 92',
    secondaryEnd: '198 122 90',
    // Buttons run a shade darker than the accent so the light on-accent label keeps strong contrast.
    buttonNormal: '168 84 56',
    buttonHovered: '190 104 74',
    buttonActive: '140 66 42',
    surfaces: {
      void: '244 236 221',
      textStrong: '59 49 40',
      body: '74 63 52',
      subtle: '122 108 92',
      muted: '158 144 126',
      surface: '59 49 40',
      line: '59 49 40',
      scrim: '40 30 22',
    },
  },
};

type ColourKey = keyof Omit<ThemeDefinition, 'name' | 'mode' | 'surfaces'>;

const VAR_MAP: Record<ColourKey, string> = {
  accent: '--al-accent',
  accentLight: '--al-accent-light',
  accentDark: '--al-accent-dark',
  chipFill: '--al-chip-fill',
  secondaryStart: '--al-secondary-start',
  secondaryEnd: '--al-secondary-end',
  buttonNormal: '--al-btn-normal',
  buttonHovered: '--al-btn-hovered',
  buttonActive: '--al-btn-active',
};

const SURFACE_VAR_MAP: Record<keyof SurfacePalette, string> = {
  void: '--al-void',
  textStrong: '--al-text-strong',
  body: '--al-body',
  subtle: '--al-subtle',
  muted: '--al-muted',
  surface: '--al-surface',
  line: '--al-line',
  scrim: '--al-scrim',
};

/** Writes a theme's palette onto an element as CSS custom properties (mirrors ThemeService.SetTheme).
 *  Also flips the element's `data-mode` + `color-scheme` so native controls/scrollbars follow the theme. */
export function applyThemeVars(el: HTMLElement, theme: AppTheme): void {
  const def = THEMES[theme];
  for (const [key, cssVar] of Object.entries(VAR_MAP)) {
    el.style.setProperty(cssVar, def[key as ColourKey]);
  }
  const surfaces = def.surfaces ?? DARK_SURFACES;
  for (const [key, cssVar] of Object.entries(SURFACE_VAR_MAP)) {
    el.style.setProperty(cssVar, surfaces[key as keyof SurfacePalette]);
  }
  el.dataset.mode = def.mode;
  el.style.colorScheme = def.mode;
}

const STORAGE_KEY = 'aetherlove:theme';

function loadInitial(): AppTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
    if (raw && raw in THEMES) return raw;
  } catch {
    /* ignore */
  }
  return 'crystalVoid';
}

/** Observable current-theme store; persists the selection like ThemeService does to Configuration. */
export const themeStore = createStore<AppTheme>(loadInitial());

export function setTheme(theme: AppTheme): void {
  if (themeStore.get() === theme) return;
  themeStore.set(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode — tolerate */
  }
}
