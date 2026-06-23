// Match effect "Firework" — web port of Screens/Match.Firework.Screen.cs. Staggered bursts arc up and
// bloom into gravity-pulled rings of sparks over a night sky, lighting the two avatars below.

import type {MatchEffect, Scene} from '../types';
import {avatarCircle, centerText, CONFETTI_COLORS, easeOut, progress, rgba} from '../draw';

interface Burst {
    x: number;
    y: number;
    start: number; // launch time (s)
    color: [number, number, number];
}

const SPARKS = 28;

export class FireworkEffect implements MatchEffect {
    readonly name = 'Firework';
    private bursts: Burst[] = [];

    onShow(s: Scene): void {
        this.bursts = Array.from({length: 5}, (_, i) => ({
            x: s.w * (0.2 + Math.random() * 0.6),
            y: s.h * (0.2 + Math.random() * 0.25),
            start: i * 0.45,
            color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
        }));
    }

    draw(s: Scene): void {
        const {ctx, w, h, reduce, content} = s;

        ctx.fillStyle = '#06040d';
        ctx.fillRect(0, 0, w, h);

        for (const b of this.bursts) {
            const age = reduce ? 1.2 : s.t - b.start;
            if (age < 0) continue;
            const explodeAt = 0.7;
            if (age < explodeAt && !reduce) {
                // Rising trail.
                const rise = age / explodeAt;
                const ty = h * 0.95 - (h * 0.95 - b.y) * easeOut(rise);
                ctx.fillStyle = rgba(b.color, 1);
                ctx.beginPath();
                ctx.arc(b.x, ty, 2.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Bloom into a spark ring.
                const p = reduce ? 0.5 : Math.min(1, (age - explodeAt) / 1.1);
                const radius = p * 90;
                const fade = 1 - p;
                for (let i = 0; i < SPARKS; i++) {
                    const ang = (i / SPARKS) * Math.PI * 2;
                    const sx = b.x + Math.cos(ang) * radius;
                    const sy = b.y + Math.sin(ang) * radius + p * p * 40; // gravity droop
                    ctx.fillStyle = rgba(b.color, fade);
                    ctx.beginPath();
                    ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        const cx = w / 2;
        const cy = h * 0.62;
        const textA = reduce ? 1 : easeOut(progress(s.t, 1.0));
        centerText(
            ctx,
            cx,
            h * 0.16,
            "It's a match!",
            '800 36px "Bricolage Grotesque Variable", sans-serif',
            rgba([255, 255, 255], textA)
        );

        const r = 48;
        avatarCircle(ctx, cx - r - 12, cy, r, content.ownAvatar);
        avatarCircle(ctx, cx + r + 12, cy, r, content.peerAvatar);
        centerText(
            ctx,
            cx,
            cy + r + 26,
            `${content.ownName}  &  ${content.peerName}`,
            '600 15px "Hanken Grotesk Variable", sans-serif',
            rgba(s.accentLight, textA)
        );
    }
}
