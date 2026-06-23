// Web port of Screens/MyProfileScreen.cs. Three tabs: View (read-only detail), Edit (text/filter
// fields via onboarding form hook), Images (photo management mirroring MyProfileScreen.Images.cs).

import {type ReactNode, useEffect, useMemo, useState} from 'react';
import {hubClient} from '../services/signal/hubClient';
import {useT} from '../i18n/useT';
import type {OnboardingStateDto, PhotoBatchDto, PhotoUploadDto, ProfileDetailDto} from '../shared/dtos';
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
import {hasFlag, LookingFor} from '../shared/enums';
import {Avatar, Button, Chip, LoadingSpinner, pushToast} from '../ui/components';
import {useOnboardingForm} from './onboarding/useOnboardingForm';
import {StepFilters, StepOptional, StepProfile} from './onboarding/steps';
import {revokeUrl, webpUrl} from '../ui/image';
import {cn} from '../ui/cn';
import {PhotoSlotTile} from './photos/PhotoSlotTile';
import {PhotoNsfwDecl, UndeclaredNsfwModal} from './photos/photoModeration';

type Tab = 'view' | 'edit' | 'images';
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
                    {(['view', 'edit', 'images'] as Tab[]).map((id) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setTab(id)}
                            className={cn(
                                'flex-1 rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors',
                                tab === id ? 'bg-accent/20 text-strong' : 'text-subtle hover:text-strong',
                            )}
                        >
                            {id === 'view' ? t('profile.tab_view') : id === 'edit' ? t('profile.tab_edit') : t('profile.tab_images')}
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
            ) : tab === 'edit' ? (
                state && <ProfileEdit t={t} state={state}/>
            ) : (
                detail && <ProfileImagesTab t={t} detail={detail} onReload={load}/>
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

// ---- Images tab --------------------------------------------------------------------------

function ProfileImagesTab({t, detail, onReload}: { t: T; detail: ProfileDetailDto; onReload: () => void }) {
    const [avatar, setAvatar] = useState<PhotoUploadDto | null>(null);
    const [main, setMain] = useState<PhotoUploadDto | null>(null);
    const [extra1, setExtra1] = useState<PhotoUploadDto | null>(null);
    const [extra2, setExtra2] = useState<PhotoUploadDto | null>(null);
    const [extra3, setExtra3] = useState<PhotoUploadDto | null>(null);
    const [decl1, setDecl1] = useState(PhotoNsfwDecl.Unselected);
    const [decl2, setDecl2] = useState(PhotoNsfwDecl.Unselected);
    const [decl3, setDecl3] = useState(PhotoNsfwDecl.Unselected);
    const [remove2, setRemove2] = useState(false);
    const [remove3, setRemove3] = useState(false);
    const [remove4, setRemove4] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showUndeclared, setShowUndeclared] = useState(false);

    const serverAvatar = detail.Photos.find((p) => p.Order === 0) ?? null;
    const serverMain = detail.Photos.find((p) => p.Order === 1) ?? null;
    const serverExtra1 = detail.Photos.find((p) => p.Order === 2) ?? null;
    const serverExtra2 = detail.Photos.find((p) => p.Order === 3) ?? null;
    const serverExtra3 = detail.Photos.find((p) => p.Order === 4) ?? null;

    const allDeclared = useMemo(() => {
        const ok = (p: PhotoUploadDto | null, d: PhotoNsfwDecl) => p === null || d !== PhotoNsfwDecl.Unselected;
        return ok(extra1, decl1) && ok(extra2, decl2) && ok(extra3, decl3);
    }, [extra1, decl1, extra2, decl2, extra3, decl3]);

    const hasChanges = !!(avatar ?? main ?? extra1 ?? extra2 ?? extra3) || remove2 || remove3 || remove4;

    async function save() {
        if (saving || !hasChanges) return;
        if (!allDeclared) {
            setShowUndeclared(true);
            return;
        }
        setSaving(true);
        setSaved(false);
        try {
            const batch: PhotoBatchDto = {
                Avatar: avatar,
                Main: main,
                Extra1: extra1 ? {...extra1, IsNsfw: decl1 === PhotoNsfwDecl.Nsfw} : null,
                Extra2: extra2 ? {...extra2, IsNsfw: decl2 === PhotoNsfwDecl.Nsfw} : null,
                Extra3: extra3 ? {...extra3, IsNsfw: decl3 === PhotoNsfwDecl.Nsfw} : null,
            };
            if (batch.Avatar ?? batch.Main ?? batch.Extra1 ?? batch.Extra2 ?? batch.Extra3) {
                await hubClient.savePhotos(batch);
            }
            if (remove2) await hubClient.deletePhoto(2);
            if (remove3) await hubClient.deletePhoto(3);
            if (remove4) await hubClient.deletePhoto(4);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
            onReload();
        } catch (e) {
            pushToast(t('profile.images_save_failed', (e as Error).message), 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 lg:px-8">
                <ImgSection title={t('profile.images_avatar_section')}>
                    <p className="mb-3 text-[13px] text-subtle">{t('profile.images_avatar_desc')}</p>
                    <div className="flex justify-center">
                        <PhotoSlotTile
                            kind="avatar"
                            order={0}
                            value={avatar}
                            serverBytes={serverAvatar?.WebpBytes}
                            race={detail.Race}
                            onChange={setAvatar}
                            className="h-32 w-32"
                        />
                    </div>
                </ImgSection>

                <ImgSection title={t('profile.images_photos_section')}>
                    <p className="mb-3 text-[13px] text-subtle">{t('profile.images_photos_desc')}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <PhotoSlotTile
                            kind="portrait"
                            order={1}
                            value={main}
                            serverBytes={serverMain?.WebpBytes}
                            race={detail.Race}
                            onChange={setMain}
                            className="aspect-[350/560]"
                        />
                        <PhotoSlotTile
                            kind="portrait"
                            order={2}
                            value={extra1}
                            serverBytes={remove2 ? null : serverExtra1?.WebpBytes}
                            serverIsNsfw={serverExtra1?.IsNsfw}
                            declaration={decl1}
                            onDeclaration={setDecl1}
                            race={detail.Race}
                            onChange={setExtra1}
                            onRemove={serverExtra1 && !remove2 ? () => {
                                setExtra1(null);
                                setRemove2(true);
                            } : undefined}
                            pendingRemove={remove2}
                            onUndoRemove={remove2 ? () => setRemove2(false) : undefined}
                            className="aspect-[350/560]"
                        />
                        <PhotoSlotTile
                            kind="portrait"
                            order={3}
                            value={extra2}
                            serverBytes={remove3 ? null : serverExtra2?.WebpBytes}
                            serverIsNsfw={serverExtra2?.IsNsfw}
                            declaration={decl2}
                            onDeclaration={setDecl2}
                            race={detail.Race}
                            onChange={setExtra2}
                            onRemove={serverExtra2 && !remove3 ? () => {
                                setExtra2(null);
                                setRemove3(true);
                            } : undefined}
                            pendingRemove={remove3}
                            onUndoRemove={remove3 ? () => setRemove3(false) : undefined}
                            className="aspect-[350/560]"
                        />
                        <PhotoSlotTile
                            kind="portrait"
                            order={4}
                            value={extra3}
                            serverBytes={remove4 ? null : serverExtra3?.WebpBytes}
                            serverIsNsfw={serverExtra3?.IsNsfw}
                            declaration={decl3}
                            onDeclaration={setDecl3}
                            race={detail.Race}
                            onChange={setExtra3}
                            onRemove={serverExtra3 && !remove4 ? () => {
                                setExtra3(null);
                                setRemove4(true);
                            } : undefined}
                            pendingRemove={remove4}
                            onUndoRemove={remove4 ? () => setRemove4(false) : undefined}
                            className="aspect-[350/560]"
                        />
                    </div>
                </ImgSection>

                <ImgSection title={t('profile.images_nsfw_section')}>
                    <NsfwMasterToggle t={t} detail={detail}/>
                </ImgSection>
            </div>

            {!allDeclared && (
                <p className="px-6 pb-2 text-[13px] text-amber">{t('profile.images_declare_first')}</p>
            )}

            <div className="border-t border-line/10 px-6 py-4 lg:px-8">
                <Button
                    className="w-full"
                    onClick={save}
                    loading={saving}
                    disabled={!hasChanges || saving}
                >
                    {saving ? t('profile.saving') : saved ? t('profile.saved') : t('profile.save_changes')}
                </Button>
            </div>

            <UndeclaredNsfwModal open={showUndeclared} onClose={() => setShowUndeclared(false)}/>
        </div>
    );
}

function ImgSection({title, children}: { title: string; children: ReactNode }) {
    return (
        <div className="mt-6">
            <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-accent-light">{title}</h3>
            {children}
        </div>
    );
}

function NsfwMasterToggle({t, detail}: { t: T; detail: ProfileDetailDto }) {
    const [on, setOn] = useState(detail.IsNsfw);
    const [busy, setBusy] = useState(false);
    const locked = hasFlag(detail.LookingForMask, LookingFor.Erp) || detail.Photos.some((p) => p.IsNsfw);

    async function toggle(next: boolean) {
        if (!next && locked) return;
        setBusy(true);
        const prev = on;
        setOn(next);
        try {
            await hubClient.setProfileNsfw(next);
        } catch {
            setOn(prev);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div>
            <button
                type="button"
                role="switch"
                aria-checked={on}
                disabled={busy}
                onClick={() => void toggle(!on)}
                className="flex w-full items-center gap-3 py-1 text-left disabled:opacity-50"
            >
                <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-strong">{t('profile.images_nsfw_toggle')}</span>
                    <span className="block text-[12px] leading-snug text-muted">{t('profile.images_nsfw_hint')}</span>
                </span>
                <span
                    className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-accent' : 'bg-surface/15')}>
                    <span
                        className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-strong shadow transition-transform', on ? 'left-0.5 translate-x-5' : 'left-0.5')}/>
                </span>
            </button>
            {locked && on && (
                <p className="mt-1 text-[12px] text-amber">{t('profile.images_nsfw_locked')}</p>
            )}
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
