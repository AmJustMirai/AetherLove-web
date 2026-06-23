// The shared rAF/canvas runner for match effects — the web equivalent of the per-frame Draw() loop in
// MatchScreen. Sizes the canvas to the design space at device-pixel resolution, resolves the active
// theme's accent from CSS vars, and drives the chosen effect each frame. Reduce-motion renders a single
// static end-frame instead of animating.

import {useEffect, useRef} from 'react';
import type {MatchContent, MatchEffect, Scene} from './types';
import {DESIGN} from '../ui/scale';
import {prefersReducedMotion} from './reduceMotion';

function readRgbVar(
    el: HTMLElement,
    name: string,
    fallback: [number, number, number]
): [number, number, number] {
    const raw = getComputedStyle(el).getPropertyValue(name).trim();
    const parts = raw.split(/\s+/).map(Number);
    return parts.length === 3 && parts.every((n) => !Number.isNaN(n))
        ? (parts as [number, number, number])
        : fallback;
}

export function MatchCanvas({effect, content}: { effect: MatchEffect; content: MatchContent }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = DESIGN.width * dpr;
        canvas.height = DESIGN.height * dpr;

        const accent = readRgbVar(canvas, '--al-accent', [186, 107, 201]);
        const accentLight = readRgbVar(canvas, '--al-accent-light', [217, 143, 230]);
        const secondaryStart = readRgbVar(canvas, '--al-secondary-start', [158, 102, 235]);
        const secondaryEnd = readRgbVar(canvas, '--al-secondary-end', [250, 115, 199]);
        const reduce = prefersReducedMotion();

        const baseScene: Omit<Scene, 't' | 'dt'> = {
            ctx,
            w: DESIGN.width,
            h: DESIGN.height,
            reduce,
            content,
            accent,
            accentLight,
            secondaryStart,
            secondaryEnd,
        };

        let raf = 0;
        const startedAt = performance.now();
        let last = startedAt;

        const frame = (now: number) => {
            const t = (now - startedAt) / 1000;
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, DESIGN.width, DESIGN.height);
            effect.draw({...baseScene, t, dt});

            if (!reduce) raf = requestAnimationFrame(frame);
        };

        effect.onShow({...baseScene, t: 0, dt: 0});
        if (reduce) {
            // One static frame at a settled time so the celebration is still legible.
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            effect.draw({...baseScene, t: 3, dt: 0});
        } else {
            raf = requestAnimationFrame(frame);
        }

        return () => cancelAnimationFrame(raf);
    }, [effect, content]);

    return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full"/>;
}
