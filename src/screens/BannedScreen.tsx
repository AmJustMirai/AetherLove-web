// Web port of Screens/BannedScreen.cs — terminal screen for banned accounts. Shows the ban reason and any
// moderator notes from the connection snapshot. No actions.

import {useStore} from '../state/hooks';
import {sessionStore} from '../state/session';
import {useT} from '../i18n/useT';

export function BannedScreen() {
    const t = useT();
    const {connection} = useStore(sessionStore);
    const reason = connection?.BanReason?.trim();
    const notes = connection?.ModerationNotes?.trim();

    return (
        <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-y-auto px-6 pt-10">
            <h1 className="font-display text-2xl font-bold text-danger">{t('common.banned_title')}</h1>
            <div className="my-3 h-px bg-danger/40"/>
            <p className="text-[15px] leading-relaxed text-strong">{t('common.banned_body')}</p>

            {reason && (
                <div className="mt-5">
                    <p className="text-[13px] font-medium text-muted">{t('common.banned_reason_label')}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-body">{reason}</p>
                </div>
            )}
            {notes && (
                <div className="mt-5">
                    <p className="text-[13px] font-medium text-muted">{t('common.moderator_notes_label')}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-body">{notes}</p>
                </div>
            )}
            <p className="mt-6 text-[13px] leading-relaxed text-muted">{t('common.banned_uninstall_hint')}</p>
        </div>
    );
}
