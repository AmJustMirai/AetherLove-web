// Web port of Screens/SettingsScreen.cs, condensed. A scrollable settings surface with a small view state
// machine for the sub-screens (delete flow, warnings, feedback, terms, contributors). Appearance reuses the
// shared ThemePicker; preferences/privacy write to the local settings store + the profile NSFW flag.

import { useEffect, useState } from 'react';
import { hubClient } from '../services/signal/hubClient';
import { router, Screen } from '../app/router';
import { sessionStore, signOut } from '../state/session';
import { settingsStore, updateSettings } from '../state/settings';
import { useStore } from '../state/hooks';
import { useT } from '../i18n/useT';
import { FeedbackKind, hasFlag, LookingFor } from '../shared/enums';
import { Button, Card, LoadingSpinner, pushToast, TextInput } from '../ui/components';
import { ThemePicker } from '../ui/ThemePicker';
import { cn } from '../ui/cn';

type View =
  | 'normal'
  | 'confirmDelete'
  | 'deleting'
  | 'deleted'
  | 'warnings'
  | 'modMessages'
  | 'feedback'
  | 'tos'
  | 'contributors';

export function SettingsScreen() {
  const t = useT();
  const [view, setView] = useState<View>('normal');

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <header className="px-6 pb-3 pt-6 lg:px-8 lg:pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-light/80">
          AetherLove
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-strong">
          {t('settings.title')}
        </h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 lg:px-6">
        {view === 'normal' && <NormalView t={t} setView={setView} />}
        {view === 'confirmDelete' && <ConfirmDeleteView t={t} setView={setView} />}
        {view === 'deleting' && <DeletingView t={t} />}
        {view === 'deleted' && <DeletedView t={t} />}
        {view === 'warnings' && <WarningsView t={t} onBack={() => setView('normal')} />}
        {view === 'modMessages' && <ModMessagesView t={t} onBack={() => setView('normal')} />}
        {view === 'feedback' && <FeedbackView t={t} onBack={() => setView('normal')} />}
        {view === 'tos' && (
          <TextPanel
            title={t('settings.terms_of_service')}
            body={t('onboarding.tos_body')}
            onBack={() => setView('normal')}
            t={t}
          />
        )}
        {view === 'contributors' && <ContributorsView t={t} onBack={() => setView('normal')} />}
      </div>
    </div>
  );
}

type T = ReturnType<typeof useT>;

// ---- Shared bits -------------------------------------------------------------------------

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="mb-2 mt-6 text-[13px] font-semibold uppercase tracking-wide text-accent-light">
      {children}
    </h2>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 py-2 text-left disabled:opacity-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-strong">{label}</span>
        {hint && <span className="block text-[12px] leading-snug text-muted">{hint}</span>}
      </span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-surface/15'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-strong shadow transition-transform',
            checked ? 'left-0.5 translate-x-5' : 'left-0.5'
          )}
        />
      </span>
    </button>
  );
}

function MenuRow({
  label,
  onClick,
  badge,
}: {
  label: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[14px] text-strong transition-colors hover:bg-surface/5"
    >
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-on-accent">
          {badge}
        </span>
      )}
      <span className="text-muted" aria-hidden>
        ›
      </span>
    </button>
  );
}

// ---- Normal view -------------------------------------------------------------------------

function NormalView({ t, setView }: { t: T; setView: (v: View) => void }) {
  const settings = useStore(settingsStore);
  const connection = useStore(sessionStore).connection;
  const warnings = connection?.Warnings ?? [];
  const unseenWarnings = warnings.filter((w) => !w.Seen).length;
  const modMessages = connection?.ModeratorMessages ?? [];
  const unseenModMessages = modMessages.filter((m) => !m.Seen).length;

  return (
    <div>
      <SectionLabel>{t('settings.section_appearance')}</SectionLabel>
      <ThemePicker />

      <SectionLabel>{t('settings.section_preferences')}</SectionLabel>
      <Card className="divide-y divide-line/5 p-2">
        <Toggle
          label={t('settings.reduce_motion')}
          hint={t('settings.reduce_motion_hint')}
          checked={settings.reduceMotion}
          onChange={(v) => updateSettings({ reduceMotion: v })}
        />
        <Toggle
          label={t('settings.sound_effects')}
          hint={t('settings.sound_effects_hint')}
          checked={settings.soundEffects}
          onChange={(v) => updateSettings({ soundEffects: v })}
        />
      </Card>

      <SectionLabel>{t('settings.section_privacy')}</SectionLabel>
      <Card className="divide-y divide-line/5 p-2">
        <Toggle
          label={t('settings.always_blur_nsfw')}
          hint={t('settings.always_blur_nsfw_hint')}
          checked={settings.alwaysBlurNsfw}
          onChange={(v) => updateSettings({ alwaysBlurNsfw: v })}
        />
        <NsfwProfileToggle t={t} />
      </Card>

      <SectionLabel>{t('settings.section_other')}</SectionLabel>
      <Card className="divide-y divide-line/5 p-1">
        <MenuRow
          label={t('news.settings_button')}
          onClick={() => router.navigate(Screen.News)}
          badge={connection?.UnseenNews.length || undefined}
        />
        {modMessages.length > 0 && (
          <MenuRow
            label={t('settings.modmsg_button')}
            onClick={() => setView('modMessages')}
            badge={unseenModMessages || undefined}
          />
        )}
        <MenuRow label={t('settings.send_feedback')} onClick={() => setView('feedback')} />
        <MenuRow label={t('settings.terms_of_service')} onClick={() => setView('tos')} />
        <MenuRow label={t('settings.contributors')} onClick={() => setView('contributors')} />
      </Card>

      <SectionLabel>{t('settings.section_danger_zone')}</SectionLabel>
      <div className="space-y-2">
        {warnings.length > 0 && (
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setView('warnings')}
          >
            {unseenWarnings > 0
              ? t('settings.warnings_button_unseen', unseenWarnings, warnings.length)
              : t('settings.warnings_button', warnings.length)}
          </Button>
        )}
        <Button
          variant="danger"
          className="w-full justify-start"
          onClick={() => setView('confirmDelete')}
        >
          {t('settings.delete_account')}
        </Button>
      </div>

      <BuildInfoPanel />
    </div>
  );
}

// Build transparency: fetches integrity-manifest.json produced at build time and shows the
// commit hash, ref, and build timestamp. Not a security check — just a discoverability aid
// that tells users what commit is running and how to independently verify it from the source repo.
function BuildInfoPanel() {
  const [info, setInfo] = useState<{ commit: string; ref: string; builtAt: string } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}integrity-manifest.json`);
        if (!res.ok) return;
        const m = (await res.json()) as { commit: string; ref: string; builtAt: string };
        setInfo(m);
      } catch {
        // unavailable in dev (manifest is a build artifact, not in public/)
      }
    })();
  }, []);

  if (!info) return null;

  const shortCommit = info.commit.slice(0, 7);
  const builtDate = new Date(info.builtAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const verifyUrl = window.location.origin + import.meta.env.BASE_URL;

  return (
    <div className="mt-8 border-t border-line/5 pt-5 pb-2">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted/50">
        Build info
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[12px]">
        <dt className="text-muted/60">commit</dt>
        <dd className="text-subtle">{shortCommit}</dd>
        <dt className="text-muted/60">ref</dt>
        <dd className="text-subtle">{info.ref}</dd>
        <dt className="text-muted/60">built</dt>
        <dd className="text-subtle">{builtDate}</dd>
      </dl>
      <p className="mt-3 text-[11px] leading-relaxed text-muted/50">
        To verify this deployment matches the source:{' '}
        <span className="break-all font-mono text-muted/70">
          node verify/verify.mjs {verifyUrl}
        </span>
      </p>
    </div>
  );
}

function NsfwProfileToggle({ t }: { t: T }) {
  const [loaded, setLoaded] = useState(false);
  const [on, setOn] = useState(false);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const detail = await hubClient.getMyProfileDetail();
        if (cancelled) return;
        setOn(detail.IsNsfw);
        setLocked(
          hasFlag(detail.LookingForMask, LookingFor.Erp) || detail.Photos.some((p) => p.IsNsfw)
        );
        setLoaded(true);
      } catch {
        if (!cancelled) setError(t('settings.nsfw_load_failed'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  async function set(next: boolean) {
    if (!next && locked) return; // can't turn off while ERP / NSFW photo forces it on
    setBusy(true);
    setError(null);
    const prev = on;
    setOn(next);
    try {
      await hubClient.setProfileNsfw(next);
    } catch {
      setOn(prev);
      setError(t('settings.nsfw_load_failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Toggle
        label={t('settings.nsfw_profile')}
        hint={t('settings.nsfw_profile_hint')}
        checked={on}
        onChange={set}
        disabled={!loaded || busy}
      />
      {locked && on && (
        <p className="px-1 pb-1 text-[12px] text-amber">{t('settings.nsfw_profile_locked')}</p>
      )}
      {error && <p className="px-1 pb-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}

// ---- Delete flow -------------------------------------------------------------------------

function ConfirmDeleteView({ t, setView }: { t: T; setView: (v: View) => void }) {
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setView('deleting');
    setError(null);
    try {
      await hubClient.deleteAccount();
      await signOut();
      setView('deleted');
    } catch (e) {
      setError(t('settings.delete_failed', (e as Error).message));
      setView('confirmDelete');
    }
  }

  return (
    <div className="pt-2">
      <h2 className="font-display text-xl font-bold text-danger">{t('settings.delete_account')}</h2>
      <p className="mt-3 text-[14px] text-body">{t('settings.delete_warning_intro')}</p>
      <ul className="mt-3 space-y-1.5 text-[14px] text-body">
        {[
          t('settings.delete_bullet_account'),
          t('settings.delete_bullet_matches'),
          t('settings.delete_bullet_preferences'),
          t('settings.delete_bullet_pictures'),
        ].map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-danger" aria-hidden>
              •
            </span>
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-muted">{t('settings.delete_reregister')}</p>
      {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
      <div className="mt-5 flex gap-2">
        <Button variant="ghost" onClick={() => setView('normal')}>
          {t('settings.back')}
        </Button>
        <Button variant="danger" className="flex-1" onClick={confirmDelete}>
          {t('settings.delete_confirm')}
        </Button>
      </div>
    </div>
  );
}

function DeletingView({ t }: { t: T }) {
  return (
    <div className="flex flex-col items-center gap-4 pt-16 text-center">
      <LoadingSpinner size={28} />
      <h2 className="font-display text-lg font-bold text-strong">{t('settings.deleting_title')}</h2>
      <p className="text-[14px] text-muted">{t('settings.deleting_body')}…</p>
    </div>
  );
}

function DeletedView({ t }: { t: T }) {
  return (
    <div className="pt-8 text-center">
      <h2 className="font-display text-xl font-bold text-strong">{t('settings.deleted_title')}</h2>
      <p className="mt-3 text-[14px] text-body">{t('settings.deleted_body')}</p>
      <Button className="mt-6" onClick={() => router.navigate(Screen.Onboarding)}>
        {t('settings.create_new_profile')}
      </Button>
    </div>
  );
}

// ---- Sub-panels --------------------------------------------------------------------------

function WarningsView({ t, onBack }: { t: T; onBack: () => void }) {
  const warnings = useStore(sessionStore).connection?.Warnings ?? [];
  return (
    <div className="pt-2">
      <h2 className="mb-3 font-display text-xl font-bold text-strong">
        {t('settings.warnings_title')}
      </h2>
      {warnings.length === 0 ? (
        <p className="text-[14px] text-muted">{t('settings.no_warnings')}</p>
      ) : (
        <div className="space-y-3">
          {warnings.map((w) => (
            <Card key={w.Id}>
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
                {new Date(w.CreatedAtUtc).toLocaleString()}
              </p>
              <p className="mt-1 text-[14px] text-body">{w.Reason}</p>
            </Card>
          ))}
        </div>
      )}
      <Button variant="ghost" className="mt-5" onClick={onBack}>
        {t('settings.back_to_settings')}
      </Button>
    </div>
  );
}

function ModMessagesView({ t, onBack }: { t: T; onBack: () => void }) {
  const messages = useStore(sessionStore).connection?.ModeratorMessages ?? [];
  return (
    <div className="pt-2">
      <h2 className="mb-3 font-display text-xl font-bold text-strong">
        {t('settings.modmsg_title')}
      </h2>
      {messages.length === 0 ? (
        <p className="text-[14px] text-muted">{t('settings.no_modmsg')}</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.Id}>
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
                {new Date(m.CreatedAtUtc).toLocaleString()}
              </p>
              <p className={cn('mt-1 text-[14px]', m.Seen ? 'text-muted' : 'text-accent-light')}>
                {m.Body}
              </p>
            </Card>
          ))}
        </div>
      )}
      <Button variant="ghost" className="mt-5" onClick={onBack}>
        {t('settings.back_to_settings')}
      </Button>
    </div>
  );
}

function TextPanel({
  title,
  body,
  onBack,
  t,
}: {
  title: string;
  body: string;
  onBack: () => void;
  t: T;
}) {
  return (
    <div className="pt-2">
      <h2 className="mb-3 font-display text-xl font-bold text-strong">{title}</h2>
      <p className="whitespace-pre-line text-[14px] leading-relaxed text-body">{body}</p>
      <Button variant="ghost" className="mt-5" onClick={onBack}>
        {t('settings.back_to_settings')}
      </Button>
    </div>
  );
}

function ContributorsView({ t, onBack }: { t: T; onBack: () => void }) {
  return (
    <div className="pt-2 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 21s-7.5-4.6-10-9.2C.5 8.6 2 5.5 5 5.5c1.9 0 3.2 1.1 4 2.3.8-1.2 2.1-2.3 4-2.3 3 0 4.5 3.1 3 6.3C19.5 16.4 12 21 12 21z" />
        </svg>
      </div>
      <h2 className="mt-3 font-display text-xl font-bold text-strong">
        {t('settings.contributors_title')}
      </h2>
      <p className="mt-2 text-[14px] text-subtle">{t('settings.contributors_intro')}</p>
      <Button variant="ghost" className="mt-6" onClick={onBack}>
        {t('settings.back_to_settings')}
      </Button>
    </div>
  );
}

function FeedbackView({ t, onBack }: { t: T; onBack: () => void }) {
  const [kind, setKind] = useState<FeedbackKind>(FeedbackKind.Bug);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const kinds: { value: FeedbackKind; label: string }[] = [
    { value: FeedbackKind.Bug, label: t('settings.feedback_kind_bug') },
    { value: FeedbackKind.Improvement, label: t('settings.feedback_kind_improvement') },
    { value: FeedbackKind.Other, label: t('settings.feedback_kind_other') },
  ];

  async function submit() {
    if (submitting || text.trim().length === 0) return;
    setSubmitting(true);
    try {
      await hubClient.submitFeedback({ Kind: kind, Message: text.trim() });
      setDone(true);
    } catch {
      pushToast(t('settings.feedback_failed'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="pt-8 text-center">
        <p className="text-[15px] text-success">{t('settings.feedback_thanks')}</p>
        <Button variant="ghost" className="mt-6" onClick={onBack}>
          {t('settings.back_to_settings')}
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <h2 className="mb-2 font-display text-xl font-bold text-strong">
        {t('settings.send_feedback')}
      </h2>
      <p className="text-[14px] text-subtle">{t('settings.feedback_intro')}</p>
      <p className="mt-1 text-[13px] text-amber">{t('settings.feedback_note')}</p>

      <p className="mb-2 mt-4 text-[13px] font-medium text-subtle">{t('settings.feedback_type')}</p>
      <div className="flex gap-2">
        {kinds.map((k) => (
          <button
            key={k.value}
            type="button"
            onClick={() => setKind(k.value)}
            className={cn(
              'flex-1 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors',
              kind === k.value
                ? 'border-accent bg-accent/20 text-strong'
                : 'border-line/10 text-subtle hover:bg-surface/5'
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <TextInput
          label={t('settings.feedback_message')}
          value={text}
          onChange={setText}
          multiline
          rows={6}
          maxLength={4000}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" onClick={onBack}>
          {t('settings.back')}
        </Button>
        <Button
          className="flex-1"
          onClick={submit}
          loading={submitting}
          disabled={text.trim().length === 0}
        >
          {submitting ? t('settings.feedback_sending') : t('settings.feedback_submit')}
        </Button>
      </div>
    </div>
  );
}
