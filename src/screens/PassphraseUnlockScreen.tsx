// Web port of Screens/PassphraseUnlockScreen.cs — prompts for the passphrase to unwrap the server-stored
// key bundle on a new device. Reuses chatCrypto.unlockIdentity (Argon2id KEK + AES-GCM unwrap); on success
// caches the identity and advances the startup ladder. "Sign out" clears local state and restarts.

import {useEffect, useState} from 'react';
import {hubClient} from '../services/signal/hubClient';
import {unlockIdentity} from '../services/messaging/chatCrypto';
import {resolveNextScreen, setIdentity, signOut} from '../state/session';
import {router, Screen} from '../app/router';
import type {KeyBundleDto} from '../shared/dtos';
import {useT} from '../i18n/useT';
import {Button, TextInput} from '../ui/components';

export function PassphraseUnlockScreen() {
    const t = useT();
    const [bundle, setBundle] = useState<KeyBundleDto | null>(null);
    const [fetching, setFetching] = useState(true);
    const [passphrase, setPassphrase] = useState('');
    const [unlocking, setUnlocking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const b = await hubClient.getMyKeyBundle();
                if (cancelled) return;
                if (!b) setError(t('common.passphrase_bundle_load_failed'));
                else setBundle(b);
            } catch (e) {
                if (!cancelled) setError(t('common.server_unreachable_detail', String((e as Error)?.message ?? e)));
            } finally {
                if (!cancelled) setFetching(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [t]);

    async function unlock() {
        if (!bundle || unlocking) return;
        if (!passphrase) {
            setError(t('common.passphrase_empty'));
            return;
        }
        setUnlocking(true);
        setError(null);
        try {
            const identity = await unlockIdentity(bundle, passphrase);
            if (!identity) {
                setError(t('common.passphrase_incorrect'));
                return;
            }
            await setIdentity(identity);
            router.navigate(resolveNextScreen());
        } catch (e) {
            setError(t('common.passphrase_unlock_failed', String((e as Error)?.message ?? e)));
        } finally {
            setUnlocking(false);
        }
    }

    async function doSignOut() {
        await signOut();
        router.navigate(Screen.Onboarding);
    }

    return (
        <div className="mx-auto flex h-full w-full max-w-md flex-col px-6 pt-10">
            <h1 className="font-display text-2xl font-bold text-accent-light">{t('common.passphrase_title')}</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-body">{t('common.passphrase_intro')}</p>

            <div className="mt-6 space-y-3">
                {fetching ? (
                    <p className="text-[14px] text-muted">{t('common.loading')}</p>
                ) : !bundle ? (
                    <p className="text-[14px] text-danger">{error}</p>
                ) : (
                    <>
                        <TextInput
                            type="password"
                            label={t('common.passphrase_title')}
                            value={passphrase}
                            onChange={setPassphrase}
                            autoFocus
                        />
                        {error && <p className="text-[13px] text-danger">{error}</p>}
                        <Button className="w-full" loading={unlocking} onClick={() => void unlock()}>
                            {unlocking ? t('common.unlocking') : t('common.unlock')}
                        </Button>
                    </>
                )}
            </div>

            <p className="mt-8 text-[13px] leading-relaxed text-muted">{t('common.passphrase_forgot')}</p>
            <Button variant="ghost" className="mt-3 w-full" onClick={() => void doSignOut()}>
                {t('common.sign_out')}
            </Button>
        </div>
    );
}
