// Server origin + protocol version. Mirrors AetherConstants.ServerBaseUrl / ApiVersion.Current.
const DEFAULT_API_BASE = 'https://api.aetherlove.space/';

/**
 * Server base URL, trailing slash guaranteed.
 *
 * Resolution order:
 *  1. VITE_API_BASE — explicit override (e.g. a prod deployment behind its own reverse proxy).
 *  2. Dev (`import.meta.env.DEV`) — same-origin `/api/`, served by the Vite proxy in vite.config.ts.
 *     This keeps REST + the SignalR hub same-origin so the browser never makes a cross-origin
 *     (CORS-blocked) request to api.aetherlove.space. `new URL(HUB_PATH, API_BASE)` needs an absolute
 *     base, so we anchor it on the current origin.
 *  3. Production default — the real server origin.
 */
export const API_BASE: string = (() => {
  const override = import.meta.env?.VITE_API_BASE as string | undefined;
  const raw =
    override ?? (import.meta.env?.DEV ? `${window.location.origin}/api/` : DEFAULT_API_BASE);
  return raw.endsWith('/') ? raw : raw + '/';
})();

/** Protocol version the client sends on the hub connection. Mirrors ApiVersion.Current. */
export const API_VERSION = 3;

export const HUB_PATH = 'hubs/aetherlove';
