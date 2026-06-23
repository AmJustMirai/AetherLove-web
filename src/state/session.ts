// Web port of Services/Auth/SessionBootstrapper.cs — the startup orchestrator. boot() refreshes tokens,
// opens the SignalR hub, reads the connection snapshot, resolves the profile lifecycle, and loads the
// locally-cached identity key. resolveNextScreen() mirrors ResolveNextStartupScreen's gate order.

import {createStore} from './store';
import {tokenStore} from '../services/auth/tokenStore';
import {connection} from '../services/signal/connection';
import {hubClient} from '../services/signal/hubClient';
import {keyStorage} from '../services/crypto/keyStorage';
import {ProfileLifecycle} from '../shared/enums';
import type {AetherConnectionDto, OnboardingStateDto} from '../shared/dtos';
import type {IdentityKeyPair} from '../services/crypto/cryptoService';
import {Screen} from '../app/router';

export type BootResult =
    | 'pending'
    | 'noSession'
    | 'onboarding'
    | 'active'
    | 'banned'
    | 'outdated';

export interface SessionState {
    result: BootResult;
    displayName: string | null;
    connection: AetherConnectionDto | null;
    onboardingState: OnboardingStateDto | null;
    /** Unlocked identity for E2E chat (null until onboarding/unlock provides it). */
    identity: IdentityKeyPair | null;
}

const INITIAL: SessionState = {
    result: 'pending',
    displayName: null,
    connection: null,
    onboardingState: null,
    identity: null,
};

export const sessionStore = createStore<SessionState>(INITIAL);

function patch(p: Partial<SessionState>): void {
    sessionStore.update((s) => ({...s, ...p}));
}

/** Records the unlocked identity (after onboarding or passphrase unlock) and caches it locally. */
export async function setIdentity(identity: IdentityKeyPair): Promise<void> {
    patch({identity});
    await keyStorage.save(identity);
}

/** Tears down the local session: drops tokens + identity key, disconnects the hub, and resets the store to
 *  a clean no-session state. Used by account deletion (Settings) and any future sign-out. */
export async function signOut(): Promise<void> {
    try {
        await connection.disconnect();
    } catch {
        /* already down */
    }
    tokenStore.clear();
    await keyStorage.clear();
    sessionStore.set(INITIAL);
}

let inflight: Promise<BootResult> | null = null;

/** Starts or returns the in-flight bootstrap (single-flight, like SessionBootstrapper.RunAsync). */
export function boot(): Promise<BootResult> {
    if (inflight) return inflight;
    inflight = runCore().finally(() => {
        inflight = null;
    });
    return inflight;
}

async function settle(result: BootResult, displayName: string | null): Promise<BootResult> {
    patch({result, displayName});
    return result;
}

async function runCore(): Promise<BootResult> {
    patch({result: 'pending'});
    try {
        if (!tokenStore.current.refreshToken) return settle('noSession', null);

        if (tokenStore.isAccessTokenStale()) {
            const refreshed = await tokenStore.tryRefresh();
            if (!refreshed) {
                tokenStore.clear();
                return settle('noSession', null);
            }
        }

        await connection.ensureConnected();
        if (!connection.isConnected) {
            if (connection.unauthorized) {
                tokenStore.clear();
                await keyStorage.clear();
            }
            return settle('noSession', null);
        }

        const status = await hubClient.getConnectionInfo();
        patch({connection: status, identity: (await keyStorage.load())});

        if (status.Status === ProfileLifecycle.Onboarding) {
            try {
                patch({onboardingState: await hubClient.getOnboardingState()});
            } catch {
                patch({onboardingState: null});
            }
        }

        if (status.Status === ProfileLifecycle.Deleted) {
            tokenStore.clear();
            await keyStorage.clear();
            return settle('noSession', null);
        }
        if (status.Status === ProfileLifecycle.Banned) {
            return settle('banned', status.DisplayName);
        }

        switch (status.Status) {
            case ProfileLifecycle.Active:
            case ProfileLifecycle.ShadowBanned:
                return settle('active', status.DisplayName);
            default:
                return settle('onboarding', status.DisplayName);
        }
    } catch (e) {
        // Mirrors OutdatedClientException handling; we can't distinguish it precisely here, so treat an
        // explicit version rejection (surfaced as a message) as outdated, otherwise fall back to no-session.
        if (String((e as Error)?.message ?? '').toLowerCase().includes('version')) {
            await connection.disconnect();
            return settle('outdated', null);
        }
        return settle('noSession', null);
    }
}

/** Whether the server holds a key bundle but this device has no unlocked identity. */
function needsPassphraseUnlock(s: SessionState): boolean {
    if (!s.connection?.HasKeyBundle) return false;
    if (s.result !== 'active' && s.result !== 'onboarding') return false;
    return s.identity === null;
}

function hasUnseenWarnings(s: SessionState): boolean {
    return (s.connection?.Warnings ?? []).some((w) => !w.Seen);
}

/** Whether the snapshot carries any unacknowledged moderator messages. Null-guarded for version skew. */
function hasUnseenModeratorMessages(s: SessionState): boolean {
    return (s.connection?.ModeratorMessages ?? []).some((m) => !m.Seen);
}

/** An Active account that reached the service with no server key bundle (e.g. re-registered after
 *  deletion). Mirrors SessionBootstrapper.NeedsEncryptionRecovery (SignedInActive && !HasKeyBundle). */
function needsEncryptionRecovery(s: SessionState): boolean {
    return s.result === 'active' && s.connection?.HasKeyBundle === false;
}

function hasUnseenNews(s: SessionState): boolean {
    return (s.connection?.UnseenNews?.length ?? 0) > 0;
}

/** Startup gate order: outdated/banned → warnings → moderator messages → passphrase →
 *  encryption recovery → news → deck/onboarding. */
export function resolveNextScreen(): Screen {
    const s = sessionStore.get();
    if (s.result === 'outdated') return Screen.Outdated;
    if (s.result === 'banned') return Screen.Banned;
    if (hasUnseenWarnings(s) && (s.result === 'active' || s.result === 'onboarding')) {
        return Screen.WarningsAcknowledge;
    }
    if (hasUnseenModeratorMessages(s) && (s.result === 'active' || s.result === 'onboarding')) {
        return Screen.ModeratorMessages;
    }
    if (needsPassphraseUnlock(s)) return Screen.PassphraseUnlock;
    if (needsEncryptionRecovery(s)) return Screen.EncryptionRecovery;
    if (hasUnseenNews(s) && s.result === 'active') return Screen.News;
    return s.result === 'active' ? Screen.Deck : Screen.Onboarding;
}
