// Onboarding step bodies. One component per OnboardingStep (Welcome…Finished). The wizard
// (OnboardingScreen.tsx) owns navigation, gating and saves; these render the step's fields against the
// shared form api. Ports the DrawStepXxx methods, condensed for the web.

import {useEffect, useState} from 'react';
import {AuthFlowState} from '../../services/auth/xivAuth';
import {loadTerritories, type Territory} from '../../services/gameData';
import {authService} from '../../state/auth';
import {useAuthFlowState} from './useAuthFlowState';
import {Button, Chip, Select, TextInput} from '../../ui/components';
import {PhotoSlotTile} from '../photos/PhotoSlotTile';
import {
    CONTENT_OPTIONS,
    EXPANSION_OPTIONS,
    GENDER_OPTIONS,
    JOB_OPTIONS,
    LANGUAGE_OPTIONS,
    LOOKING_FOR_OPTIONS,
    RACE_OPTIONS,
    REGION_OPTIONS,
} from '../../shared/enumLabels';
import {hasFlag} from '../../shared/enums';
import type {OnboardingFormApi} from './useOnboardingForm';
import {MIN_PASSPHRASE} from './useOnboardingForm';
import {useT} from '../../i18n/useT';

type T = ReturnType<typeof useT>;

interface StepProps {
    api: OnboardingFormApi;
    t: T;
}

const Heading = ({children}: { children: string }) => (
    <h2 className="mb-1 font-display text-xl font-bold text-strong">{children}</h2>
);
const Body = ({children}: { children: string }) => (
    <p className="whitespace-pre-line text-[14px] leading-relaxed text-subtle">{children}</p>
);
const SectionLabel = ({children}: { children: string }) => (
    <h3 className="mb-2 mt-4 text-[13px] font-semibold uppercase tracking-wide text-accent-light">
        {children}
    </h3>
);

function ChipGrid<V extends number>({
                                        options,
                                        mask,
                                        onToggle,
                                        gradient,
                                    }: {
    options: { value: V; label: string }[];
    mask: number;
    onToggle: (flag: V) => void;
    gradient?: boolean;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((o) => (
                <Chip
                    key={o.value}
                    label={o.label}
                    gradient={gradient}
                    selected={hasFlag(mask, o.value)}
                    onToggle={() => onToggle(o.value)}
                />
            ))}
        </div>
    );
}

export function StepWelcome({t}: StepProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <span
          className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[rgb(var(--al-secondary-start))]/30 to-[rgb(var(--al-secondary-end))]/30 text-accent ring-1 ring-accent/30">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path
              d="M12 21s-7.5-4.6-10-9.2C.5 8.6 2 5.5 5 5.5c1.9 0 3.2 1.1 4 2.3.8-1.2 2.1-2.3 4-2.3 3 0 4.5 3.1 3 6.3C19.5 16.4 12 21 12 21z"/>
        </svg>
      </span>
            <Heading>{t('onboarding.welcome_title')}</Heading>
            <Body>{t('onboarding.welcome_body')}</Body>
        </div>
    );
}

export function StepHowItWorks({t}: StepProps) {
    return (
        <div className="space-y-3">
            <Heading>{t('onboarding.header_how_it_works')}</Heading>
            <Body>{t('onboarding.how_it_works_body')}</Body>
        </div>
    );
}

export function StepTOS({
                            t,
                            tosAccepted,
                            onAccept,
                            secondsLeft,
                        }: StepProps & {
    tosAccepted: boolean;
    onAccept: (v: boolean) => void;
    secondsLeft: number;
}) {
    return (
        <div className="space-y-4">
            <Heading>{t('onboarding.header_terms_of_service')}</Heading>
            <Body>{t('onboarding.tos_body')}</Body>
            {secondsLeft > 0 ? (
                <p className="text-[13px] text-muted">{t('onboarding.tos_wait', secondsLeft)}</p>
            ) : (
                <label className="flex items-center gap-2 text-[14px] text-body">
                    <input
                        type="checkbox"
                        checked={tosAccepted}
                        onChange={(e) => onAccept(e.target.checked)}
                    />
                    {t('onboarding.tos_accept')}
                </label>
            )}
        </div>
    );
}

export function StepXIVAuth({t}: StepProps) {
    const snap = useAuthFlowState();
    const done = snap.state === AuthFlowState.Completed;
    return (
        <div className="space-y-4">
            <Heading>{t('onboarding.header_sign_in')}</Heading>
            <Body>{t('onboarding.auth_intro')}</Body>
            {done ? (
                <p className="font-semibold text-success">✓ {t('onboarding.auth_done')}</p>
            ) : snap.state === AuthFlowState.AwaitingBrowser ? (
                <div className="space-y-2">
                    <p className="text-[13px] text-muted">{t('onboarding.auth_awaiting')}</p>
                    <Button variant="ghost" onClick={() => authService.reopenBrowser()}>
                        {t('onboarding.auth_reopen')}
                    </Button>
                </div>
            ) : (
                <Button
                    onClick={() => authService.startSignIn()}
                    loading={snap.state === AuthFlowState.Starting}
                >
                    {t('onboarding.auth_open')}
                </Button>
            )}
            {snap.errorMessage && <p className="text-[13px] text-danger">{snap.errorMessage}</p>}
        </div>
    );
}

export function StepPassphrase({api, t}: StepProps) {
    const {form, set} = api;
    const mismatch = form.passphraseConfirm.length > 0 && form.passphrase !== form.passphraseConfirm;
    const tooShort = form.passphrase.length > 0 && form.passphrase.length < MIN_PASSPHRASE;
    return (
        <div className="space-y-4">
            <Heading>{t('onboarding.header_secure_messages')}</Heading>
            <Body>{t('onboarding.passphrase_intro')}</Body>
            <TextInput
                type="password"
                label={t('onboarding.passphrase_label')}
                value={form.passphrase}
                onChange={(v) => set('passphrase', v)}
                error={tooShort ? t('onboarding.passphrase_too_short') : null}
            />
            <TextInput
                type="password"
                label={t('onboarding.passphrase_confirm')}
                value={form.passphraseConfirm}
                onChange={(v) => set('passphraseConfirm', v)}
                error={mismatch ? t('onboarding.passphrase_mismatch') : null}
            />
        </div>
    );
}

export function StepProfile({api, t}: StepProps) {
    const {form, set, toggleMask} = api;
    return (
        <div className="space-y-3">
            <Heading>{t('onboarding.header_your_profile')}</Heading>
            <TextInput
                label={t('onboarding.profile_display_name')}
                value={form.displayName}
                onChange={(v) => set('displayName', v.replace(/\s/g, ''))}
                maxLength={32}
            />
            <TextInput
                label={t('onboarding.profile_bio')}
                value={form.bio}
                onChange={(v) => set('bio', v)}
                multiline
                rows={3}
                maxLength={300}
            />
            <div className="grid grid-cols-2 gap-3">
                <Select
                    label={t('onboarding.profile_race')}
                    value={form.race}
                    options={RACE_OPTIONS}
                    onChange={(v) => set('race', v)}
                />
                <Select
                    label={t('onboarding.profile_gender')}
                    value={form.gender}
                    options={GENDER_OPTIONS}
                    onChange={(v) => set('gender', v)}
                />
            </div>
            <Select
                label={t('onboarding.profile_region')}
                value={form.region}
                options={REGION_OPTIONS}
                onChange={(v) => set('region', v)}
            />
            <SectionLabel>{t('onboarding.profile_languages')}</SectionLabel>
            <ChipGrid
                options={LANGUAGE_OPTIONS}
                mask={form.languageMask}
                onToggle={(f) => toggleMask('languageMask', f)}
            />
            <SectionLabel>{t('onboarding.profile_looking_for')}</SectionLabel>
            <ChipGrid
                options={LOOKING_FOR_OPTIONS}
                mask={form.lookingForMask}
                onToggle={(f) => toggleMask('lookingForMask', f)}
            />
        </div>
    );
}

export function StepImageDisclaimer({api, t}: StepProps) {
    const {form, set} = api;
    return (
        <div className="space-y-4">
            <Heading>{t('onboarding.header_image_disclaimer')}</Heading>
            <Body>{t('onboarding.disclaimer_intro')}</Body>
            <div className="space-y-2 text-[13px] text-subtle">
                <p>{t('onboarding.disclaimer_general_body')}</p>
                <p>{t('onboarding.disclaimer_sfw_body')}</p>
                <p className="text-muted">{t('onboarding.disclaimer_moderation_body')}</p>
            </div>
            <label className="flex items-start gap-2.5 text-[14px] text-body">
                <input
                    type="checkbox"
                    className="mt-0.5 shrink-0"
                    checked={form.disclaimerAck}
                    onChange={(e) => set('disclaimerAck', e.target.checked)}
                />
                {t('onboarding.disclaimer_ack')}
            </label>
        </div>
    );
}

export function StepAvatar({api, t}: StepProps) {
    const {form, set} = api;
    return (
        <div className="space-y-4">
            <Heading>{t('onboarding.header_profile_picture')}</Heading>
            <Body>{t('onboarding.avatar_intro')}</Body>
            <div className="flex justify-center pt-2">
                <PhotoSlotTile
                    kind="avatar"
                    order={0}
                    value={form.avatar}
                    race={form.race}
                    onChange={(p) => set('avatar', p)}
                    className="h-36 w-36"
                />
            </div>
        </div>
    );
}

export function StepPhotos({api, t}: StepProps) {
    const {form, set} = api;
    return (
        <div className="space-y-4">
            <Heading>{t('onboarding.header_your_photos')}</Heading>
            <Body>{t('onboarding.photos_intro')}</Body>
            <div className="grid grid-cols-2 gap-4">
                <PhotoSlotTile
                    kind="portrait"
                    order={1}
                    value={form.main}
                    race={form.race}
                    onChange={(p) => set('main', p)}
                    className="aspect-[350/560]"
                />
                <PhotoSlotTile
                    kind="portrait"
                    order={2}
                    value={form.extra1}
                    declaration={form.decl1}
                    onDeclaration={(d) => set('decl1', d)}
                    race={form.race}
                    onChange={(p) => set('extra1', p)}
                    className="aspect-[350/560]"
                />
                <PhotoSlotTile
                    kind="portrait"
                    order={3}
                    value={form.extra2}
                    declaration={form.decl2}
                    onDeclaration={(d) => set('decl2', d)}
                    race={form.race}
                    onChange={(p) => set('extra2', p)}
                    className="aspect-[350/560]"
                />
                <PhotoSlotTile
                    kind="portrait"
                    order={4}
                    value={form.extra3}
                    declaration={form.decl3}
                    onDeclaration={(d) => set('decl3', d)}
                    race={form.race}
                    onChange={(p) => set('extra3', p)}
                    className="aspect-[350/560]"
                />
            </div>
        </div>
    );
}

export function StepOptional({api, t}: StepProps) {
    const {form, set, toggleMask} = api;
    const [territories, setTerritories] = useState<Territory[]>([]);
    useEffect(() => {
        loadTerritories().then(setTerritories);
    }, []);
    return (
        <div className="space-y-3">
            <Heading>{t('onboarding.header_optional_details')}</Heading>
            <Body>{t('onboarding.optional_intro')}</Body>
            <div className="grid grid-cols-2 gap-3">
                <Select
                    label={t('onboarding.optional_job')}
                    value={form.favoriteJob}
                    options={JOB_OPTIONS}
                    onChange={(v) => set('favoriteJob', v)}
                />
                <Select
                    label={t('onboarding.optional_expansion')}
                    value={form.favoriteExpansion}
                    options={EXPANSION_OPTIONS}
                    onChange={(v) => set('favoriteExpansion', v)}
                />
            </div>
            <label className="block">
        <span className="mb-1 block text-[13px] font-medium text-subtle">
          {t('onboarding.optional_location')}
        </span>
                <select
                    value={form.favoriteLocationName}
                    onChange={(e) => set('favoriteLocationName', e.target.value)}
                    disabled={territories.length === 0}
                    className="w-full appearance-none rounded-xl border border-line/10 bg-void/30 px-3 py-2 text-[15px] text-body outline-none focus:border-accent disabled:opacity-50"
                >
                    <option value="" className="bg-[#160d1f]">
                        {t('onboarding.optional_location_none')}
                    </option>
                    {territories.map((loc) => (
                        <option key={loc.id} value={loc.name} className="bg-[#160d1f]">
                            {loc.name}
                        </option>
                    ))}
                </select>
            </label>
            <TextInput
                label={t('onboarding.optional_anime')}
                value={form.favoriteAnime}
                onChange={(v) => set('favoriteAnime', v)}
                maxLength={60}
            />
            <TextInput
                label={t('onboarding.optional_movie')}
                value={form.favoriteMovie}
                onChange={(v) => set('favoriteMovie', v)}
                maxLength={60}
            />
            <TextInput
                label={t('onboarding.optional_character')}
                value={form.favoriteCharacter}
                onChange={(v) => set('favoriteCharacter', v)}
                maxLength={60}
            />
            <SectionLabel>{t('onboarding.profile_looking_for')}</SectionLabel>
            <ChipGrid
                options={CONTENT_OPTIONS}
                mask={form.contentMask}
                onToggle={(f) => toggleMask('contentMask', f)}
                gradient
            />
        </div>
    );
}

export function StepFilters({api, t}: StepProps) {
    const {form, toggleMask} = api;
    return (
        <div className="space-y-3">
            <Heading>{t('onboarding.header_match_preferences')}</Heading>
            <Body>{t('onboarding.filters_intro')}</Body>
            <SectionLabel>{t('onboarding.profile_gender')}</SectionLabel>
            <ChipGrid
                options={GENDER_OPTIONS}
                mask={form.wantedGender}
                onToggle={(f) => toggleMask('wantedGender', f)}
            />
            <SectionLabel>{t('onboarding.profile_region')}</SectionLabel>
            <ChipGrid
                options={REGION_OPTIONS}
                mask={form.wantedRegion}
                onToggle={(f) => toggleMask('wantedRegion', f)}
            />
            <SectionLabel>{t('onboarding.profile_languages')}</SectionLabel>
            <ChipGrid
                options={LANGUAGE_OPTIONS}
                mask={form.wantedLanguage}
                onToggle={(f) => toggleMask('wantedLanguage', f)}
            />
            <SectionLabel>{t('onboarding.profile_race')}</SectionLabel>
            <ChipGrid
                options={RACE_OPTIONS}
                mask={form.wantedRace}
                onToggle={(f) => toggleMask('wantedRace', f)}
            />
        </div>
    );
}

export function StepFinished({t}: StepProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center space-y-3 text-center">
            <div className="text-6xl">🎉</div>
            <Heading>{t('onboarding.finished_title')}</Heading>
            <Body>{t('onboarding.finished_body')}</Body>
        </div>
    );
}
