// Shared match-effect helpers — web equivalents of MatchFx.cs utilities not covered by draw.ts.
// Used by the second-pass effects (Synthwave, Aurora, Supernova, Kaleidoscope, Tarot, SkyLanterns).
// All helpers are dependency-free and operate on the same Rgb type as draw.ts.

import type { Rgb } from './draw';
import { rgba } from './draw';

/** Linear interpolation between two RGB tuples (components 0-255). */
export function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Ease-out cubic (1 – (1–x)³). */
export function easeOutCubic(x: number): number {
  const inv = 1 - Math.max(0, Math.min(1, x));
  return 1 - inv * inv * inv;
}

/** Ease-out with back-overshoot (c1 = 1.70158) — mirrors MatchScreen's EaseOutBack. */
export function easeOutBack(x: number): number {
  x = Math.max(0, Math.min(1, x));
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const p = x - 1;
  return 1 + c3 * p * p * p + c1 * p * p;
}

/** Smoothstep 0→1. */
export function smooth01(x: number): number {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
}

/** Clamped delta-time integrator — mirrors AnimationHelper.ClampedProgress. Increments `ref` by
 *  `dt / duration` and clamps to [0,1]. Returns the new value; update the field at the call site. */
export function clampedProgress(current: number, dt: number, duration: number): number {
  return Math.min(1, current + dt / duration);
}

/** Lerp between two scalar values. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Conic gradient ring — mirrors MatchFx.GradientRing.
 * Strokes a circle whose fill sweeps c0→c1→c0 around the circumference, shifted by `phase`.
 * Uses a sinusoidal colour blend matching the C# per-segment sin(angle – phase) formula.
 */
export function gradientRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  lineWidth: number,
  c0: Rgb,
  c1: Rgb,
  phase: number
): void {
  // createConicGradient: well-supported in all modern browsers (Chrome 99+, FF 112+, Safari 16.4+).
  const grad = ctx.createConicGradient(-Math.PI / 2 - phase, x, y);
  // 8-stop sinusoidal approximation of C#'s 0.5+0.5·sin(angle–phase) blend.
  const stops = 8;
  for (let i = 0; i <= stops; i++) {
    const t = i / stops;
    const blend = Math.max(0, Math.min(1, 0.5 + 0.5 * Math.sin(t * Math.PI * 2)));
    grad.addColorStop(t, rgba(lerpRgb(c0, c1, blend), 1));
  }
  ctx.save();
  ctx.strokeStyle = grad;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Gradient text horizontally centred on cx — web port of MatchFx.GradientText.
 * Applies a sweeping linear gradient matching the C# sinusoidal vertex-recolour formula.
 */
export function gradientText(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  text: string,
  font: string,
  c0: Rgb,
  c1: Rgb,
  phase: number,
  alpha = 1
): void {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width;
  const x0 = cx - w / 2;
  const grad = ctx.createLinearGradient(x0, y, x0 + w, y);
  const stops = 8;
  for (let i = 0; i <= stops; i++) {
    const t = i / stops;
    const blend = Math.max(0, Math.min(1, 0.5 + 0.5 * Math.sin(t * Math.PI * 2 - phase)));
    grad.addColorStop(t, rgba(lerpRgb(c0, c1, blend), alpha));
  }
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, y);
}

/** Draws a small heart glyph at (cx, cy) of half-size s — mirrors MatchTarot's DrawHeartGlyph. */
export function heartGlyph(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  color: string
): void {
  const lobe = s * 0.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx - lobe, cy - lobe * 0.5, lobe, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + lobe, cy - lobe * 0.5, lobe, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - lobe * 0.25);
  ctx.lineTo(cx + s, cy - lobe * 0.25);
  ctx.lineTo(cx, cy + s);
  ctx.closePath();
  ctx.fill();
}

/** Draws a four-point sparkle star at (cx, cy) — mirrors MatchTarot's DrawSparkle. */
export function sparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx, cy + r);
  ctx.stroke();
  const d = r * 0.5;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - d, cy - d);
  ctx.lineTo(cx + d, cy + d);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - d, cy + d);
  ctx.lineTo(cx + d, cy - d);
  ctx.stroke();
}
