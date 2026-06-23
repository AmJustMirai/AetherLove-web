// Transient toast notifications (save errors, "blocked by peer", rate-limit hints). Replaces the
// plugin's NotificationCenter for in-shell feedback. A global store anyone can push to; ToastHost
// renders the stack inside the phone shell.

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createStore } from '../../state/store';
import { useStore } from '../../state/hooks';

export type ToastKind = 'info' | 'error' | 'success';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const toastStore = createStore<ToastItem[]>([]);
let nextId = 1;

export function pushToast(message: string, kind: ToastKind = 'info', ttlMs = 4000): void {
  const id = nextId++;
  toastStore.update((list) => [...list, { id, kind, message }]);
  setTimeout(() => toastStore.update((list) => list.filter((t) => t.id !== id)), ttlMs);
}

// One raised surface (bg-void flips with the theme); kind is carried by the border + an accent bar so the
// text stays high-contrast in both dark and light modes.
const KIND_STYLE: Record<ToastKind, string> = {
  info: 'border-line/15',
  error: 'border-danger/50',
  success: 'border-success/40',
};

export function ToastHost() {
  const toasts = useStore(toastStore);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`pointer-events-auto w-full max-w-[360px] rounded-xl border bg-void px-4 py-2.5 text-[13px] text-strong shadow-lg backdrop-blur-sm ${KIND_STYLE[t.kind]}`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Convenience: auto-dismissing inline use without the host (rarely needed). */
export function useToastTtl(active: boolean, fn: () => void, ms: number) {
  useEffect(() => {
    if (!active) return;
    const h = setTimeout(fn, ms);
    return () => clearTimeout(h);
  }, [active, fn, ms]);
}
