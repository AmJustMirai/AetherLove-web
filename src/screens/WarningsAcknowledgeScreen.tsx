// Web port of Screens/WarningAcknowledgeScreen.cs — acknowledge unseen moderation warnings before
// continuing. Lists each warning (date + reason); "I understand" marks them seen server-side, flips the
// cached snapshot, then advances through the startup gate ladder.

import { useMemo, useState } from 'react';
import { hubClient } from '../services/signal/hubClient';
import { resolveNextScreen, sessionStore } from '../state/session';
import { useStore } from '../state/hooks';
import { router } from '../app/router';
import { useT } from '../i18n/useT';
import { Button } from '../ui/components';

export function WarningsAcknowledgeScreen() {
  const t = useT();
  const { connection } = useStore(sessionStore);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unseen = useMemo(() => (connection?.Warnings ?? []).filter((w) => !w.Seen), [connection]);

  async function acknowledge() {
    if (submitting || unseen.length === 0) return;
    setSubmitting(true);
    setError(null);
    const ids = unseen.map((w) => w.Id);
    try {
      await hubClient.markWarningsSeen(ids);
      sessionStore.update((s) =>
        s.connection
          ? {
              ...s,
              connection: {
                ...s.connection,
                Warnings: s.connection.Warnings.map((w) =>
                  ids.includes(w.Id) ? { ...w, Seen: true } : w
                ),
              },
            }
          : s
      );
      router.navigate(resolveNextScreen());
    } catch (e) {
      setError(String((e as Error)?.message ?? e));
      setSubmitting(false);
    }
  }

  const heading =
    unseen.length === 1
      ? t('common.warnings_heading_one')
      : t('common.warnings_heading_many', unseen.length);

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col px-6 pt-8">
      <h1 className="font-display text-2xl font-bold text-amber-300">{heading}</h1>
      <div className="my-3 h-px bg-amber-300/40" />
      <p className="text-[14px] leading-relaxed text-body">{t('common.warnings_body')}</p>

      <div className="my-5 min-h-0 flex-1 space-y-4 overflow-y-auto">
        {unseen.map((w) => (
          <div key={w.Id}>
            <p className="text-[12px] text-muted">{new Date(w.CreatedAtUtc).toLocaleString()}</p>
            <p className="mt-0.5 text-[14px] leading-relaxed text-strong">{w.Reason}</p>
          </div>
        ))}
      </div>

      {error && (
        <p className="mb-2 text-[13px] text-danger">{t('common.warnings_submit_error', error)}</p>
      )}
      <Button className="mb-6 w-full" loading={submitting} onClick={() => void acknowledge()}>
        {submitting ? t('common.acknowledging') : t('common.i_understand')}
      </Button>
    </div>
  );
}
