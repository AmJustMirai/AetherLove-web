// Client-side, per-install set of archived matches keyed by peer profile id. Web port of
// Services/ChatArchiveStore.cs (backed by localStorage instead of the Dalamud config). Observable so the
// matches/archive lists re-render on change.

import { createStore } from './store';
import { archiveStorage } from '../services/storage';
import type { Guid } from '../shared/wire';

const archiveSet = createStore<ReadonlySet<Guid>>(new Set(archiveStorage.load()));

export const chatArchiveStore = {
  get: archiveSet.get,
  subscribe: archiveSet.subscribe,
  isArchived: (peerId: Guid): boolean => archiveSet.get().has(peerId),
  setArchived(peerId: Guid, archived: boolean): void {
    const next = new Set(archiveSet.get());
    if (archived ? !next.has(peerId) : next.has(peerId)) {
      if (archived) next.add(peerId);
      else next.delete(peerId);
      archiveSet.set(next);
      archiveStorage.save([...next]);
    }
  },
};
