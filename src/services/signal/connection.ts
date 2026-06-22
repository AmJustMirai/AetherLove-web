// Port of the connection-owning half of Services/Signal/AetherSignalService.cs.
//
// Owns the SignalR HubConnection to /hubs/aetherlove over the MessagePack protocol, mirroring the
// plugin's setup: apiVersion + acceptsWebp ride the query string, the access token is refreshed on
// every (re)connect via the token factory, and automatic reconnect is enabled. The plugin's
// in-game concerns (offline screen debounce, combat hiding, mini-window) are intentionally dropped.

import {HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel,} from '@microsoft/signalr';
import {MessagePackHubProtocol} from '@microsoft/signalr-protocol-msgpack';
import {API_BASE, API_VERSION, HUB_PATH} from '../../config';
import {tokenStore} from '../auth/tokenStore';

export enum SignalConnectionState {
    Disconnected = 0,
    Connecting = 1,
    Connected = 2,
    Reconnecting = 3,
}

// Browsers decode WebP natively, so the plugin's WebpCapabilityProbe collapses to a constant true
// (plan §Risks: "modern browsers support it natively").
const ACCEPTS_WEBP = true;

export class AetherConnection {
    private hub: HubConnection | null = null;
    private state = SignalConnectionState.Disconnected;
    private connecting: Promise<void> | null = null;
    private lastFailureWasUnauthorized = false;
    private readonly stateListeners = new Set<(s: SignalConnectionState) => void>();

    /** Per-hub-event handler registrations, applied on (re)build. */
    private readonly eventHandlers = new Map<string, (payload: unknown) => void>();

    get isConnected(): boolean {
        return this.state === SignalConnectionState.Connected;
    }

    get unauthorized(): boolean {
        return this.lastFailureWasUnauthorized;
    }

    getState(): SignalConnectionState {
        return this.state;
    }

    onStateChange(fn: (s: SignalConnectionState) => void): () => void {
        this.stateListeners.add(fn);
        return () => this.stateListeners.delete(fn);
    }

    /** Registers a server→client push handler. Survives reconnects (re-applied on rebuild). */
    on(method: string, handler: (payload: unknown) => void): void {
        this.eventHandlers.set(method, handler);
        this.hub?.on(method, handler);
    }

    /** Returns the live hub connection, throwing if not connected (mirrors RequireConnection). */
    requireConnection(): HubConnection {
        if (!this.hub || this.hub.state !== HubConnectionState.Connected) {
            throw new Error('AetherLove hub connection is not established. Sign in first.');
        }
        return this.hub;
    }

    /** Opens the hub connection if not already open. Idempotent and single-flight. */
    async ensureConnected(): Promise<void> {
        if (!tokenStore.accessToken) return;
        if (this.hub && this.hub.state !== HubConnectionState.Disconnected) return;
        if (this.connecting) return this.connecting;

        this.connecting = this.doConnect().finally(() => {
            this.connecting = null;
        });
        return this.connecting;
    }

    async disconnect(): Promise<void> {
        if (!this.hub) return;
        try {
            await this.hub.stop();
        } finally {
            this.hub = null;
            this.setState(SignalConnectionState.Disconnected);
        }
    }

    private setState(s: SignalConnectionState): void {
        this.state = s;
        for (const fn of this.stateListeners) fn(s);
    }

    private async doConnect(): Promise<void> {
        this.hub ??= this.build();
        this.setState(SignalConnectionState.Connecting);
        this.lastFailureWasUnauthorized = false;
        try {
            await this.hub.start();
            this.setState(SignalConnectionState.Connected);
        } catch (e) {
            this.setState(SignalConnectionState.Disconnected);
            if (String((e as Error)?.message ?? '').includes('401')) {
                this.lastFailureWasUnauthorized = true;
            }
            throw e;
        }
    }

    private build(): HubConnection {
        const url = new URL(HUB_PATH, API_BASE);
        url.searchParams.set('apiVersion', String(API_VERSION));
        url.searchParams.set('acceptsWebp', ACCEPTS_WEBP ? 'true' : 'false');

        const hub = new HubConnectionBuilder()
            .withUrl(url.toString(), {
                // Refresh stale tokens on every (re)connect (mirrors AccessTokenProvider).
                accessTokenFactory: async () => {
                    if (tokenStore.isAccessTokenStale()) await tokenStore.tryRefresh();
                    return tokenStore.accessToken;
                },
            })
            .withHubProtocol(new MessagePackHubProtocol())
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();

        hub.onreconnecting(() => this.setState(SignalConnectionState.Reconnecting));
        hub.onreconnected(() => this.setState(SignalConnectionState.Connected));
        hub.onclose(() => this.setState(SignalConnectionState.Disconnected));

        // Re-apply push handlers registered before the connection was built.
        for (const [method, handler] of this.eventHandlers) hub.on(method, handler);
        return hub;
    }
}

export const connection = new AetherConnection();
