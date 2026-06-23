// The whole-viewport app frame. Replaces the old fixed 464×835 PhoneShell: instead of a phone floating
// on a void, the app now fills the screen like a desktop dating site. Applies the active theme's palette
// as CSS vars, paints the ambient "aether" backdrop, and chooses a layout per route:
//   - full-bleed  (Splash, Match): the screen owns the whole canvas.
//   - card        (Onboarding): a centred sign-up column on the void.
//   - chrome      (Discover, Chats, Profile, Settings, …): persistent nav rail + main pane.
// On narrow viewports the rail collapses to a bottom bar.

import { type ReactNode, useLayoutEffect, useRef } from 'react';
import { useStore } from '../state/hooks';
import { applyThemeVars, THEMES, themeStore } from '../ui/theme';
import { router, Screen } from './router';
import { AppNav } from './AppNav';
import { ToastHost } from '../ui/components';

// Full-bleed screens own the whole canvas and supply their own internal layout (the onboarding split,
// the splash heartbeat, the match celebration). Everything else gets the persistent nav chrome.
const FULL_BLEED = new Set<Screen>([Screen.Splash, Screen.Match, Screen.Onboarding]);

function layoutFor(screen: Screen): 'full' | 'chrome' {
  return FULL_BLEED.has(screen) ? 'full' : 'chrome';
}

/** Ambient backdrop over the void. Dark themes get drifting accent glows + a twinkling constellation and a
 *  top vignette; the light theme drops the star field and the darkening vignette for warm daylight washes. */
function AetherBackground({ mode }: { mode: 'dark' | 'light' }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-void">
      <div
        className="absolute -left-[15%] -top-[20%] h-[70vh] w-[70vh] rounded-full blur-3xl animate-[aether-drift_16s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(circle, rgb(var(--al-accent) / ${mode === 'light' ? 0.18 : 0.3}), transparent 65%)`,
        }}
      />
      <div
        className="absolute -bottom-[25%] -right-[10%] h-[75vh] w-[75vh] rounded-full blur-3xl animate-[aether-drift_22s_ease-in-out_infinite_reverse]"
        style={{
          background: `radial-gradient(circle, rgb(var(--al-secondary-end) / ${mode === 'light' ? 0.16 : 0.2}), transparent 65%)`,
        }}
      />
      {mode === 'dark' && (
        <>
          {/* Constellation: a tiled field of pin-prick stars, slowly twinkling (night sky only). */}
          <div
            className="absolute inset-0 animate-[aether-twinkle_7s_ease-in-out_infinite]"
            style={{
              backgroundImage:
                'radial-gradient(1px 1px at 20% 30%, rgb(var(--al-accent-light) / 0.7), transparent),' +
                'radial-gradient(1px 1px at 70% 60%, rgb(var(--al-accent-light) / 0.5), transparent),' +
                'radial-gradient(1.5px 1.5px at 45% 85%, rgb(var(--al-text-strong) / 0.5), transparent),' +
                'radial-gradient(1px 1px at 85% 20%, rgb(var(--al-accent-light) / 0.6), transparent),' +
                'radial-gradient(1px 1px at 10% 75%, rgb(var(--al-text-strong) / 0.4), transparent)',
              backgroundSize: '320px 320px',
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,rgb(var(--al-accent-dark)/0.35),transparent_55%)]" />
        </>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const theme = useStore(themeStore);
  const route = useStore(router.store);
  const rootRef = useRef<HTMLDivElement>(null);
  const layout = layoutFor(route.screen);

  // Apply the active theme's CSS vars onto the shell root so all descendants resolve themed colours.
  useLayoutEffect(() => {
    if (rootRef.current) applyThemeVars(rootRef.current, theme);
  }, [theme]);

  return (
    <div ref={rootRef} className="relative h-full w-full overflow-hidden font-body text-body">
      <AetherBackground mode={THEMES[theme].mode} />

      {layout === 'chrome' ? (
        <div className="relative flex h-full w-full">
          <AppNav variant="rail" />
          <main className="relative min-w-0 flex-1 pb-[68px] lg:pb-0">{children}</main>
          {/* Mirror of the nav rail's footprint so the centred content column lands on the true viewport
              centre instead of being pushed right by the rail. */}
          <div aria-hidden className="hidden shrink-0 lg:block lg:w-[88px] xl:w-[228px]" />
          <AppNav variant="bar" />
        </div>
      ) : (
        <div className="relative h-full w-full">{children}</div>
      )}

      <ToastHost />
    </div>
  );
}
