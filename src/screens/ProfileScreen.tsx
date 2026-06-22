// Web port of Screens/ProfileScreen.cs — the read-only peer profile. Photo carousel with an NSFW
// blur/reveal gate, flair pills, the same field sections as MyProfile's View tab, plus a Report flow.
// Entered with { peerId, peerName, returnTo }; Back returns to returnTo (default Deck).

import {type ReactNode, useEffect, useMemo, useState} from 'react';
import {hubClient} from '../services/signal/hubClient';
import {useStore} from '../state/hooks';
import {languageStore} from '../i18n';
import {settingsStore} from '../state/settings';
import {router, Screen} from '../app/router';
import {Language} from '../shared/enums';
import type {FlairDto, ProfileDetailDto, ProfilePhotoDto} from '../shared/dtos';
import {
    CONTENT_OPTIONS,
    EXPANSION_OPTIONS,
    GENDER_OPTIONS,
    JOB_OPTIONS,
    labelOf,
    LANGUAGE_OPTIONS,
    LOOKING_FOR_OPTIONS,
    maskLabels,
    RACE_OPTIONS,
    REGION_OPTIONS,
} from '../shared/enumLabels';
import {Avatar, Button, Chip, LoadingSpinner, Modal, pushToast, TextInput} from '../ui/components';
import {revokeUrl, webpUrl} from '../ui/image';
import {useT} from '../i18n/useT';

type T = ReturnType<typeof useT>;

/** Per-language flair label, falling back to English (mirrors FlairCatalog.Text). */
function flairText(f: FlairDto, lang: Language): string {
    switch (lang) {
        case Language.Spanish:
            return f.TextSpanish ?? f.TextEnglish;
        case Language.French:
            return f.TextFrench ?? f.TextEnglish;
        case Language.Russian:
            return f.TextRussian ?? f.TextEnglish;
        case Language.German:
            return f.TextGerman ?? f.TextEnglish;
        case Language.Portuguese:
            return f.TextPortuguese ?? f.TextEnglish;
        default:
            return f.TextEnglish;
    }
}

export function ProfileScreen() {
    const t = useT();
    const route = useStore(router.store);
    const peerId = route.params.peerId ?? '';
    const peerName = route.params.peerName;
    const returnTo = route.params.returnTo ?? Screen.Deck;
    // Chat needs its peer params re-supplied to re-render the conversation on the way back.
    const goBack = () =>
        router.navigate(returnTo, returnTo === Screen.Chat ? {peerId, peerName} : {});

    const [detail, setDetail] = useState<ProfileDetailDto | null>(null);
    const [flairs, setFlairs] = useState<FlairDto[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        void (async () => {
            try {
                const [d, catalog] = await Promise.all([
                    hubClient.getProfileDetail(peerId),
                    hubClient.getFlairCatalog().catch(() => [] as FlairDto[]),
                ]);
                if (cancelled) return;
                setDetail(d);
                setFlairs(catalog);
            } catch (e) {
                if (!cancelled) setError(t('profile.load_failed', String((e as Error)?.message ?? e)));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [peerId, t]);

    return (
        <div className="mx-auto flex h-full w-full max-w-md flex-col">
            <header className="flex items-center gap-3 px-4 py-3">
                <button
                    onClick={goBack}
                    className="px-1 text-2xl leading-none text-subtle transition-colors hover:text-strong"
                    aria-label={t('common.back')}
                >
                    ←
                </button>
                <h1 className="truncate font-display text-xl font-bold text-strong">
                    {peerName ?? detail?.DisplayName ?? ''}
                </h1>
            </header>

            {loading ? (
                <div className="flex flex-1 items-center justify-center text-accent">
                    <LoadingSpinner size={28}/>
                </div>
            ) : error || !detail ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                    <p className="text-[14px] text-danger">{error ?? t('profile.none_loaded')}</p>
                    <Button variant="ghost" onClick={goBack}>
                        {t('common.back')}
                    </Button>
                </div>
            ) : (
                <PeerBody t={t} detail={detail} flairs={flairs}/>
            )}
        </div>
    );
}

function PeerBody({t, detail, flairs}: { t: T; detail: ProfileDetailDto; flairs: FlairDto[] }) {
    const lang = useStore(languageStore);
    const photos = useMemo(() => [...detail.Photos].sort((a, b) => a.Order - b.Order), [detail.Photos]);
    const languages = maskLabels(LANGUAGE_OPTIONS, detail.LanguageMask);
    const lookingFor = maskLabels(LOOKING_FOR_OPTIONS, detail.LookingForMask);
    const interests = maskLabels(CONTENT_OPTIONS, detail.ContentInterestMask);
    const job = labelOf(JOB_OPTIONS, detail.FavoriteJob);
    const expansion = labelOf(EXPANSION_OPTIONS, detail.FavoriteExpansion);
    const myFlairs = flairs.filter((f) => detail.FlairIds.includes(f.Id));

    return (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10">
            <PhotoCarousel t={t} photos={photos}/>

            <div className="mt-4">
                <h2 className="font-display text-2xl font-bold text-strong">{detail.DisplayName}</h2>
                <p className="text-[13px] text-subtle">
                    {[labelOf(RACE_OPTIONS, detail.Race), labelOf(GENDER_OPTIONS, detail.Gender), labelOf(REGION_OPTIONS, detail.Region)]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
            </div>

            {myFlairs.length > 0 && (
                <Section title={t('profile.flairs')}>
                    <div className="flex flex-wrap gap-2">
                        {myFlairs.map((f) => (
                            <span
                                key={f.Id}
                                className="rounded-full px-3 py-1 text-[12px] font-semibold text-white"
                                style={{backgroundColor: f.BackgroundColor || 'rgb(var(--al-accent))'}}
                            >
                {flairText(f, lang)}
              </span>
                        ))}
                    </div>
                </Section>
            )}

            <Section title={t('profile.section_about')}>
                <p className="whitespace-pre-line text-[14px] leading-relaxed text-body">
                    {detail.Bio || <span className="text-muted">{t('profile.no_bio')}</span>}
                </p>
            </Section>

            {languages.length > 0 && <ChipSection title={t('profile.section_languages')} labels={languages}/>}
            {lookingFor.length > 0 && <ChipSection title={t('profile.section_looking_for')} labels={lookingFor}/>}
            {interests.length > 0 && <ChipSection title={t('profile.section_interests')} labels={interests} gradient/>}

            {(job || expansion || detail.FavoriteAnime || detail.FavoriteMovie || detail.FavoriteFFCharacter || detail.FavoriteLocationName) && (
                <Section title={t('profile.section_favourites')}>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                        <FavRow label={t('profile.fav_job')} value={job}/>
                        <FavRow label={t('profile.fav_expansion')} value={expansion}/>
                        <FavRow label={t('onboarding.optional_location')} value={detail.FavoriteLocationName}/>
                        <FavRow label={t('profile.fav_anime')} value={detail.FavoriteAnime}/>
                        <FavRow label={t('profile.fav_movie')} value={detail.FavoriteMovie}/>
                        <FavRow label={t('profile.fav_character')} value={detail.FavoriteFFCharacter}/>
                    </dl>
                </Section>
            )}

            <ReportControl t={t} profileId={detail.ProfileId} name={detail.DisplayName}/>
        </div>
    );
}

function PhotoCarousel({t, photos}: { t: T; photos: ProfilePhotoDto[] }) {
    const blurNsfw = useStore(settingsStore).alwaysBlurNsfw;
    const [idx, setIdx] = useState(0);
    const [revealed, setRevealed] = useState<Set<number>>(new Set());
    if (photos.length === 0) return <Avatar bytes={null} size={96}/>;

    const photo = photos[idx];
    const blurred = photo.IsNsfw && (blurNsfw || !revealed.has(photo.Order));
    const step = (d: number) => setIdx((i) => (i + d + photos.length) % photos.length);

    return (
        <div className="relative aspect-[350/560] w-full overflow-hidden rounded-2xl bg-surface/5 ring-1 ring-line/10">
            <CarouselImage bytes={photo.WebpBytes} blurred={blurred}/>
            {blurred && (
                <button
                    onClick={() => setRevealed((s) => new Set(s).add(photo.Order))}
                    className="absolute inset-0 flex items-center justify-center bg-scrim/40 text-[14px] font-semibold text-white"
                >
                    {t('profile.nsfw_reveal')}
                </button>
            )}
            {photos.length > 1 && (
                <>
                    <button onClick={() => step(-1)} aria-label="Previous"
                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-scrim/40 px-3 py-2 text-white">‹
                    </button>
                    <button onClick={() => step(1)} aria-label="Next"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-scrim/40 px-3 py-2 text-white">›
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {photos.map((p, i) => (
                            <span key={p.Order}
                                  className={i === idx ? 'h-1.5 w-4 rounded-full bg-white' : 'h-1.5 w-1.5 rounded-full bg-white/50'}/>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function CarouselImage({bytes, blurred}: { bytes: Uint8Array; blurred: boolean }) {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        const made = webpUrl(bytes);
        setUrl(made);
        return () => revokeUrl(made);
    }, [bytes]);
    return url ? (
        <img
            src={url}
            alt=""
            draggable={false}
            className="h-full w-full object-cover transition-[filter]"
            style={blurred ? {filter: 'blur(28px)', transform: 'scale(1.1)'} : undefined}
        />
    ) : null;
}

function ReportControl({t, profileId, name}: { t: T; profileId: string; name: string }) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [agree, setAgree] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function submit() {
        if (submitting || !agree || reason.trim().length === 0) return;
        setSubmitting(true);
        try {
            await hubClient.reportUser({
                ReportedProfileId: profileId,
                Reason: reason.trim(),
                IncludeConversation: false,
                ConversationSnapshot: null,
            });
            setOpen(false);
            pushToast(t('profile.report_thanks'), 'success', 6000);
        } catch (e) {
            pushToast(String((e as Error)?.message ?? e), 'error');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mt-8">
            <Button variant="ghost" className="w-full text-danger" onClick={() => setOpen(true)}>
                {t('profile.report_profile')}
            </Button>
            <Modal open={open} onClose={() => setOpen(false)} title={t('profile.report_profile')}>
                <p className="text-[13px] leading-relaxed text-muted">{t('profile.report_warning')}</p>
                <p className="mt-3 text-[14px] text-body">{t('profile.report_prompt', name)}</p>
                <div className="mt-3">
                    <TextInput label="" value={reason} onChange={setReason} multiline rows={4} maxLength={500}/>
                </div>
                <label className="mt-2 flex items-start gap-2 text-[13px] text-body">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)}
                           className="mt-0.5"/>
                    {t('profile.report_agree')}
                </label>
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="danger" disabled={!agree || reason.trim().length === 0} loading={submitting}
                            onClick={() => void submit()}>
                        {t('profile.report_profile')}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

function Section({title, children}: { title: string; children: ReactNode }) {
    return (
        <div className="mt-6">
            <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-accent-light">{title}</h3>
            {children}
        </div>
    );
}

function ChipSection({title, labels, gradient}: { title: string; labels: string[]; gradient?: boolean }) {
    return (
        <Section title={title}>
            <div className="flex flex-wrap gap-2">
                {labels.map((l) => (
                    <Chip key={l} label={l} selected gradient={gradient} onToggle={() => {
                    }}/>
                ))}
            </div>
        </Section>
    );
}

function FavRow({label, value}: { label: string; value: string }) {
    if (!value || value === '—') return null;
    return (
        <div className="flex justify-between gap-3 border-b border-line/5 py-1 text-[14px]">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right text-body">{value}</dd>
        </div>
    );
}
