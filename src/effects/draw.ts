// Shared canvas drawing helpers for match effects — the web equivalents of the plugin's draw-list calls
// (Avatar, CenterText, ConfettiBurst). Kept dependency-free so each effect stays a small Draw() body.

export type Rgb = [number, number, number];

export function rgba([r, g, b]: Rgb, a: number): string {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Eased 0→1 progress that reaches 1 at `duration` seconds (mirrors AnimationHelper.ClampedProgress). */
export function progress(t: number, duration: number): number {
    return Math.min(1, t / duration);
}

export function easeOut(p: number): number {
    return 1 - Math.pow(1 - p, 3);
}

/** Draws an avatar clipped to a circle with an optional ring; falls back to a neutral disc while absent. */
export function avatarCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    img: HTMLImageElement | null,
    ringColor = 'rgba(255,255,255,1)',
    ringWidth = 3,
): void {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
    } else {
        ctx.fillStyle = '#555';
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
    if (ringWidth > 0) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.lineWidth = ringWidth;
        ctx.strokeStyle = ringColor;
        ctx.stroke();
    }
}

export function centerText(
    ctx: CanvasRenderingContext2D,
    cx: number,
    y: number,
    text: string,
    font: string,
    color: string,
): void {
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, cx, y);
}

// Festive confetti palette — ported from UiColors.ConfettiPalette (0x00BBGGRR → [r,g,b]).
export const CONFETTI_COLORS: Rgb[] = [
    [255, 120, 180],
    [200, 100, 255],
    [255, 200, 50],
    [80, 210, 190],
    [120, 230, 120],
    [255, 130, 100],
];

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rot: number;
    vrot: number;
    size: number;
    color: Rgb;
}

/** Web port of Widgets/ConfettiBurst.cs — gravity-pulled paper bits raining from the top. */
export class ConfettiBurst {
    private particles: Particle[] = [];

    reset(w: number, count = 90): void {
        this.particles = Array.from({length: count}, () => ({
            x: Math.random() * w,
            y: -Math.random() * 200 - 20,
            vx: (Math.random() - 0.5) * 60,
            vy: 80 + Math.random() * 120,
            rot: Math.random() * Math.PI,
            vrot: (Math.random() - 0.5) * 6,
            size: 5 + Math.random() * 7,
            color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
        }));
    }

    draw(ctx: CanvasRenderingContext2D, dt: number, h: number): void {
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rot += p.vrot * dt;
            if (p.y > h + 20) p.y = -20; // recycle
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = rgba(p.color, 0.9);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            ctx.restore();
        }
    }
}
