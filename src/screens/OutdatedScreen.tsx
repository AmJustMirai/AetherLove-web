// Web port of Screens/OutdatedScreen.cs — terminal screen shown when the server rejects this client's
// API version. No actions; the user must update (refresh to the newest deployed build).

import { useT } from '../i18n/useT';

export function OutdatedScreen() {
  const t = useT();
  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-y-auto px-6 pt-10">
      <div className="text-center text-5xl text-amber-400" aria-hidden>
        ⬇
      </div>
      <h1 className="mt-4 text-center font-display text-2xl font-bold text-amber-400">
        {t('common.outdated_title')}
      </h1>
      <div className="my-4 h-px bg-amber-400/50" />
      <p className="text-[15px] leading-relaxed text-strong">{t('common.outdated_body')}</p>
      <p className="mt-4 text-[13px] leading-relaxed text-muted">{t('common.outdated_hint')}</p>
    </div>
  );
}
