// Web port of Screens/Onboarding/OnboardingScreen.cs — the 12-step wizard. Owns step navigation,
// per-step gating (canProceed), and the save points (encryption bundle, photos, basic profile, filters)
// that mirror GoNext. Header carries the title + progress dots; footer carries Back/Next.

import { useEffect, useMemo, useState } from 'react';
import { AuthFlowState } from '../../services/auth/xivAuth';
import { tokenStore } from '../../services/auth/tokenStore';
import { hubClient } from '../../services/signal/hubClient';
import { createIdentityBundle } from '../../services/messaging/chatCrypto';
import { sessionStore, setIdentity } from '../../state/session';
import { router, Screen } from '../../app/router';
import { useStore } from '../../state/hooks';
import { useT } from '../../i18n/useT';
import { Button, ProgressDots, pushToast } from '../../ui/components';
import { cn } from '../../ui/cn';
import { ThemePicker } from '../../ui/ThemePicker';
import { useAuthFlowState } from './useAuthFlowState';
import { useOnboardingForm } from './useOnboardingForm';
import {
  StepAvatar,
  StepFilters,
  StepFinished,
  StepHowItWorks,
  StepImageDisclaimer,
  StepOptional,
  StepPassphrase,
  StepPhotos,
  StepProfile,
  StepTOS,
  StepWelcome,
  StepXIVAuth,
} from './steps';
import { UndeclaredNsfwModal } from '../photos/photoModeration';

const STEPS = [
  'welcome',
  'howItWorks',
  'tos',
  'xivAuth',
  'encryption',
  'profile',
  'imageDisclaimer',
  'avatar',
  'photos',
  'optional',
  'filters',
  'preferences',
  'finished',
] as const;
type StepId = (typeof STEPS)[number];
const TOTAL = STEPS.length;

const HEADER_KEY: Record<StepId, Parameters<ReturnType<typeof useT>>[0]> = {
  welcome: 'onboarding.header_welcome',
  howItWorks: 'onboarding.header_how_it_works',
  tos: 'onboarding.header_terms_of_service',
  xivAuth: 'onboarding.header_sign_in',
  encryption: 'onboarding.header_secure_messages',
  profile: 'onboarding.header_your_profile',
  imageDisclaimer: 'onboarding.header_image_disclaimer',
  avatar: 'onboarding.header_profile_picture',
  photos: 'onboarding.header_your_photos',
  optional: 'onboarding.header_optional_details',
  filters: 'onboarding.header_match_preferences',
  preferences: 'onboarding.header_make_it_yours',
  finished: 'onboarding.header_all_set',
};

const TOS_WAIT_SECONDS = 5;

export function OnboardingScreen() {
  const t = useT();
  const resume = useStore(sessionStore).onboardingState;
  const api = useOnboardingForm(resume);
  const auth = useAuthFlowState();

  // Resume after a page refresh: a signed-in mid-onboarding session (boot resolved 'onboarding') already
  // cleared XIVAuth + TOS and may hold a key bundle. Mirror the plugin's OnShow — skip straight to Encryption
  // (no bundle yet) or Profile, rather than restarting at Welcome and forcing a re-login. Snapshot once.
  const bootSnapshot = useState(() => sessionStore.get())[0];
  const resuming = bootSnapshot.result === 'onboarding';
  const hasKeyBundle = !!bootSnapshot.connection?.HasKeyBundle;

  const [index, setIndex] = useState(() =>
    resuming ? STEPS.indexOf(hasKeyBundle ? 'profile' : 'encryption') : 0
  );
  const step = STEPS[index];

  const [tosAccepted, setTosAccepted] = useState(resuming);
  const [tosSecondsLeft, setTosSecondsLeft] = useState(TOS_WAIT_SECONDS);
  const [saving, setSaving] = useState(false);
  const [bundleUploaded, setBundleUploaded] = useState(resuming && hasKeyBundle);
  const [showUndeclaredModal, setShowUndeclaredModal] = useState(false);

  // TOS read-timer: counts down when the step is shown (mirrors _tosTimerStart).
  useEffect(() => {
    if (step !== 'tos') return;
    setTosSecondsLeft(TOS_WAIT_SECONDS);
    const id = setInterval(() => setTosSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [step]);

  const canProceed = useMemo(() => {
    switch (step) {
      case 'tos':
        return tosAccepted;
      case 'xivAuth':
        // Already authenticated (tokens persisted across the refresh) counts as completed.
        return auth.state === AuthFlowState.Completed || !!tokenStore.current.refreshToken;
      case 'encryption':
        // A key bundle on the server plus a local identity means encryption is already set up.
        return (
          bundleUploaded ||
          api.passphraseValid ||
          (hasKeyBundle && sessionStore.get().identity !== null)
        );
      case 'profile':
        return (
          api.form.displayName.length > 0 &&
          api.form.languageMask !== 0 &&
          api.form.lookingForMask !== 0
        );
      case 'imageDisclaimer':
        return api.form.disclaimerAck;
      case 'avatar':
        return api.form.avatar !== null;
      case 'photos':
        // Next is enabled when main is set; undeclared extras are caught in goNext.
        return api.form.main !== null;
      default:
        return true;
    }
  }, [step, tosAccepted, auth.state, bundleUploaded, api.passphraseValid, api.form, hasKeyBundle]);

  function advance() {
    setIndex((i) => Math.min(TOTAL - 1, i + 1));
  }

  async function runSave(label: string, fn: () => Promise<void>) {
    setSaving(true);
    try {
      await fn();
      advance();
    } catch (e) {
      pushToast(t('onboarding.could_not_assemble', label, (e as Error).message), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    if (saving) return;
    switch (step) {
      case 'finished':
        router.navigate(Screen.Deck);
        return;
      case 'encryption':
        if (bundleUploaded) return advance();
        return runSave('encryption', async () => {
          const { identity, bundle } = await createIdentityBundle(api.form.passphrase);
          await hubClient.uploadKeyBundle(bundle);
          await setIdentity(identity);
          setBundleUploaded(true);
        });
      case 'photos':
        if (!api.allConfirmedExtrasDeclared) {
          setShowUndeclaredModal(true);
          return;
        }
        return runSave('photos', () => hubClient.savePhotos(api.buildPhotoBatch()));
      case 'optional':
        return runSave('profile', () => hubClient.saveBasicProfile(api.buildBasicProfile()));
      case 'filters':
        return runSave('filters', () => hubClient.saveFilters(api.buildFilters()));
      default:
        advance();
    }
  }

  const nextLabel =
    step === 'finished'
      ? t('onboarding.start_swiping')
      : step === 'preferences'
        ? t('onboarding.finish')
        : t('onboarding.next');

  return (
    <div className="flex h-full w-full">
      <OnboardingAside index={index} t={t} />

      {/* Form side */}
      <div className="relative flex min-w-0 flex-1 flex-col bg-void/20">
        <div className="mx-auto flex h-full w-full max-w-xl flex-col px-6 pt-8 sm:px-10 lg:px-14 lg:pt-14">
          <header className="shrink-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-light/80">
              {t('onboarding.step_counter', index + 1, TOTAL)}
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-strong lg:text-4xl">
              {t(HEADER_KEY[step])}
            </h1>
            {/* Mobile progress (the desktop stepper lives in the aside). */}
            <div className="mt-4 lg:hidden">
              <ProgressDots total={TOTAL} current={index} />
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto py-6">
            {step === 'welcome' && <StepWelcome api={api} t={t} />}
            {step === 'howItWorks' && <StepHowItWorks api={api} t={t} />}
            {step === 'tos' && (
              <StepTOS
                api={api}
                t={t}
                tosAccepted={tosAccepted}
                onAccept={setTosAccepted}
                secondsLeft={tosSecondsLeft}
              />
            )}
            {step === 'xivAuth' && <StepXIVAuth api={api} t={t} />}
            {step === 'encryption' && <StepPassphrase api={api} t={t} />}
            {step === 'profile' && <StepProfile api={api} t={t} />}
            {step === 'imageDisclaimer' && <StepImageDisclaimer api={api} t={t} />}
            {step === 'avatar' && <StepAvatar api={api} t={t} />}
            {step === 'photos' && <StepPhotos api={api} t={t} />}
            {step === 'optional' && <StepOptional api={api} t={t} />}
            {step === 'filters' && <StepFilters api={api} t={t} />}
            {step === 'preferences' && <StepPreferences t={t} />}
            {step === 'finished' && <StepFinished api={api} t={t} />}
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line/10 py-5">
            {index > 0 && !saving ? (
              <Button variant="ghost" onClick={() => setIndex((i) => Math.max(0, i - 1))}>
                {t('onboarding.back')}
              </Button>
            ) : (
              <span />
            )}
            <Button
              onClick={goNext}
              disabled={!canProceed}
              loading={saving}
              className="min-w-[140px]"
            >
              {nextLabel}
            </Button>
          </footer>
        </div>
      </div>

      <UndeclaredNsfwModal
        open={showUndeclaredModal}
        onClose={() => setShowUndeclaredModal(false)}
      />
    </div>
  );
}

/** Desktop-only brand + journey rail. The form side stays focused; this panel carries orientation. */
function OnboardingAside({ index, t }: { index: number; t: ReturnType<typeof useT> }) {
  return (
    <aside className="relative hidden w-[38%] max-w-[460px] shrink-0 flex-col overflow-hidden border-r border-line/10 bg-gradient-to-b from-[#1a0f26]/80 to-[#0b0612]/80 px-10 py-14 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3">
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          className="text-accent"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 21s-7.5-4.6-10-9.2C.5 8.6 2 5.5 5 5.5c1.9 0 3.2 1.1 4 2.3.8-1.2 2.1-2.3 4-2.3 3 0 4.5 3.1 3 6.3C19.5 16.4 12 21 12 21z" />
        </svg>
        <span className="font-display text-2xl font-extrabold tracking-tight text-strong">
          AetherLove
        </span>
      </div>
      <p className="mt-4 max-w-[300px] text-[15px] leading-relaxed text-subtle">
        {t('onboarding.welcome_body')}
      </p>

      <ol className="mt-10 min-h-0 flex-1 space-y-1 overflow-y-auto pr-2">
        {STEPS.map((s, i) => {
          const done = i < index;
          const current = i === index;
          return (
            <li
              key={s}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors',
                current ? 'bg-accent/15 text-strong' : done ? 'text-subtle' : 'text-muted'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                  current
                    ? 'bg-accent-light text-[#1a0f26]'
                    : done
                      ? 'bg-accent/30 text-accent-light'
                      : 'border border-line/15 text-muted'
                )}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className="truncate font-medium">{t(HEADER_KEY[s])}</span>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        🔒 End-to-end encrypted
      </p>
    </aside>
  );
}

function StepPreferences({ t }: { t: ReturnType<typeof useT> }) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-bold text-strong">
        {t('onboarding.preferences_intro')}
      </h2>
      <div>
        <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-accent-light">
          {t('onboarding.preferences_theme')}
        </h3>
        <ThemePicker />
      </div>
    </div>
  );
}
