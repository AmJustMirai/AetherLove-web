// Temporary stand-in for screens scoped to a later batch (Profile, MyProfile, Settings, News, Banned,
// Offline, Outdated, PassphraseUnlock, WarningsAcknowledge, ChatArchive). Keeps routing total so the
// shell never renders nothing. Each will be replaced by its real port.

import { Button } from '../ui/components';
import { router, Screen } from '../app/router';

export function PlaceholderScreen({ screen }: { screen: Screen }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-display text-2xl font-bold text-strong">{screen}</h1>
      <p className="text-sm text-subtle">This screen is part of a later batch.</p>
      <Button variant="ghost" onClick={() => router.navigate(Screen.Deck)}>
        Back to deck
      </Button>
    </div>
  );
}
