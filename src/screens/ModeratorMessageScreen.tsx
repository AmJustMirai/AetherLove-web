// Web port of Screens/ModeratorMessageScreen.cs — acknowledge informational messages from the moderation
// team before continuing. Mirrors WarningsAcknowledgeScreen but with a neutral/info tone (these are not
// warnings). "Got it" marks them seen server-side, flips the cached snapshot, then advances the gate ladder.

import {useMemo, useState} from 'react';
import {hubClient} from '../services/signal/hubClient';
import {resolveNextScreen, sessionStore} from '../state/session';
import {useStore} from '../state/hooks';
import {router} from '../app/router';
import {useT} from '../i18n/useT';
import {Button} from '../ui/components';

export function ModeratorMessageScreen() {
    const t = useT();
    const {connection} = useStore(sessionStore);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const unseen = useMemo(
        () => (connection?.ModeratorMessages ?? []).filter((m) => !m.Seen),
        [connection]
    );

    async function acknowledge() {
        if (submitting || unseen.length === 0) return;
        setSubmitting(true);
        setError(null);
        const ids = unseen.map((m) => m.Id);
        try {
            await hubClient.markModeratorMessagesSeen(ids);
            sessionStore.update((s) =>
                s.connection
                    ? {
                        ...s,
                        connection: {
                            ...s.connection,
                            ModeratorMessages: s.connection.ModeratorMessages.map((m) =>
                                ids.includes(m.Id) ? {...m, Seen: true} : m
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
            ? t('common.modmsg_heading_one')
            : t('common.modmsg_heading_many', unseen.length);

    return (
        <div className="mx-auto flex h-full w-full max-w-md flex-col px-6 pt-8">
            <h1 className="font-display text-2xl font-bold text-accent-light">{heading}</h1>
            <div className="my-3 h-px bg-accent-light/40"/>
            <p className="text-[14px] leading-relaxed text-body">{t('common.modmsg_body')}</p>

            <div className="my-5 min-h-0 flex-1 space-y-4 overflow-y-auto">
                {unseen.map((m) => (
                    <div key={m.Id}>
                        <p className="text-[12px] text-muted">{new Date(m.CreatedAtUtc).toLocaleString()}</p>
                        <p className="mt-0.5 text-[14px] leading-relaxed text-strong">{m.Body}</p>
                    </div>
                ))}
            </div>

            {error && <p className="mb-2 text-[13px] text-danger">{error}</p>}
            <Button className="mb-6 w-full" loading={submitting} onClick={() => void acknowledge()}>
                {submitting ? t('common.acknowledging') : t('common.modmsg_got_it')}
            </Button>
        </div>
    );
}
