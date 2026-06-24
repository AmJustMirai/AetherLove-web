// Match effect "Aurora" — web port of Screens/Match.Aurora.Screen.cs.
// Liquid Aurora: stacked translucent aurora bands over a near-black sky, two frosted avatars
// linked by a flowing ribbon of light, drifting bokeh.

import type { MatchEffect, Scene } from '../types';
import type { Rgb } from '../draw';
import { avatarCircle, centerText, ConfettiBurst, rgba } from '../draw';
import { clampedProgress, gradientRing, lerp, lerpRgb } from '../fx';
import type { StringKey } from '@/i18n';
import { languageStore, translate } from '@/i18n';

function tr(key: StringKey): string {
  return translate(languageStore.get(), key);
}

interface Bokeh {
  nx: number;
  ny: number;
  r: number;
  ph: number;
  spd: number;
}

const BAND_COUNT = 5;
const RIBBON_SEGMENTS = 48;

export class AuroraEffect implements MatchEffect {
  readonly name = 'Aurora';
  private reveal = 0;
  private confetti = new ConfettiBurst();
  private bokeh: Bokeh[] = [];

  onShow(s: Scene): void {
    this.reveal = 0;
    this.confetti.reset(s.w);
    this.bokeh = Array.from({ length: 14 }, () => ({
      nx: Math.random(),
      ny: Math.random(),
      r: 5 + Math.random() * 16,
      ph: Math.random() * Math.PI * 2,
      spd: 0.02 + Math.random() * 0.05,
    }));
  }

  draw(s: Scene): void {
    const { ctx, w, h, reduce, content } = s;
    const cx = w / 2;
    const cy = h * 0.5;

    if (reduce) {
      this.reveal = 1;
    } else {
      this.reveal = clampedProgress(this.reveal, s.dt, 1.1);
    }

    // Deep near-black background with a tint wash from the theme.
    ctx.fillStyle = rgba([6, 4, 10], 1);
    ctx.fillRect(0, 0, w, h);

    // Subtle theme gradient wash across the top.
    const tint = ctx.createLinearGradient(0, 0, w, 0);
    tint.addColorStop(0, rgba(s.secondaryStart, 0.05));
    tint.addColorStop(1, rgba(s.secondaryEnd, 0.05));
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, w, h);

    drawAurora(ctx, w, h, s.secondaryStart, s.secondaryEnd, reduce ? 0 : s.t, this.reveal, reduce);
    drawBokeh(ctx, w, h, this.bokeh, s.accentLight, s.secondaryEnd, s.t, this.reveal, reduce);

    const radius = 46;
    const gap = 62;
    const lx = cx - gap - radius;
    const rx = cx + gap + radius;

    drawRibbon(ctx, lx, cy, rx, cy, s.secondaryStart, s.secondaryEnd, s.t, this.reveal, reduce);
    drawFrostedHalo(
      ctx,
      lx,
      cy,
      radius,
      s.secondaryStart,
      s.secondaryEnd,
      s.t,
      this.reveal,
      reduce
    );
    drawFrostedHalo(
      ctx,
      rx,
      cy,
      radius,
      s.secondaryStart,
      s.secondaryEnd,
      s.t,
      this.reveal,
      reduce
    );

    avatarCircle(ctx, lx, cy, radius, content.ownAvatar, rgba([255, 255, 255], 1), 0);
    avatarCircle(ctx, rx, cy, radius, content.peerAvatar, rgba([255, 255, 255], 1), 0);

    if (reduce) {
      ctx.strokeStyle = rgba(s.accentLight, 1);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(lx, cy, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rx, cy, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const ringPhase = s.t * 1.1;
      gradientRing(ctx, lx, cy, radius + 3, 1.8, s.secondaryStart, s.secondaryEnd, ringPhase);
      gradientRing(ctx, rx, cy, radius + 3, 1.8, s.secondaryStart, s.secondaryEnd, -ringPhase);
    }

    // Title — plain white with a gentle breath.
    const breathe = reduce ? 0.92 : 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(s.t * 1.4));
    const titleAlpha = this.reveal * breathe;
    ctx.font = '800 38px "Bricolage Grotesque Variable", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba([245, 247, 255], titleAlpha);
    ctx.fillText(tr('deck.match_its_a_match'), cx, h * 0.2);

    centerText(
      ctx,
      cx,
      h * 0.285,
      tr('deck.match_fx_aurora'),
      '600 16px "Hanken Grotesk Variable", sans-serif',
      rgba(s.accentLight, this.reveal * 0.85)
    );

    const nameAlpha = this.reveal;
    centerText(
      ctx,
      lx,
      cy + radius + 14,
      content.ownName,
      '600 14px "Hanken Grotesk Variable", sans-serif',
      rgba([230, 232, 242], nameAlpha)
    );
    centerText(
      ctx,
      rx,
      cy + radius + 14,
      content.peerName,
      '600 14px "Hanken Grotesk Variable", sans-serif',
      rgba([230, 232, 242], nameAlpha)
    );

    if (!reduce && this.reveal > 0.4) this.confetti.draw(ctx, s.dt, h);
  }
}

function drawAurora(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colorA: Rgb,
  colorB: Rgb,
  time: number,
  reveal: number,
  reduce: boolean
): void {
  const cols = 40;
  const step = w / cols;
  for (let band = 0; band < BAND_COUNT; band++) {
    const bandT = band / (BAND_COUNT - 1);
    const baseY = h * (0.3 + bandT * 0.42);
    const thickness = 34 + 20 * (1 - bandT);
    const col = lerpRgb(colorA, colorB, bandT);
    const alpha = (0.1 + 0.07 * (1 - bandT)) * reveal;
    const freq = 1.6 + band * 0.45;
    const phase = time * (0.35 + band * 0.12) + band * 1.3;

    let prevX = 0;
    let prevTop = waveY(baseY, 0, freq, phase, w, reduce);
    let prevBot = prevTop + thickness;

    for (let c = 1; c <= cols; c++) {
      const x = c * step;
      const yc = waveY(baseY, c / cols, freq, phase, w, reduce);
      const edgeFade = Math.sin((c / cols) * Math.PI);
      const segAlpha = alpha * (0.45 + 0.55 * edgeFade);

      ctx.fillStyle = rgba(col, segAlpha);
      ctx.beginPath();
      ctx.moveTo(prevX, prevTop);
      ctx.lineTo(x, yc);
      ctx.lineTo(x, yc + thickness);
      ctx.lineTo(prevX, prevBot);
      ctx.closePath();
      ctx.fill();

      prevX = x;
      prevTop = yc;
      prevBot = yc + thickness;
    }
  }
}

function waveY(
  baseY: number,
  nx: number,
  freq: number,
  phase: number,
  w: number,
  reduce: boolean
): number {
  if (reduce) return baseY + Math.sin(nx * freq * Math.PI * 2) * w * 0.02;
  const w1 = Math.sin(nx * freq * Math.PI * 2 + phase);
  const w2 = 0.5 * Math.sin(nx * freq * 1.9 * Math.PI * 2 - phase * 0.7);
  return baseY + (w1 + w2) * w * 0.035;
}

function drawBokeh(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bokeh: Bokeh[],
  accentLight: Rgb,
  secondaryEnd: Rgb,
  time: number,
  reveal: number,
  reduce: boolean
): void {
  for (const b of bokeh) {
    let driftY = reduce ? b.ny : (b.ny - time * b.spd) % 1;
    if (driftY < 0) driftY += 1;
    const swayX = reduce ? 0 : Math.sin(time * 0.4 + b.ph) * w * 0.02;
    const px = b.nx * w + swayX;
    const py = driftY * h;
    const twinkle = reduce ? 0.07 : 0.05 + 0.05 * (0.5 + 0.5 * Math.sin(time * 1.3 + b.ph));
    const col = lerpRgb(accentLight, secondaryEnd, b.nx);
    ctx.fillStyle = rgba(col, twinkle * reveal);
    ctx.beginPath();
    ctx.arc(px, py, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRibbon(
  ctx: CanvasRenderingContext2D,
  lx: number,
  ly: number,
  rx: number,
  ry: number,
  colorA: Rgb,
  colorB: Rgb,
  time: number,
  reveal: number,
  reduce: boolean
): void {
  const bow = 28;
  let prevX = lx;
  let prevY = ly;
  for (let i = 1; i <= RIBBON_SEGMENTS; i++) {
    const f = i / RIBBON_SEGMENTS;
    const x = lerp(lx, rx, f);
    const arch = Math.sin(f * Math.PI);
    const ripple = reduce ? 0 : Math.sin(f * Math.PI * 2 * 2 - time * 3) * 5;
    const y = lerp(ly, ry, f) - arch * bow + ripple * arch;
    const shimmer = reduce ? 0.55 : 0.5 + 0.5 * Math.sin(f * Math.PI * 2 - time * 2.4);
    const col = lerpRgb(colorA, colorB, shimmer);
    const glowAlpha = (0.35 + 0.45 * arch) * reveal;

    // Glow stroke.
    ctx.strokeStyle = rgba(col, glowAlpha * 0.4);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Core stroke.
    ctx.strokeStyle = rgba(col, glowAlpha);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();

    prevX = x;
    prevY = y;
  }
}

function drawFrostedHalo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  colorA: Rgb,
  colorB: Rgb,
  time: number,
  reveal: number,
  reduce: boolean
): void {
  const pulse = reduce ? 1 : 0.9 + 0.1 * Math.sin(time * 1.4);
  const rings = 4;
  const midCol = lerpRgb(colorA, colorB, 0.5);
  for (let i = rings; i >= 1; i--) {
    const rr = (radius + 10) * (1 + 0.16 * i) * pulse;
    const a = 0.08 * (1 - i / (rings + 1)) * reveal;
    ctx.fillStyle = rgba(midCol, a);
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = rgba([255, 255, 255], 0.05 * reveal);
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
  ctx.fill();
}
