// Web port of Screens/MyProfileScreen.cs, condensed to View + Edit tabs (the plugin's separate Images tab is
// deferred — see note). View renders the read-only profile detail; Edit reuses the onboarding form hook +
// step bodies and pushes basic profile + filters back to the server.
//
// NOTE: photo editing is intentionally out of scope here. useOnboardingForm starts its photo slots empty and
// SavePhotos with nulls would clear server slots, so Edit saves text/enum/filter fields only; photos are
// shown read-only in the View tab. Image editing lands in a later batch.

import {type ReactNode, useEffect, useState} from 'react';
import {hubClient} from '../services/signal/hubClient';
import {useT} from '../i18n/useT';
import type {OnboardingStateDto, ProfileDetailDto} from '../shared/dtos';
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
import {Avatar, Button, Chip, LoadingSpinner, pushToast} from '../ui/components';
import {useOnboardingForm} from './onboarding/useOnboardingForm';
import {StepFilters, StepOptional, StepProfile} from './onboarding/steps';
import {revokeUrl, webpUrl} from '../ui/image';
import {cn} from '../ui/cn';

type Tab = 'view' | 'edit';
type T = ReturnType<typeof useT>;

export function MyProfileScreen() {
    const t = useT();
    const [tab, setTab] = useState<Tab>('view');
    const [detail, setDetail] = useState<ProfileDetailDto | null>(null);
    const [state, setState] = useState<OnboardingStateDto | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const [d, s] = await Promise.all([hubClient.getMyProfileDetail(), hubClient.getOnboardingState()]);
            setDetail(d);
            setState(s);
        } catch (e) {
            setError(t('profile.load_failed', (e as Error).message));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
            <header className="px-6 pb-3 pt-6 lg:px-8 lg:pt-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-light/80">AetherLove</p>
                <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-strong">{t('profile.title')}</h1>
                <div className="mt-4 flex gap-1 rounded-xl bg-surface/5 p-1">
                    {(['view', 'edit'] as Tab[]).map((id) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setTab(id)}
                            className={cn(
                                'flex-1 rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors',
                                tab === id ? 'bg-accent/20 text-strong' : 'text-subtle hover:text-strong',
                            )}
                        >
                            {t(id === 'view' ? 'profile.tab_view' : 'profile.tab_edit')}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="flex flex-1 items-center justify-center text-accent">
                    <LoadingSpinner size={28}/>
                </div>
            ) : error ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                    <p className="text-[14px] text-danger">{error}</p>
                    <Button variant="ghost" onClick={() => void load()}>
                        {t('profile.retry')}
                    </Button>
                </div>
            ) : tab === 'view' ? (
                detail && <ProfileView t={t} detail={detail}/>
            ) : (
                state && <ProfileEdit t={t} state={state}/>
            )}
        </div>
    );
}

// ---- View tab ----------------------------------------------------------------------------

function ProfileView({t, detail}: { t: T; detail: ProfileDetailDto }) {
    const avatarBytes = detail.Photos.find((p) => p.Order === 0)?.WebpBytes ?? null;
    const photos = detail.Photos.filter((p) => p.Order >= 1).sort((a, b) => a.Order - b.Order);
    const languages = maskLabels(LANGUAGE_OPTIONS, detail.LanguageMask);
    const lookingFor = maskLabels(LOOKING_FOR_OPTIONS, detail.LookingForMask);
    const interests = maskLabels(CONTENT_OPTIONS, detail.ContentInterestMask);
    const job = labelOf(JOB_OPTIONS, detail.FavoriteJob);
    const expansion = labelOf(EXPANSION_OPTIONS, detail.FavoriteExpansion);

    return (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 lg:px-8">
            <div className="flex items-center gap-4">
                <Avatar bytes={avatarBytes} size={72}/>
                <div className="min-w-0">
                    <h2 className="truncate font-display text-2xl font-bold text-strong">{detail.DisplayName}</h2>
                    <p className="text-[13px] text-subtle">
                        {[labelOf(RACE_OPTIONS, detail.Race), labelOf(GENDER_OPTIONS, detail.Gender), labelOf(REGION_OPTIONS, detail.Region)]
                            .filter(Boolean)
                            .join(' · ')}
                    </p>
                </div>
            </div>

            <Section title={t('profile.section_about')}>
                <p className="whitespace-pre-line text-[14px] leading-relaxed text-body">
                    {detail.Bio || <span className="text-muted">{t('profile.no_bio')}</span>}
                </p>
            </Section>

            {languages.length > 0 && <ChipSection title={t('profile.section_languages')} labels={languages}/>}
            {lookingFor.length > 0 && <ChipSection title={t('profile.section_looking_for')} labels={lookingFor}/>}
            {interests.length > 0 && <ChipSection title={t('profile.section_interests')} labels={interests} gradient/>}

            {(job || expansion || detail.FavoriteAnime || detail.FavoriteMovie || detail.FavoriteFFCharacter) && (
                <Section title={t('profile.section_favourites')}>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                        <FavRow label={t('profile.fav_job')} value={job}/>
                        <FavRow label={t('profile.fav_expansion')} value={expansion}/>
                        <FavRow label={t('profile.fav_anime')} value={detail.FavoriteAnime}/>
                        <FavRow label={t('profile.fav_movie')} value={detail.FavoriteMovie}/>
                        <FavRow label={t('profile.fav_character')} value={detail.FavoriteFFCharacter}/>
                    </dl>
                </Section>
            )}

            {photos.length > 0 && (
                <Section title={t('profile.section_photos')}>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {photos.map((p) => (
                            <PhotoThumb key={p.Order} bytes={p.WebpBytes}/>
                        ))}
                    </div>
                </Section>
            )}
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

function PhotoThumb({bytes}: { bytes: Uint8Array }) {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        const made = webpUrl(bytes);
        setUrl(made);
        return () => revokeUrl(made);
    }, [bytes]);
    return (
        <div className="aspect-[350/560] overflow-hidden rounded-xl bg-surface/5 ring-1 ring-line/10">
            {url && <img src={url} alt="" className="h-full w-full object-cover" draggable={false}/>}
        </div>
    );
}

// ---- Edit tab ----------------------------------------------------------------------------

function ProfileEdit({t, state}: { t: T; state: OnboardingStateDto }) {
    const api = useOnboardingForm(state);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    async function save() {
        if (saving) return;
        setSaving(true);
        setSaved(false);
        try {
            await hubClient.saveBasicProfile(api.buildBasicProfile());
            await hubClient.saveFilters(api.buildFilters());
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e) {
            pushToast(t('profile.save_failed', (e as Error).message), 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-6 lg:px-8">
                <StepProfile api={api} t={t}/>
                <StepOptional api={api} t={t}/>
                <StepFilters api={api} t={t}/>
            </div>
            <div className="border-t border-line/10 px-6 py-4 lg:px-8">
                <Button className="w-full" onClick={save} loading={saving} disabled={saving}>
                    {saving ? t('profile.saving') : saved ? t('profile.saved') : t('profile.save_changes')}
                </Button>
            </div>
        </div>
    );
}
