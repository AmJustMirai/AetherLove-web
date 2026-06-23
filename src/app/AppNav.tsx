// App navigation, in two skins driven by viewport. `rail` is a persistent vertical sidebar on desktop
// (≥lg) carrying the wordmark, the primary destinations, and an account chip. `bar` is the bottom tab
// bar shown on small screens. Both share one item set + the new-match badge. Replaces BottomNav.

import type { ReactNode } from 'react';
import { useStore } from '../state/hooks';
import { sessionStore } from '../state/session';
import { router, Screen } from './router';
import { useT } from '../i18n/useT';
import { Avatar } from '../ui/components';
import { cn } from '../ui/cn';

interface NavItem {
  screen: Screen;
  labelKey: Parameters<ReturnType<typeof useT>>[0];
  icon: ReactNode;
}

// Glyph icons drawn inline so they inherit currentColor and stay crisp at any size (no emoji rendering).
const Icon = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 24 24"
    className="h-[22px] w-[22px]"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d={d} />
  </svg>
);

const ITEMS: NavItem[] = [
  {
    screen: Screen.Deck,
    labelKey: 'nav.deck',
    icon: (
      <Icon d="M12 21s-7.5-4.6-10-9.2C.5 8.6 2 5.5 5 5.5c1.9 0 3.2 1.1 4 2.3.8-1.2 2.1-2.3 4-2.3 3 0 4.5 3.1 3 6.3C19.5 16.4 12 21 12 21z" />
    ),
  },
  {
    screen: Screen.ChatList,
    labelKey: 'nav.chats',
    icon: (
      <Icon d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z" />
    ),
  },
  {
    screen: Screen.MyProfile,
    labelKey: 'nav.profile',
    icon: <Icon d="M20 21a8 8 0 1 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />,
  },
  {
    screen: Screen.Settings,
    labelKey: 'nav.settings',
    icon: (
      <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.92 1.06V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 6.6 19.4l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9H4.5a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 6.6 4.6l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 12 2.6V2.5a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.4 1.51l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0 1.06 2.92H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    ),
  },
];

function useNewMatches() {
  return useStore(sessionStore).connection?.NewMatchCount ?? 0;
}

export function AppNav({ variant }: { variant: 'rail' | 'bar' }) {
  const t = useT();
  const active = useStore(router.store).screen;
  const newMatches = useNewMatches();
  const displayName = useStore(sessionStore).displayName;

  if (variant === 'bar') {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch border-t border-line/10 bg-void/50 backdrop-blur-xl lg:hidden">
        {ITEMS.map((item) => {
          const isActive = item.screen === active;
          return (
            <button
              key={item.screen}
              onClick={() => router.navigate(item.screen)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-accent-light' : 'text-muted hover:text-subtle'
              )}
            >
              {item.icon}
              {t(item.labelKey)}
              {item.screen === Screen.ChatList && newMatches > 0 && (
                <span className="absolute right-[28%] top-1.5 h-2 w-2 rounded-full bg-danger" />
              )}
            </button>
          );
        })}
      </nav>
    );
  }

  // Desktop rail.
  return (
    <nav className="hidden h-full w-[88px] shrink-0 flex-col items-center gap-2 border-r border-line/10 bg-void/25 py-6 backdrop-blur-xl lg:flex xl:w-[228px] xl:items-stretch xl:px-4">
      <div className="mb-6 flex items-center gap-2.5 px-1 xl:px-2">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          className="shrink-0 text-accent"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 21s-7.5-4.6-10-9.2C.5 8.6 2 5.5 5 5.5c1.9 0 3.2 1.1 4 2.3.8-1.2 2.1-2.3 4-2.3 3 0 4.5 3.1 3 6.3C19.5 16.4 12 21 12 21z" />
        </svg>
        <span className="hidden font-display text-lg font-extrabold tracking-tight text-strong xl:inline">
          AetherLove
        </span>
      </div>

      <div className="flex w-full flex-1 flex-col gap-1">
        {ITEMS.map((item) => {
          const isActive = item.screen === active;
          return (
            <button
              key={item.screen}
              onClick={() => router.navigate(item.screen)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex w-full items-center justify-center gap-3 rounded-xl px-0 py-3 text-[14px] font-semibold transition-colors xl:justify-start xl:px-3',
                isActive
                  ? 'bg-accent/15 text-accent-light'
                  : 'text-subtle hover:bg-surface/5 hover:text-strong'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-full bg-accent-light xl:w-1" />
              )}
              <span className="relative">
                {item.icon}
                {item.screen === Screen.ChatList && newMatches > 0 && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-void/40" />
                )}
              </span>
              <span className="hidden xl:inline">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => router.navigate(Screen.MyProfile)}
        className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-xl py-2 transition-colors hover:bg-surface/5 xl:justify-start xl:px-2"
        aria-label={t('nav.profile')}
      >
        <Avatar bytes={null} size={36} />
        <span className="hidden truncate text-[13px] font-medium text-subtle xl:inline">
          {displayName ?? t('nav.profile')}
        </span>
      </button>
    </nav>
  );
}
