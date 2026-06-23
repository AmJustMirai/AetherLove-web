// Web port of Screens/EncryptionRecoveryScreen.cs — one-time recovery for an Active account that reached
// the service with no server-side key bundle (e.g. re-registered after deletion). Prompts for a passphrase,
// generates a fresh identity, wraps + uploads it, caches the unlocked key, then advances the gate ladder.
// Reuses the same crypto path as onboarding (createIdentityBundle + uploadKeyBundle + setIdentity).

import {useState} from 'react';
import {hubClient} from '../services/signal/hubClient';
import {createIdentityBundle} from '../services/messaging/chatCrypto';
import {resolveNextScreen, sessionStore, setIdentity} from '../state/session';
import {MIN_PASSPHRASE} from './onboarding/useOnboardingForm';
import {router} from '../app/router';
import {useT} from '../i18n/useT';
import {Button, TextInput} from '../ui/components';

export function EncryptionRecoveryScreen() {
    const t = useT();
    const [passphrase, setPassphrase] = useState('');
    const [confirm, setConfirm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const tooShort = passphrase.length > 0 && passphrase.length < MIN_PASSPHRASE;
    const mismatch = confirm.length > 0 && passphrase !== confirm;
    const valid = passphrase.length >= MIN_PASSPHRASE && passphrase === confirm;

    async function recover() {
        if (submitting || !valid) return;
        setSubmitting(true);
        setError(null);
        try {
            const {identity, bundle} = await createIdentityBundle(passphrase);
            await hubClient.uploadKeyBundle(bundle);
            await setIdentity(identity);
            sessionStore.update((s) =>
                s.connection ? {...s, connection: {...s.connection, HasKeyBundle: true}} : s
            );
            router.navigate(resolveNextScreen());
        } catch (e) {
            setError(String((e as Error)?.message ?? e));
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto flex h-full w-full max-w-md flex-col px-6 pt-10">
            <h1 className="font-display text-2xl font-bold text-accent-light">
                {t('common.recovery_title')}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-body">{t('common.recovery_intro')}</p>

            <div className="mt-6 space-y-3">
                <TextInput
                    type="password"
                    label={t('onboarding.passphrase_label')}
                    value={passphrase}
                    onChange={setPassphrase}
                    error={tooShort ? t('onboarding.passphrase_too_short') : null}
                    autoFocus
                />
                <TextInput
                    type="password"
                    label={t('onboarding.passphrase_confirm')}
                    value={confirm}
                    onChange={setConfirm}
                    error={mismatch ? t('onboarding.passphrase_mismatch') : null}
                />
                {error && <p className="text-[13px] text-danger">{error}</p>}
                <Button
                    className="w-full"
                    loading={submitting}
                    disabled={!valid}
                    onClick={() => void recover()}
                >
                    {submitting ? t('common.acknowledging') : t('common.recovery_button')}
                </Button>
            </div>

            <p className="mt-8 text-[13px] leading-relaxed text-muted">{t('common.recovery_support')}</p>
        </div>
    );
}
