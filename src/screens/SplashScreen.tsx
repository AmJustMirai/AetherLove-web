// Web port of Screens/SplashScreen.cs. Shows the wordmark with a lub-dub heartbeat while the session
// bootstrap runs in the background, then routes to the resolved start screen. The plugin loaded a logo
// PNG per theme; we render an accent heart wordmark instead (no bundled art) — the same signature.

import { useEffect, useRef, useState } from 'react';
import { motion, type TargetAndTransition } from 'framer-motion';
import { boot, resolveNextScreen } from '../state/session';
import { router } from '../app/router';
import { useT } from '../i18n/useT';

// lub-dub: two quick beats then a rest, looped (mirrors SplashScreen.BeatTimes / DubOffset).
const HEARTBEAT: TargetAndTransition = {
  scale: [1, 1.12, 1, 1.08, 1, 1, 1],
  transition: {
    duration: 2,
    times: [0, 0.08, 0.16, 0.24, 0.32, 0.6, 1],
    repeat: Infinity,
    ease: 'easeOut',
  },
};

const MIN_SPLASH_MS = 1400;

export function SplashScreen() {
  const t = useT();
  const [ready, setReady] = useState(false);
  const shownAt = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    void boot().then(() => {
      if (cancelled) return;
      const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - shownAt.current));
      setTimeout(() => !cancelled && setReady(true), wait);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready) router.navigate(resolveNextScreen());
  }, [ready]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6">
      <motion.div animate={HEARTBEAT} className="text-accent">
        <svg width="96" height="96" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 21s-7.5-4.6-10-9.2C.5 8.6 2 5.5 5 5.5c1.9 0 3.2 1.1 4 2.3.8-1.2 2.1-2.3 4-2.3 3 0 4.5 3.1 3 6.3-2.5 4.6-10 9.2-10 9.2z" />
        </svg>
      </motion.div>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-strong">
        AetherLove
      </h1>
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-subtle">
        {t('splash.connecting')}
      </p>
    </div>
  );
}
