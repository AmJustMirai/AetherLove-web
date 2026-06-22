/// <reference types="vitest" />
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath, URL} from 'node:url';

// VITE_API_BASE overrides the AetherLove server origin (defaults to production).
//
// The AetherLove server doesn't send CORS headers for localhost, so a direct browser fetch to
// https://api.aetherlove.space fails preflight. In dev we route REST + the SignalR hub through this
// same-origin proxy instead (config.ts points API_BASE at /api here), which sidesteps CORS entirely.
// `ws: true` is required so the MessagePack hub's WebSocket upgrade is forwarded.
const PROXY_TARGET = process.env.VITE_PROXY_TARGET ?? 'https://api.aetherlove.space';

export default defineConfig({
    plugins: [react()],
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
