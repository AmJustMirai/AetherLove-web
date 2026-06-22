// Shared theme picker — the appearance cards used by onboarding (StepPreferences) and Settings. Lists every
// theme with a gradient swatch (secondaryStart→secondaryEnd), its name, and a Light/Dark mode badge so the
// one light theme reads as a deliberate choice rather than an odd accent.

import {useStore} from '../state/hooks';
import {useT} from '../i18n/useT';
import {type AppTheme, setTheme, THEMES, themeStore} from './theme';
import {cn} from './cn';

export function ThemePicker() {
    const t = useT();
    const active = useStore(themeStore);
    const options = Object.keys(THEMES) as AppTheme[];

    return (
        <div className="flex flex-col gap-2">
            {options.map((key) => {
                const def = THEMES[key];
                const selected = active === key;
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setTheme(key)}
                        aria-pressed={selected}
                        className={cn(
                            'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[14px] transition-colors',
                            selected
                                ? 'border-accent bg-accent/20 text-strong'
                                : 'border-line/10 text-subtle hover:bg-surface/5',
                        )}
                    >
            <span
                className="h-5 w-5 shrink-0 rounded-full ring-1 ring-line/20"
                style={{
                    background: `linear-gradient(135deg, rgb(${def.secondaryStart}), rgb(${def.secondaryEnd}))`,
                }}
            />
                        <span className="min-w-0 flex-1 truncate font-medium">{def.name}</span>
                        <span
                            className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide',
                                selected ? 'bg-accent/30 text-strong' : 'bg-surface/10 text-muted',
                            )}
                        >
              {t(def.mode === 'light' ? 'theme.mode_light' : 'theme.mode_dark')}
            </span>
                    </button>
                );
            })}
        </div>
    );
}
