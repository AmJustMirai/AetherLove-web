/// <reference types="vitest" />
import {defineConfig, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath, URL} from 'node:url';

// VITE_API_BASE overrides the AetherLove server origin (defaults to production).
//
// The AetherLove server doesn't send CORS headers for localhost, so a direct browser fetch to
// https://api.aetherlove.space fails preflight. In dev we route REST + the SignalR hub through this
// same-origin proxy instead (config.ts points API_BASE at /api here), which sidesteps CORS entirely.
// `ws: true` is required so the MessagePack hub's WebSocket upgrade is forwarded.
const PROXY_TARGET = process.env.VITE_PROXY_TARGET ?? 'https://api.aetherlove.space';

// Content-Security-Policy injected into index.html for *production builds only* (apply: 'build').
// Deliberately not applied in dev: a static meta CSP would block the Vite HMR websocket and the
// same-origin /api proxy. There is no server in this repo, so a meta tag is our only delivery
// mechanism — which means frame-ancestors / X-Frame-Options (clickjacking) can't be set here and
// must be added as a real response header at the static host (follow-up, out of scope).
//
// Notable allowances:
//  - style-src 'unsafe-inline' is required: the app uses React inline style={{}} objects throughout
//    (theme vars, AppShell gradients) and Framer Motion injects inline styles. No nonce path exists
//    for inline style objects.
//  - img-src blob: data: — avatars/photos are blob object URLs (ui/image.ts), the upload preview is
//    a data:image/jpeg (ui/photo.ts).
//  - connect-src lists the prod hub over https + wss. If a deployment overrides VITE_API_BASE to a
//    different origin, this must be widened to match (otherwise REST + SignalR will be CSP-blocked).
const CSP = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "connect-src 'self' https://api.aetherlove.space wss://api.aetherlove.space",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
].join('; ');

function cspMeta(): Plugin {
    return {
        name: 'inject-csp-meta',
        apply: 'build',
        transformIndexHtml(html) {
            return html.replace(
                '</title>',
                `</title>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}"/>`
            );
        },
    };
}

export default defineConfig({
    plugins: [react(), cspMeta()],
    resolve: {
        alias: {'@': fileURLToPath(new URL('./src', import.meta.url))},
    },
    server: {
        proxy: {
            '/api': {
                target: PROXY_TARGET,
                changeOrigin: true,
                secure: true,
                ws: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    },
});
