// One swipeable profile card — the centrepiece of the deck. Framer Motion drag with rotation, a
// LIKE/NOPE crystal stamp, and a coloured "aether" glow that swells toward the drag direction. Releasing
// past the threshold throws the card off-screen and reports the direction; short drags spring back.

import type { AnimationPlaybackControls } from 'framer-motion';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import type { DeckCardDto } from '@/shared/dtos.ts';
import { SwipeDirection } from '@/shared/enums.ts';
import {
  labelOf,
  LOOKING_FOR_OPTIONS,
  maskLabels,
  RACE_OPTIONS,
  REGION_OPTIONS,
} from '@/shared/enumLabels.ts';
import { revokeUrl, webpUrl } from '@/ui/image.ts';
import { useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/useT.ts';
import { withEmoji } from '@/ui/emoji.ts';

const THROW_THRESHOLD = 110;

export function DeckCard({
  card,
  onSwipe,
  onViewProfile,
}: {
  card: DeckCardDto;
  onSwipe: (dir: SwipeDirection) => void;
  onViewProfile: () => void;
}) {
  const t = useT();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-14, 14]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-140, -40], [1, 0]);
  // Directional aether wash: green glow leaning right (like), red leaning left (pass).
  const likeGlow = useTransform(x, [0, 160], [0, 0.9]);
  const nopeGlow = useTransform(x, [-160, 0], [0.9, 0]);

  // Own the object URL inside one effect: create on mount, revoke on cleanup. The split
  // useMemo-create / effect-revoke pattern races StrictMode's simulated unmount, which revokes
  // the live blob before the <img> loads it — leaving a blank card until a hard refresh.
  const [portrait, setPortrait] = useState<string | null>(null);
  useEffect(() => {
    const url = webpUrl(card.PortraitWebp) ?? webpUrl(card.AvatarWebp);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortrait(url);
    return () => revokeUrl(url);
  }, [card]);

  const [gone, setGone] = useState(false);
  const throwControls = useRef<AnimationPlaybackControls | null>(null);

  // Stop any in-flight throw animation when the card unmounts (e.g. keyed remount after swipe).
  // Without this, the dangling imperative animate() can prevent AnimatePresence from resolving
  // the outgoing screen's exit, leaving the app stuck at opacity 0 (black screen).
  useEffect(
    () => () => {
      throwControls.current?.stop();
    },
    []
  );

  const lookingFor = maskLabels(LOOKING_FOR_OPTIONS, card.LookingForMask).slice(0, 3);
  const subtitle = [labelOf(RACE_OPTIONS, card.Race), labelOf(REGION_OPTIONS, card.Region)]
    .filter(Boolean)
    .join(' · ');

  function release(dir: SwipeDirection) {
    if (gone) return;
    setGone(true);
    const to = dir === SwipeDirection.Like ? 700 : -700;
    throwControls.current = animate(x, to, {
      duration: 0.32,
      ease: 'easeIn',
      onComplete: () => onSwipe(dir),
    });
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab overflow-hidden rounded-[28px] bg-[#1a1022] shadow-[0_24px_70px_-24px_rgb(var(--al-accent)/0.55)] ring-1 ring-line/10 active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      whileTap={{ scale: 0.99 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > THROW_THRESHOLD) release(SwipeDirection.Like);
        else if (info.offset.x < -THROW_THRESHOLD) release(SwipeDirection.Pass);
        else animate(x, 0, { type: 'spring', stiffness: 350, damping: 30 });
      }}
    >
      {portrait ? (
        <img
          src={portrait}
          alt=""
          className="h-full w-full select-none object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-accent-dark/40 to-black">
          <span className="font-display text-6xl text-on-accent/20">
            {card.DisplayName.charAt(0)}
          </span>
        </div>
      )}

      {/* View-profile pill (mirrors DeckScreen.cs ##viewProfile). stopPropagation on pointer-down keeps
                the drag gesture from hijacking the tap. */}
      <button
        type="button"
        onPointerDownCapture={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (!gone) onViewProfile();
        }}
        className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-on-accent backdrop-blur-sm transition-colors hover:bg-black/65"
      >
        <span aria-hidden>ⓘ</span>
        {t('deck.view_profile')}
      </button>

      {/* Directional aether glow */}
      <motion.div
        style={{ opacity: likeGlow }}
        className="pointer-events-none absolute inset-0 bg-gradient-to-l from-success/45 to-transparent"
      />
      <motion.div
        style={{ opacity: nopeGlow }}
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-danger/45 to-transparent"
      />

      {/* LIKE / NOPE stamps */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-6 top-7 rotate-[-16deg] rounded-xl border-[3px] border-success px-4 py-1.5 text-3xl font-extrabold uppercase tracking-wide text-success shadow-[0_0_24px_rgb(var(--al-success)/0.4)]"
      >
        Like
      </motion.div>
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="pointer-events-none absolute right-6 top-7 rotate-[16deg] rounded-xl border-[3px] border-danger px-4 py-1.5 text-3xl font-extrabold uppercase tracking-wide text-danger shadow-[0_0_24px_rgb(var(--al-danger)/0.4)]"
      >
        Nope
      </motion.div>

      {/* Name plate (always present; the side panel carries the long-form detail on wide screens) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent p-6 pt-20">
        <h2 className="font-display text-3xl font-bold leading-tight text-on-accent">
          {card.DisplayName}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-on-accent/75">{subtitle}</p>}
        {card.Bio && (
          <p className="mt-2 line-clamp-2 text-sm text-on-accent/85 xl:hidden">
            {withEmoji(card.Bio)}
          </p>
        )}
        {lookingFor.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 xl:hidden">
            {lookingFor.map((l) => (
              <span
                key={l}
                className="rounded-full bg-on-accent/15 px-2.5 py-1 text-xs text-on-accent backdrop-blur-sm"
              >
                {l}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
