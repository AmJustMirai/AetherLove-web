// Web port of Screens/OfflineScreen.cs — blocking screen shown when the SignalR hub connection drops.
// The connection watcher (pushHandlers) routes here on disconnect and away once restored; the manual
// retry mirrors the plugin's "try again" button.

import { connection, SignalConnectionState } from '../services/signal/connection';
import { useExternal } from '../state/hooks';
import { useT } from '../i18n/useT';
import { Button, LoadingSpinner } from '../ui/components';

export function OfflineScreen() {
  const t = useT();
  const state = useExternal(
    connection.onStateChange.bind(connection),
    connection.getState.bind(connection)
  );
  const reconnecting =
    state === SignalConnectionState.Reconnecting || state === SignalConnectionState.Connecting;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="text-5xl text-danger/80" aria-hidden>
        🔌
      </div>
      <h1 className="font-display text-2xl font-bold text-danger">{t('common.offline_title')}</h1>
      <p className="max-w-xs text-[14px] leading-relaxed text-body">{t('common.offline_body')}</p>

      {reconnecting ? (
        <div className="flex items-center gap-2 text-accent-light">
          <LoadingSpinner size={16} />
          <span className="text-[13px]">{t('common.offline_reconnecting')}</span>
        </div>
      ) : (
        <>
          <p className="text-[12px] text-muted">{t('common.offline_keep_trying')}</p>
          <Button onClick={() => void connection.ensureConnected().catch(() => undefined)}>
            {t('common.try_again')}
          </Button>
        </>
      )}
    </div>
  );
}
