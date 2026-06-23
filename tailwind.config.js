/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Static brand fallbacks for class-based usage.
        crystal: '#B96ACC',
        vanilla: '#FFB84D',
        allagan: '#F24666',
        // Runtime, theme-driven tokens (ui/theme.ts swaps the CSS vars per active theme).
        accent: 'rgb(var(--al-accent) / <alpha-value>)',
        'accent-light': 'rgb(var(--al-accent-light) / <alpha-value>)',
        'accent-dark': 'rgb(var(--al-accent-dark) / <alpha-value>)',
        'chip-fill': 'rgb(var(--al-chip-fill) / <alpha-value>)',
        'secondary-start': 'rgb(var(--al-secondary-start) / <alpha-value>)',
        'secondary-end': 'rgb(var(--al-secondary-end) / <alpha-value>)',
        // Shared semantic text colours (UiColors.cs).
        body: 'rgb(var(--al-body) / <alpha-value>)',
        subtle: 'rgb(var(--al-subtle) / <alpha-value>)',
        muted: 'rgb(var(--al-muted) / <alpha-value>)',
        danger: 'rgb(var(--al-danger) / <alpha-value>)',
        amber: 'rgb(var(--al-amber) / <alpha-value>)',
        success: 'rgb(var(--al-success) / <alpha-value>)',
        // Theme-driven surfaces (flip dark↔light per active theme).
        void: 'rgb(var(--al-void) / <alpha-value>)',
        strong: 'rgb(var(--al-text-strong) / <alpha-value>)',
        'on-accent': 'rgb(var(--al-on-accent) / <alpha-value>)',
        surface: 'rgb(var(--al-surface) / <alpha-value>)',
        line: 'rgb(var(--al-line) / <alpha-value>)',
        scrim: 'rgb(var(--al-scrim) / <alpha-value>)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
    },
  },
  plugins: [],
};
