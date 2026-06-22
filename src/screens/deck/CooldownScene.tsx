// Web port of Screens/CooldownScene.cs — the night-sky pegasus scene drawn over the deck's empty states
// (slot cooldown and an empty candidate pool). Faithful Canvas2D translation of the ImGui draw-list calls:
// a gradient sky, twinkling stars, a glowing moon, drifting clouds, a stylised winged horse trailing
// stardust, plus the heading / body / timer-pill / error overlay. Reduce-motion renders a settled frame.

import {useEffect, useRef} from 'react';
import {prefersReducedMotion} from '../../effects/reduceMotion';

type Rgb = [number, number, number];
const rgba = ([r, g, b]: Rgb, a: number) => `rgba(${r}, ${g}, ${b}, ${a})`;

// Palette (from CooldownScene.cs, 0..1 floats → 0..255).
const SkyTop: Rgb = [18, 15, 41];
const SkyMid: Rgb = [31, 26, 66];
const SkyLow: Rgb = [13, 10, 28];
const MoonCore: Rgb = [252, 245, 219];
const MoonGlow: Rgb = [235, 214, 158];
const Coat: Rgb = [33, 28, 61];
const CoatDeep: Rgb = [20, 18, 43];
const WingNear: Rgb = [51, 46, 92];
const WingFar: Rgb = [31, 28, 61];
const Silver: Rgb = [219, 224, 250];
const Violet: Rgb = [158, 133, 235];
const Gold: Rgb = [255, 219, 143];
const Cream: Rgb = [245, 240, 252];
const BodyText: Rgb = [214, 219, 245];
const Danger: Rgb = [242, 140, 140];

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
const mix = (a: Rgb, b: Rgb, f: number): Rgb => [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];

function ellipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, hw: number, hh: number, fill: string) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, hw, hh, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
}

function circle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
}

function line(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, w: number) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.stroke();
}

function tri(ctx: CanvasRenderingContext2D, a: [number, number], b: [number, number], c: [number, number], fill: string) {
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.lineTo(...c);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
}

function quad(ctx: CanvasRenderingContext2D, a: number[], b: number[], c: number[], d: number[], fill: string) {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(c[0], c[1]);
    ctx.lineTo(d[0], d[1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
}

interface Props {
    heading: string;
    body: string;
    timer?: string | null;
    error?: string | null;
}

export function CooldownScene({heading, body, timer, error}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Refs so the rAF loop reads current text without restarting.
    const props = useRef<Props>({heading, body, timer, error});
    props.current = {heading, body, timer, error};

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const reduce = prefersReducedMotion();

        let raf = 0;
        let settle = 0;
        let last = performance.now();
        const start = last;

        const draw = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            const time = (now - start) / 1000;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const W = canvas.clientWidth || 360;
            const H = canvas.clientHeight || 560;
            if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
                canvas.width = W * dpr;
                canvas.height = H * dpr;
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);

            settle = reduce ? 1 : Math.min(1, settle + dt / 1.4);
            const anim = reduce ? 0 : time;
            const cx = W * 0.5;

            drawSky(ctx, W, H);
            drawStars(ctx, W, H, time, reduce, settle);
            drawMoon(ctx, cx + 70, H * 0.31, 44, anim, settle);
            drawClouds(ctx, W, H, time, reduce, settle);

            const flap = reduce ? 0.35 : Math.sin(time * 1.2);
            const bob = reduce ? 0 : -flap * 10;
            const hc: [number, number] = [cx - 8, H * 0.47 + bob];
            drawStardust(ctx, hc, time, reduce, settle);
            drawHorse(ctx, hc, flap, time, reduce, settle);

            drawHeading(ctx, cx, 44, props.current.heading, settle);
            drawBody(ctx, cx, H - 110, W - 72, props.current.body, settle);
            if (props.current.timer) drawTimerPill(ctx, cx, H - 58, props.current.timer, anim, settle);
            if (props.current.error) drawError(ctx, cx, H - 26, W - 72, props.current.error, settle);

            if (!reduce) raf = requestAnimationFrame(draw);
        };

        if (reduce) {
            settle = 1;
            requestAnimationFrame(draw);
        } else {
            raf = requestAnimationFrame(draw);
        }
        return () => cancelAnimationFrame(raf);
    }, []);

    return <canvas ref={canvasRef} className="h-full w-full"/>;
}

function drawSky(ctx: CanvasRenderingContext2D, W: number, H: number) {
    let g = ctx.createLinearGradient(0, 0, 0, H * 0.5);
    g.addColorStop(0, rgba(SkyTop, 1));
    g.addColorStop(1, rgba(SkyMid, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H * 0.5);
    g = ctx.createLinearGradient(0, H * 0.5, 0, H);
    g.addColorStop(0, rgba(SkyMid, 1));
    g.addColorStop(1, rgba(SkyLow, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.5, W, H * 0.5);
}

const SX = [0.07, 0.18, 0.29, 0.41, 0.52, 0.63, 0.71, 0.83, 0.91, 0.13, 0.37, 0.58, 0.78, 0.96];
const SY = [0.12, 0.3, 0.08, 0.22, 0.4, 0.15, 0.34, 0.2, 0.46, 0.5, 0.55, 0.66, 0.6, 0.72];

function drawStars(ctx: CanvasRenderingContext2D, W: number, H: number, time: number, reduce: boolean, settle: number) {
    for (let i = 0; i < SX.length; i++) {
        const x = SX[i] * W;
        const y = SY[i] * H;
        const twinkle = reduce ? 0.6 : 0.45 + 0.45 * Math.sin(time * 1.6 + i * 1.7);
        const a = twinkle * settle;
        const r = 1.1 + SX[i] * 1.4;
        circle(ctx, x, y, r, rgba([255, 250, 235], a));
        if (i % 4 === 0) {
            const spike = r * (reduce ? 2.2 : 2.0 + 0.8 * Math.sin(time * 2 + i));
            const sc = rgba([255, 250, 235], a * 0.55);
            line(ctx, x - spike, y, x + spike, y, sc, 1);
            line(ctx, x, y - spike, x, y + spike, sc, 1);
        }
    }
}

function drawMoon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, anim: number, settle: number) {
    const pulse = 1 + 0.03 * Math.sin(anim * 0.8);
    for (let i = 6; i >= 1; i--) {
        const f = i / 6;
        circle(ctx, cx, cy, radius * (1 + f * 1.5) * pulse, rgba(MoonGlow, 0.13 * (1 - f) * settle));
    }
    circle(ctx, cx, cy, radius * pulse, rgba(MoonGlow, settle));
    circle(ctx, cx, cy, radius * 0.92 * pulse, rgba(MoonCore, settle));
    const cc = rgba(MoonGlow, 0.5 * settle);
    circle(ctx, cx - radius * 0.3, cy - radius * 0.22, radius * 0.16, cc);
    circle(ctx, cx + radius * 0.24, cy + radius * 0.1, radius * 0.12, cc);
    circle(ctx, cx + radius * 0.04, cy + radius * 0.4, radius * 0.09, cc);
}

function drawClouds(ctx: CanvasRenderingContext2D, W: number, H: number, time: number, reduce: boolean, settle: number) {
    drawCloud(ctx, W, H, 0.2, 0.4, 56, time * 0.01, 0.1, reduce, settle);
    drawCloud(ctx, W, H, 0.7, 0.66, 72, time * 0.014, 0.08, reduce, settle);
}

function drawCloud(ctx: CanvasRenderingContext2D, W: number, H: number, fx: number, fy: number, scale: number, drift: number, alpha: number, reduce: boolean, settle: number) {
    const driftX = reduce ? 0 : (((drift % 1) - 0.5) * 40);
    const cx = fx * W + driftX;
    const cy = fy * H;
    const col = rgba([140, 143, 189], alpha * settle);
    ellipse(ctx, cx - scale * 0.55, cy + scale * 0.1, scale * 0.5, scale * 0.3, col);
    ellipse(ctx, cx, cy - scale * 0.06, scale * 0.62, scale * 0.4, col);
    ellipse(ctx, cx + scale * 0.55, cy + scale * 0.12, scale * 0.46, scale * 0.28, col);
    ellipse(ctx, cx + scale * 0.05, cy + scale * 0.2, scale * 0.8, scale * 0.24, col);
}

function drawStardust(ctx: CanvasRenderingContext2D, hc: [number, number], time: number, reduce: boolean, settle: number) {
    const root: [number, number] = [hc[0] - 70, hc[1] - 6];
    const count = 16;
    for (let i = 0; i < count; i++) {
        const f = i / (count - 1);
        const px = root[0] - f * 120;
        const wave = Math.sin(f * 6 + (reduce ? 0 : time * 1.5)) * 10 * f;
        const py = root[1] + f * 34 + wave;
        const fade = (1 - f) * settle;
        const tw = reduce ? 0.7 : 0.4 + 0.6 * Math.abs(Math.sin(time * 3 + i * 1.3));
        const a = fade * tw * 0.9;
        const r = 2.4 * (1 - 0.5 * f);
        circle(ctx, px, py, r, rgba(mix(Silver, Violet, f), a));
        if (i % 3 === 0) {
            const sp = r * 2.4;
            const sc = rgba(Cream, a * 0.6);
            line(ctx, px - sp, py, px + sp, py, sc, 1);
            line(ctx, px, py - sp, px, py + sp, sc, 1);
        }
    }
}

function drawHorse(ctx: CanvasRenderingContext2D, center: [number, number], flap: number, time: number, reduce: boolean, settle: number) {
    const coat = rgba(Coat, settle);
    const coatDeep = rgba(CoatDeep, settle);
    const [x, y] = center;
    const shoulder: [number, number] = [x + 8, y - 6];

    drawTail(ctx, center, time, reduce, coatDeep);
    drawWing(ctx, shoulder, flap * 0.85 + 0.05, WingFar, Silver, 0.55, settle, true);
    drawBodySilhouette(ctx, center, coat, coatDeep, settle);

    const neckBase: [number, number] = [x + 40, y - 16];
    const poll: [number, number] = [x + 76, y - 54];
    drawNeck(ctx, neckBase, poll, coat);
    drawMane(ctx, neckBase, poll, time, reduce, coatDeep);
    drawHead(ctx, poll, coat, settle);
    drawLegs(ctx, center, coat, coatDeep);
    drawWing(ctx, shoulder, flap, WingNear, Cream, 1, settle, false);
}

function drawBodySilhouette(ctx: CanvasRenderingContext2D, [x, y]: [number, number], coat: string, coatDeep: string, settle: number) {
    ellipse(ctx, x, y, 58, 30, coat);
    ellipse(ctx, x - 34, y + 2, 30, 26, coatDeep);
    ellipse(ctx, x + 34, y - 4, 28, 24, coat);
    ctx.beginPath();
    ctx.moveTo(x - 48, y - 18);
    ctx.bezierCurveTo(x - 10, y - 34, x + 30, y - 30, x + 54, y - 14);
    ctx.strokeStyle = rgba(Silver, 0.3 * settle);
    ctx.lineWidth = 2;
    ctx.stroke();
}

function norm(dx: number, dy: number): [number, number] {
    const l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
}

function drawNeck(ctx: CanvasRenderingContext2D, base: [number, number], poll: [number, number], coat: string) {
    const [dx, dy] = norm(poll[0] - base[0], poll[1] - base[1]);
    const perp: [number, number] = [-dy, dx];
    const bh = 24, th = 14;
    quad(
        ctx,
        [base[0] + perp[0] * bh, base[1] + perp[1] * bh],
        [base[0] - perp[0] * bh, base[1] - perp[1] * bh],
        [poll[0] - perp[0] * th, poll[1] - perp[1] * th],
        [poll[0] + perp[0] * th, poll[1] + perp[1] * th],
        coat,
    );
}

function drawHead(ctx: CanvasRenderingContext2D, poll: [number, number], coat: string, settle: number) {
    const jaw: [number, number] = [poll[0] + 3, poll[1] + 7];
    ellipse(ctx, jaw[0], jaw[1], 15, 13, coat);
    const [mdx, mdy] = norm(0.72, 0.7);
    const muzzle: [number, number] = [jaw[0] + mdx * 24, jaw[1] + mdy * 24];
    const perp: [number, number] = [-mdy, mdx];
    quad(
        ctx,
        [jaw[0] + perp[0] * 10, jaw[1] + perp[1] * 10],
        [jaw[0] - perp[0] * 10, jaw[1] - perp[1] * 10],
        [muzzle[0] - perp[0] * 6.5, muzzle[1] - perp[1] * 6.5],
        [muzzle[0] + perp[0] * 6.5, muzzle[1] + perp[1] * 6.5],
        coat,
    );
    ellipse(ctx, muzzle[0], muzzle[1], 8, 6.5, coat);
    const [edx, edy] = norm(-0.2, -1);
    const ep: [number, number] = [-edy, edx];
    drawEar(ctx, [poll[0], poll[1] - 2], [edx, edy], ep, 16, 6, coat);
    drawEar(ctx, [poll[0] + 11, poll[1]], [edx, edy], ep, 14, 5.5, coat);
    circle(ctx, jaw[0] + 4, jaw[1] - 3, 2.4, rgba(Silver, 0.9 * settle));
    line(ctx, poll[0] + 12, poll[1] - 2, muzzle[0] + 2, muzzle[1] - 2, rgba(Silver, 0.4 * settle), 1.6);
}

function drawEar(ctx: CanvasRenderingContext2D, base: [number, number], dir: [number, number], perp: [number, number], len: number, half: number, coat: string) {
    tri(ctx, [base[0] + perp[0] * half, base[1] + perp[1] * half], [base[0] - perp[0] * half, base[1] - perp[1] * half], [base[0] + dir[0] * len, base[1] + dir[1] * len], coat);
}

function drawMane(ctx: CanvasRenderingContext2D, base: [number, number], poll: [number, number], time: number, reduce: boolean, coat: string) {
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        const ox = lerp(poll[0] - 8, base[0] - 2, f);
        const oy = lerp(poll[1] - 2, base[1] - 18, f);
        const sway = reduce ? 0 : Math.sin(time * 1.4 + f * 3) * 4;
        const len = 20 * (0.7 + 0.5 * f);
        tri(ctx, [ox - 3, oy], [ox + 3, oy], [ox - 12 - f * 8 + sway, oy + len * 0.6], coat);
    }
}

function drawTail(ctx: CanvasRenderingContext2D, [x, y]: [number, number], time: number, reduce: boolean, coat: string) {
    const root: [number, number] = [x - 56, y - 6];
    const strands = 6;
    for (let i = 0; i < strands; i++) {
        const spread = (i - (strands - 1) * 0.5) * 4;
        const w1 = reduce ? 3 : Math.sin(time * 1.3 + i * 0.4) * 5;
        const w2 = reduce ? 6 : Math.sin(time * 1.3 + i * 0.4 - 0.7) * 9;
        ctx.beginPath();
        ctx.moveTo(root[0], root[1] + spread * 0.3);
        ctx.bezierCurveTo(
            root[0] - 26, root[1] + 16 + spread * 0.8 + w1,
            root[0] - 42, root[1] + 38 + spread * 1.2 + w2,
            root[0] - 52, root[1] + 64 + spread * 1.6 + w2 * 1.2,
        );
        ctx.strokeStyle = coat;
        ctx.lineWidth = 5 - i * 0.5;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

function drawLegs(ctx: CanvasRenderingContext2D, [x, y]: [number, number], coat: string, coatDeep: string) {
    const bone = (hip: number[], dxk: number, dxh: number, col: string, uw: number, lw: number) => {
        const knee = [hip[0] + dxk, hip[1] + 20];
        const hoof = [knee[0] + dxh, knee[1] + 20];
        line(ctx, hip[0], hip[1], knee[0], knee[1], col, uw);
        line(ctx, knee[0], knee[1], hoof[0], hoof[1], col, lw);
        circle(ctx, hoof[0], hoof[1], lw * 0.7, col);
    };
    bone([x + 30, y + 20], 4, -2, coatDeep, 7.5, 5.5);
    bone([x - 30, y + 20], -4, 2, coatDeep, 8, 5.5);
    // Near legs use a longer 24px segment; approximate with the same helper offset.
    const nearBone = (hip: number[], dxk: number, dxh: number, col: string, uw: number, lw: number) => {
        const knee = [hip[0] + dxk, hip[1] + 24];
        const hoof = [knee[0] + dxh, knee[1] + 24];
        line(ctx, hip[0], hip[1], knee[0], knee[1], col, uw);
        line(ctx, knee[0], knee[1], hoof[0], hoof[1], col, lw);
        circle(ctx, hoof[0], hoof[1], lw * 0.7, col);
    };
    nearBone([x + 38, y + 16], 5, -3, coat, 9.5, 6.5);
    nearBone([x - 38, y + 14], -5, 3, coat, 10, 6.5);
}

function drawWing(ctx: CanvasRenderingContext2D, shoulder: [number, number], flap: number, baseCol: Rgb, edgeCol: Rgb, alphaScale: number, settle: number, far: boolean) {
    const sweep = lerp(-0.55, 0.45, 0.5 + 0.5 * flap);
    const feathers = 7;
    const spanLen = 96 * (far ? 0.82 : 1);
    const baseAng = -2.55 + sweep;
    const spread = 1.05;
    const origin: [number, number] = [shoulder[0] + (far ? -6 : 4), shoulder[1] + (far ? -4 : 0)];
    const tips: [number, number][] = [];
    for (let i = 0; i < feathers; i++) {
        const f = i / (feathers - 1);
        const ang = baseAng + (f - 0.5) * spread - sweep * 0.4 * f;
        const len = spanLen * (0.62 + 0.55 * Math.sin(f * Math.PI * 0.92));
        tips.push([origin[0] + Math.cos(ang) * len, origin[1] + Math.sin(ang) * len]);
    }
    for (let i = 0; i < feathers - 1; i++) {
        const f = i / (feathers - 1);
        const shade = mix(baseCol, [baseCol[0] * 1.25, baseCol[1] * 1.25, baseCol[2] * 1.25], f);
        const col = rgba(shade, settle * alphaScale);
        const rootA: [number, number] = [origin[0] + (tips[i][0] - origin[0]) * 0.16, origin[1] + (tips[i][1] - origin[1]) * 0.16];
        const rootB: [number, number] = [origin[0] + (tips[i + 1][0] - origin[0]) * 0.16, origin[1] + (tips[i + 1][1] - origin[1]) * 0.16];
        tri(ctx, rootA, tips[i], tips[i + 1], col);
        tri(ctx, rootA, tips[i + 1], rootB, col);
    }
    ctx.beginPath();
    for (let i = 0; i < feathers; i++) ctx[i === 0 ? 'moveTo' : 'lineTo'](tips[feathers - 1 - i][0], tips[feathers - 1 - i][1]);
    ctx.lineTo(origin[0], origin[1]);
    ctx.closePath();
    ctx.fillStyle = rgba([baseCol[0] * 0.9, baseCol[1] * 0.9, baseCol[2] * 0.9], settle * alphaScale);
    ctx.fill();
    const edge = rgba(edgeCol, (far ? 0.4 : 0.7) * settle * alphaScale);
    line(ctx, origin[0], origin[1], tips[0][0], tips[0][1], edge, 2);
    line(ctx, tips[0][0], tips[0][1], tips[1][0], tips[1][1], edge, 2);
}

function drawHeading(ctx: CanvasRenderingContext2D, cx: number, y: number, heading: string, settle: number) {
    ctx.font = '700 26px "Bricolage Grotesque Variable", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = rgba(Cream, settle);
    ctx.fillText(heading, cx, y);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, wrap: number): string[] {
    const out: string[] = [];
    let cur = '';
    for (const word of text.split(' ')) {
        const probe = cur.length === 0 ? word : `${cur} ${word}`;
        if (ctx.measureText(probe).width > wrap && cur.length > 0) {
            out.push(cur);
            cur = word;
        } else cur = probe;
    }
    if (cur.length > 0) out.push(cur);
    return out;
}

function drawBody(ctx: CanvasRenderingContext2D, cx: number, bottomY: number, wrap: number, body: string, settle: number) {
    ctx.font = '500 15px "Hanken Grotesk Variable", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const lineH = 22;
    const lines = wrapLines(ctx, body, wrap);
    const topY = bottomY - lines.length * lineH;
    roundRect(ctx, cx - wrap * 0.5 - 16, topY - 10, wrap + 32, lines.length * lineH + 20, 12);
    ctx.fillStyle = rgba([15, 15, 36], 0.5 * settle);
    ctx.fill();
    ctx.strokeStyle = rgba(Violet, 0.25 * settle);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = rgba(BodyText, settle);
    lines.forEach((l, i) => ctx.fillText(l, cx, topY + i * lineH));
}

function drawError(ctx: CanvasRenderingContext2D, cx: number, topY: number, wrap: number, error: string, settle: number) {
    ctx.font = '500 13px "Hanken Grotesk Variable", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = rgba(Danger, settle);
    wrapLines(ctx, error, wrap).forEach((l, i) => ctx.fillText(l, cx, topY + i * 18));
}

function drawTimerPill(ctx: CanvasRenderingContext2D, cx: number, y: number, timer: string, anim: number, settle: number) {
    ctx.font = '600 16px "Hanken Grotesk Variable", system-ui, sans-serif';
    const clock = '🕒 ';
    const text = clock + timer;
    const textW = ctx.measureText(text).width;
    const padX = 20, padY = 11;
    const pillW = textW + padX * 2;
    const pillH = 16 + padY * 2;
    const x = cx - pillW * 0.5;
    const top = y - pillH * 0.5;
    const round = pillH * 0.5;
    const glow = 0.5 + 0.5 * Math.sin(anim * 1.6);
    roundRect(ctx, x - 5, top - 5, pillW + 10, pillH + 10, round + 5);
    ctx.fillStyle = rgba(Violet, 0.2 * glow * settle);
    ctx.fill();
    roundRect(ctx, x, top, pillW, pillH, round);
    ctx.fillStyle = rgba([38, 33, 77], settle);
    ctx.fill();
    ctx.strokeStyle = rgba(Gold, 0.6 * settle);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(Cream, settle);
    ctx.fillText(text, cx, y);
}
