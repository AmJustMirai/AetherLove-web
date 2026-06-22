// Onboarding form state + DTO builders + per-step gating. Ports OnboardingScreen's field set and the
// BuildBasicProfile/BuildFilters/BuildPhotoBatch + canProceed logic, condensed: single-flag selects for
// race/gender/region and mask sets for the [Flags] groups. Hydrates from a resumed OnboardingStateDto.

import {useCallback, useMemo, useState} from 'react';
import {
    ContentInterest,
    Expansion,
    Gender,
    hasFlag,
    Job,
    Language,
    LookingFor,
    Race,
    Region,
    SyncTool,
    toggleFlag,
} from '../../shared/enums';
import type {BasicProfileDto, FiltersDto, OnboardingStateDto, PhotoBatchDto, PhotoUploadDto} from '../../shared/dtos';

export interface OnboardingForm {
    displayName: string;
    bio: string;
    region: Region;
    race: Race;
    gender: Gender;
    // [Flags] accumulators stay plain numbers (they can be 0 = nothing selected, which isn't an enum
    // member); they're cast back to their enum type when the DTO is built.
    languageMask: number;
    lookingForMask: number;
    contentMask: number;
    nsfwEnabled: boolean;
    timezone: string;
    favoriteJob: Job;
    favoriteExpansion: Expansion;
    favoriteAnime: string;
    favoriteMovie: string;
    favoriteCharacter: string;
    // Display-only, like the plugin: collected in onboarding but not part of BasicProfileDto, so it is
    // never sent. Kept for UI parity with Step7Optional's location combo.
    favoriteLocationName: string;
    syncToolMask: number;
    // Filters
    wantedRace: number;
    wantedGender: number;
    wantedRegion: number;
    wantedLanguage: number;
    // Passphrase
    passphrase: string;
    passphraseConfirm: string;
    // Photos (processed PhotoUploadDtos, ready to send)
    avatar: PhotoUploadDto | null;
    main: PhotoUploadDto | null;
    extra1: PhotoUploadDto | null;
    extra2: PhotoUploadDto | null;
    extra3: PhotoUploadDto | null;
}

function initial(): OnboardingForm {
    return {
        displayName: '',
        bio: '',
        region: Region.PreferNotToSay,
        race: Race.Hyur,
        gender: Gender.Male,
        languageMask: Language.English,
        lookingForMask: 0,
        contentMask: 0,
        nsfwEnabled: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        favoriteJob: Job.None,
        favoriteExpansion: Expansion.None,
        favoriteAnime: '',
        favoriteMovie: '',
        favoriteCharacter: '',
        favoriteLocationName: '',
        syncToolMask: 0,
        wantedRace: 0,
        wantedGender: 0,
        wantedRegion: 0,
        wantedLanguage: 0,
        passphrase: '',
        passphraseConfirm: '',
        avatar: null,
        main: null,
        extra1: null,
        extra2: null,
        extra3: null,
    };
}

export const MIN_PASSPHRASE = 8;

export function useOnboardingForm(resume?: OnboardingStateDto | null) {
    const [form, setForm] = useState<OnboardingForm>(() => {
        const base = initial();
        if (!resume) return base;
        // Hydrate the fields the resume snapshot carries (mirrors HydrateFromOnboardingState).
        const b = resume.Basic;
        return {
            ...base,
            displayName: b.DisplayName || base.displayName,
            bio: b.Bio,
            region: b.Region || base.region,
            race: b.Race || base.race,
            gender: b.Gender || base.gender,
            languageMask: b.LanguageMask || base.languageMask,
            lookingForMask: b.LookingForMask,
            contentMask: b.ContentInterestMask,
            nsfwEnabled: b.NsfwEnabled,
            timezone: b.Timezone || base.timezone,
            favoriteJob: b.FavoriteJob,
            favoriteExpansion: b.FavoriteExpansion,
            favoriteAnime: b.FavoriteAnime,
            favoriteMovie: b.FavoriteMovie,
            favoriteCharacter: b.FavoriteFFCharacter,
            wantedRace: resume.Filters.WantedRaceMask,
            wantedGender: resume.Filters.WantedGenderMask,
            wantedRegion: resume.Filters.WantedRegionMask,
            wantedLanguage: resume.Filters.WantedLanguageMask,
        };
    });

    const set = useCallback(<K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => {
        setForm((f) => ({...f, [key]: value}));
    }, []);

    const toggleMask = useCallback((key: keyof OnboardingForm, flag: number) => {
        setForm((f) => {
            const next = toggleFlag(f[key] as number, flag);
            const patch: Partial<OnboardingForm> = {[key]: next} as Partial<OnboardingForm>;
            // Selecting ERP forces NSFW on (mirrors the C# coupling).
            if (key === 'lookingForMask' && flag === LookingFor.Erp && hasFlag(next, LookingFor.Erp)) {
                patch.nsfwEnabled = true;
            }
            return {...f, ...patch};
        });
    }, []);

    const buildBasicProfile = useCallback((): BasicProfileDto => ({
        DisplayName: form.displayName,
        Bio: form.bio,
        Race: form.race,
        Gender: form.gender,
        Region: form.region,
        LanguageMask: form.languageMask as Language,
        ContentInterestMask: form.contentMask as ContentInterest,
        LookingForMask: form.lookingForMask as LookingFor,
        NsfwEnabled: form.nsfwEnabled,
        Timezone: form.timezone,
        FavoriteJob: form.favoriteJob,
        FavoriteExpansion: form.favoriteExpansion,
        SpotifyTrackId: '', SpotifyTrackName: '',
        SoundCloudUrl: '', SoundCloudName: '',
        AppleMusicUrl: '', AppleMusicName: '',
        YouTubeMusicUrl: '', YouTubeMusicName: '',
        FavoriteMovie: form.favoriteMovie,
        FavoriteAnime: form.favoriteAnime,
        FavoriteFFCharacter: form.favoriteCharacter,
        WeekdayHoursMask: 0,
        WeekendHoursMask: 0,
        SyncTool: form.syncToolMask as SyncTool,
    }), [form]);

    const buildFilters = useCallback((): FiltersDto => ({
        WantedRaceMask: form.wantedRace as Race,
        WantedGenderMask: form.wantedGender as Gender,
        WantedRegionMask: form.wantedRegion as Region,
        WantedLanguageMask: form.wantedLanguage as Language,
    }), [form]);

    const buildPhotoBatch = useCallback((): PhotoBatchDto => ({
        Avatar: form.avatar,
        Main: form.main,
        Extra1: form.extra1,
        Extra2: form.extra2,
        Extra3: form.extra3,
    }), [form]);

    const passphraseValid = useMemo(
        () => form.passphrase.length >= MIN_PASSPHRASE && form.passphrase === form.passphraseConfirm,
        [form.passphrase, form.passphraseConfirm],
    );

    return {form, set, toggleMask, buildBasicProfile, buildFilters, buildPhotoBatch, passphraseValid};
}

export type OnboardingFormApi = ReturnType<typeof useOnboardingForm>;
