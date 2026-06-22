// The swipe deck — the app's hero. A crystalline "aether well" holds the top card with the next cards
// peeking behind it; big pass/like controls and ←/→ keys drive it. Wide screens get a quiet detail panel
// beside the card (Hinge-style) so the portrait stays clean. Empty/cooldown states show a countdown to
// NextPullAtUtc. Match handling lives in useDeck (sets the pending match + routes to the Match overlay).

import {useEffect, useState} from 'react';
import {useDeck} from './useDeck';
import {DeckCard} from './DeckCard';
import {CooldownScene} from './CooldownScene';
import type {DeckCardDto} from '../../shared/dtos';
import {
    CONTENT_OPTIONS,
    labelOf,
    LOOKING_FOR_OPTIONS,
    maskLabels,
    RACE_OPTIONS,
    REGION_OPTIONS,
} from '../../shared/enumLabels';
import {LoadingSpinner} from '../../ui/components';
import {useT} from '../../i18n/useT';

function useCountdown(targetIso: string | null): string {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        if (!targetIso) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [targetIso]);
    if (!targetIso) return '';
    const ms = Math.max(0, Date.parse(targetIso) - now);
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, '0')}`;
}

/** Wide-screen detail column beside the card. Hidden under xl, where the card overlay carries this. */
function DeckDetails({card}: { card: DeckCardDto }) {
    const eyebrow = [labelOf(RACE_OPTIONS, card.Race), labelOf(REGION_OPTIONS, card.Region)].filter(Boolean).join(' · ');
    const lookingFor = maskLabels(LOOKING_FOR_OPTIONS, card.LookingForMask);
    const interests = maskLabels(CONTENT_OPTIONS, card.ContentInterestMask);

    return (
        <aside className="hidden w-[300px] shrink-0 flex-col gap-6 xl:flex">
            <div>
                {eyebrow &&
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent-light">{eyebrow}</p>}
                <h2 className="mt-1 font-display text-3xl font-bold text-strong">{card.DisplayName}</h2>
            </div>
            {card.Bio && <p className="text-[15px] leading-relaxed text-body">{card.Bio}</p>}
            {lookingFor.length > 0 && <ChipGroup title="Looking for" items={lookingFor} accent/>}
            {interests.length > 0 && <ChipGroup title="Into" items={interests}/>}
        </aside>
    );
}

function ChipGroup({title, items, accent = false}: { title: string; items: string[]; accent?: boolean }) {
    return (
        <div>
            <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{title}</h3>
            <div className="flex flex-wrap gap-2">
                {items.map((i) => (
                    <span
                        key={i}
                        className={
                            accent
                                ? 'rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-[13px] text-accent-light'
                                : 'rounded-full border border-line/10 bg-surface/5 px-3 py-1 text-[13px] text-subtle'
                        }
                    >
            {i}
          </span>
                ))}
            </div>
        </div>
    );
}

/** A non-interactive card sitting behind the top card, hinting at the queue. */
function GhostCard({depth}: { depth: number }) {
    return (
        <div
            aria-hidden
            className="absolute inset-0 rounded-[28px] bg-[#160d20] ring-1 ring-line/5"
            style={{
                transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.05})`,
                opacity: 1 - depth * 0.35,
                zIndex: -depth,
            }}
        />
    );
}

export function DeckScreen() {
    const t = useT();
    const deck = useDeck();
    const countdown = useCountdown(deck.hasCards ? null : deck.nextPullAtUtc);

    // Auto-refetch once the cooldown elapses.
    useEffect(() => {
        if (deck.hasCards || deck.loading || !deck.nextPullAtUtc) return;
        const remaining = Date.parse(deck.nextPullAtUtc) - Date.now();
        if (remaining <= 0) {
            void deck.reload();
            return;
        }
        const id = setTimeout(() => void deck.reload(), remaining + 250);
        return () => clearTimeout(id);
    }, [deck.hasCards, deck.loading, deck.nextPullAtUtc, deck.reload]);

    // Keyboard: ← pass, → like. Only while a card is present.
    useEffect(() => {
        if (!deck.hasCards) return;
        const onKey = (e: KeyboardEvent) => {
            const el = document.activeElement;
            if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
            if (e.key === 'ArrowLeft') void deck.pass();
            else if (e.key === 'ArrowRight') void deck.like();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [deck.hasCards, deck.pass, deck.like]);

    return (
        <div className="flex h-full flex-col">
            <header className="px-6 pb-2 pt-6 lg:px-10 lg:pt-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-light/80">Aetheryte ·
                    Live</p>
                <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-strong">{t('nav.deck')}</h1>
            </header>

            <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
                {deck.loading ? (
                    <LoadingSpinner size={30} className="text-accent"/>
                ) : deck.hasCards && deck.top ? (
                    <div className="flex w-full max-w-[760px] items-center justify-center gap-10">
                        <div className="flex flex-col items-center gap-7">
                            {/* Aether well: the card stack on a glowing pedestal */}
                            <div className="relative aspect-[3/4] w-[min(82vw,360px)]">
                                {deck.cards[2] && <GhostCard depth={2}/>}
                                {deck.cards[1] && <GhostCard depth={1}/>}
                                {/* key forces a fresh card instance per profile so gesture state resets */}
                                <DeckCard key={deck.top.ProfileId} card={deck.top} onSwipe={(d) => void deck.swipe(d)}/>
                            </div>

                            <div className="flex items-center gap-7">
                                <button
                                    onClick={() => void deck.pass()}
                                    className="flex h-16 w-16 items-center justify-center rounded-full border border-line/15 bg-void/40 text-2xl text-danger shadow-lg backdrop-blur transition-all hover:scale-105 hover:border-danger/70 hover:shadow-[0_0_24px_rgb(var(--al-danger)/0.4)] active:scale-95"
                                    aria-label={t('deck.pass')}
                                >
                                    ✕
                                </button>
                                <button
                                    onClick={() => void deck.like()}
                                    className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(var(--al-secondary-start))] to-[rgb(var(--al-secondary-end))] text-3xl text-strong shadow-[0_8px_30px_-6px_rgb(var(--al-accent)/0.8)] transition-all hover:scale-105 active:scale-95"
                                    aria-label={t('deck.like')}
                                >
                                    ♥
                                </button>
                            </div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">← pass · like
                                →</p>
                        </div>

                        <DeckDetails card={deck.top}/>
                    </div>
                ) : (
                    // Night-sky pegasus scene (CooldownScene): slot cooldown shows a live countdown pill; an empty
                    // candidate pool shows the no-pool body without a timer.
                    <div
                        className="aspect-[350/560] w-[min(88vw,380px)] overflow-hidden rounded-[28px] ring-1 ring-line/10">
                        <CooldownScene
                            heading={t('deck.empty_title')}
                            body={deck.noPool ? t('deck.no_pool') : t('deck.empty_body')}
                            timer={!deck.noPool ? countdown || null : null}
                            error={deck.error}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
