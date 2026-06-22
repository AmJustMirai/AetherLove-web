// Port of Services/Auth/AuthService.cs — the XIVAuth polling sign-in flow, adapted for the browser.
//
// Same REST contract (POST /auth/login/start → open browser → poll /auth/login/poll until tokens),
// camelCase JSON. The plugin shelled out to a system browser; the web client opens the login URL in
// a new tab. Tokens land in the shared tokenStore on success; the caller wires the hub connect.

import {API_BASE} from '../../config';
import {getOrCreateDeviceId} from '../storage';
import {tokenStore} from './tokenStore';

export enum AuthFlowState {
    Idle = 0,
    Starting = 1,
    AwaitingBrowser = 2,
    Completed = 3,
    Failed = 4,
}

interface LoginStartJson {
    transactionId: string;
    transactionSecret: string;
    loginUrl: string;
    expiresAtUtc: string;
}

interface LoginPollJson {
    status: string;
    tokens?: {
        accessToken: string;
        accessTokenExpiresAtUtc: string;
        refreshToken: string;
        refreshTokenExpiresAtUtc: string;
    } | null;
    error?: string | null;
}

const POLL_INTERVAL_MS = 2000;

export interface AuthFlowSnapshot {
    state: AuthFlowState;
    loginUrl: string | null;
    errorMessage: string | null;
    lastFailureWasExpiry: boolean;
}

type Listener = (snap: AuthFlowSnapshot) => void;

const delay = (ms: number, signal?: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            clearTimeout(t);
            reject(new DOMException('Aborted', 'AbortError'));
        });
    });

export class AuthService {
    private state = AuthFlowState.Idle;
    private loginUrl: string | null = null;
    private errorMessage: string | null = null;
    private lastFailureWasExpiry = false;
    private abort: AbortController | null = null;
    private readonly listeners = new Set<Listener>();

    constructor(private readonly onCompleted?: () => void) {
    }

    get snapshot(): AuthFlowSnapshot {
        return {
            state: this.state,
            loginUrl: this.loginUrl,
            errorMessage: this.errorMessage,
            lastFailureWasExpiry: this.lastFailureWasExpiry,
        };
    }

    subscribe(fn: Listener): () => void {
        this.listeners.add(fn);
        fn(this.snapshot);
        return () => this.listeners.delete(fn);
    }

    /** Begins a new sign-in flow, cancelling any in-flight one. */
    startSignIn(): void {
        this.cancel();
        this.abort = new AbortController();
        this.loginUrl = null;
        this.errorMessage = null;
        this.lastFailureWasExpiry = false;
        this.setState(AuthFlowState.Starting);
        void this.runFlow(this.abort.signal);
    }

    /** Cancels the in-flight flow and resets to Idle. Idempotent. */
    cancel(): void {
        this.abort?.abort();
        this.abort = null;
        this.loginUrl = null;
        this.errorMessage = null;
        this.lastFailureWasExpiry = false;
        this.state = AuthFlowState.Idle;
        this.emit();
    }

    /** Re-opens the login URL in a new tab. No-op if not set. */
    reopenBrowser(): void {
        if (this.loginUrl) this.openBrowser(this.loginUrl);
    }

    private emit(): void {
        const snap = this.snapshot;
        for (const fn of this.listeners) fn(snap);
    }

    private setState(s: AuthFlowState): void {
        this.state = s;
        this.emit();
    }

    private fail(message: string, expiry: boolean): void {
        this.errorMessage = message;
        this.lastFailureWasExpiry = expiry;
        this.setState(AuthFlowState.Failed);
    }

    private openBrowser(url: string): void {
        // noopener/noreferrer so the opened XIVAuth tab can't reach back into this window.
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    private async runFlow(signal: AbortSignal): Promise<void> {
        let start: LoginStartJson;
        try {
            const resp = await fetch(API_BASE + 'auth/login/start', {
                method: 'POST',
                headers: {'content-type': 'application/json'},
                body: JSON.stringify({deviceName: getOrCreateDeviceId()}),
                signal,
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            start = (await resp.json()) as LoginStartJson;
        } catch (e) {
            if (signal.aborted) return;
            this.fail(`Could not reach the AetherLove server: ${(e as Error).message}`, false);
            return;
        }

        this.loginUrl = start.loginUrl;
        this.setState(AuthFlowState.AwaitingBrowser);
        this.openBrowser(start.loginUrl);

        const expiresAt = Date.parse(start.expiresAtUtc);
        while (!signal.aborted) {
            if (Date.now() >= expiresAt) {
                this.fail('Sign-in took too long. Please try again.', true);
                return;
            }

            try {
                const resp = await fetch(API_BASE + 'auth/login/poll', {
                    method: 'POST',
                    headers: {'content-type': 'application/json'},
                    body: JSON.stringify({
                        transactionId: start.transactionId,
                        transactionSecret: start.transactionSecret,
                    }),
                    signal,
                });

                if (resp.status === 202) {
                    // Still awaiting the user's XIVAuth flow; fall through to the poll delay.
                } else if (resp.ok) {
                    const body = (await resp.json()) as LoginPollJson;
                    if (body.status === 'completed' && body.tokens) {
                        tokenStore.apply(body.tokens);
                        this.setState(AuthFlowState.Completed);
                        this.onCompleted?.();
                        return;
                    }
                    this.fail(body.error ?? 'Unexpected response from the server.', false);
                    return;
                } else {
                    let serverError: string | null = null;
                    try {
                        serverError = ((await resp.json()) as LoginPollJson).error ?? null;
                    } catch {
                        /* non-JSON error body */
                    }
                    this.fail(serverError ?? `Sign-in failed (${resp.status}).`, false);
                    return;
                }
            } catch (e) {
                if (signal.aborted) return;
                this.fail(`Lost contact with the AetherLove server: ${(e as Error).message}`, false);
                return;
            }

            try {
                await delay(POLL_INTERVAL_MS, signal);
            } catch {
                return; // aborted
            }
        }
    }
}
