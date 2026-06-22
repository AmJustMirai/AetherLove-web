// Port of Services/Auth/TokenService.cs: token storage + refresh against POST /auth/refresh.
//
// The REST auth endpoints use System.Text.Json with JsonSerializerDefaults.Web on the server, i.e.
// camelCase property names — distinct from the PascalCase MessagePack contract the hub uses. So the
// JSON bodies/responses here are camelCase.

import {API_BASE} from '../../config';
import {authStorage} from '../storage';

/** Refresh when the access token expires within this window. Mirrors TokenService.RefreshSkew. */
const REFRESH_SKEW_MS = 60_000;

interface TokenPairJson {
    accessToken: string;
    accessTokenExpiresAtUtc: string;
    refreshToken: string;
    refreshTokenExpiresAtUtc: string;
}

export interface AuthState {
    accessToken: string;
    accessTokenExpiresAtUtc: string;
    refreshToken: string;
    refreshTokenExpiresAtUtc: string;
}

function read(): AuthState {
    const p = authStorage.load();
    return {
        accessToken: p.AccessToken,
        accessTokenExpiresAtUtc: p.AccessTokenExpiresAtUtc,
        refreshToken: p.RefreshToken,
        refreshTokenExpiresAtUtc: p.RefreshTokenExpiresAtUtc,
    };
}

export class TokenStore {
    // Single-flight gate so concurrent callers don't rotate each other out (mirrors _refreshGate).
    private refreshInFlight: Promise<boolean> | null = null;

    /** Snapshot of the current tokens. */
    get current(): AuthState {
        return read();
    }

    get accessToken(): string {
        return read().accessToken;
    }

    /** True when there is no access token or it expires within the refresh skew. */
    isAccessTokenStale(): boolean {
        const a = read();
        if (!a.accessToken) return true;
        const expiresAt = Date.parse(a.accessTokenExpiresAtUtc);
        if (Number.isNaN(expiresAt)) return true;
        return expiresAt - Date.now() < REFRESH_SKEW_MS;
    }

    /** Persists a freshly issued token pair. */
    apply(tokens: TokenPairJson): void {
        authStorage.save({
            AccessToken: tokens.accessToken,
            AccessTokenExpiresAtUtc: tokens.accessTokenExpiresAtUtc,
            RefreshToken: tokens.refreshToken,
            RefreshTokenExpiresAtUtc: tokens.refreshTokenExpiresAtUtc,
        });
    }

    /** Wipes the stored tokens locally. */
    clear(): void {
        authStorage.clear();
    }

    /** Exchanges the refresh token for a fresh pair. Returns false on failure or no stored token. */
    tryRefresh(signal?: AbortSignal): Promise<boolean> {
        if (this.refreshInFlight) return this.refreshInFlight;
        this.refreshInFlight = this.doRefresh(signal).finally(() => {
            this.refreshInFlight = null;
        });
        return this.refreshInFlight;
    }

    private async doRefresh(signal?: AbortSignal): Promise<boolean> {
        const refreshToken = read().refreshToken;
        if (!refreshToken) return false;
        // Re-check under the single-flight gate: a concurrent refresh may have just freshened it.
        if (!this.isAccessTokenStale()) return true;

        try {
            const resp = await fetch(API_BASE + 'auth/refresh', {
                method: 'POST',
                headers: {'content-type': 'application/json'},
                body: JSON.stringify({refreshToken}),
                signal,
            });
            if (!resp.ok) return false;
            const tokens = (await resp.json()) as TokenPairJson;
            if (!tokens?.accessToken) return false;
            this.apply(tokens);
            return true;
        } catch {
            return false;
        }
    }
}

export const tokenStore = new TokenStore();
