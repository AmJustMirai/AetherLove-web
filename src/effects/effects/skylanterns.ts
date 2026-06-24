// Match effect "SkyLanterns" — web port of Screens/Match.SkyLanterns.Screen.cs.
// Sky Lanterns: a swarm of glowing paper lanterns drifts upward over a starry night while
// two larger avatar-lanterns rise together toward the top.

import type { MatchEffect, Scene } from '../types';
import type { Rgb } from '../draw';
import { avatarCircle, centerText, rgba } from '../draw';
import { clampedProgress, easeOutCubic, gradientRing, gradientText, lerp, lerpRgb } from '../fx';
import type { StringKey } from '@/i18n';
import { languageStore, translate } from '@/i18n';

function tr(key: StringKey): string {
  return translate(languageStore.get(), key);
}

interface Lantern {
  nx: number;
  baseY: number;
  scale: number;
  swayAmp: number;
  swayPh: number;
  speed: number;
  hue: number;
}

interface Star {
  nx: number;
  ny: number;
  r: number;
  ph: number;
}

export class SkyLanternsEffect implements MatchEffect {
  readonly name = 'SkyLanterns';
  private rise = 0;
  private settle = 0;
  private lanterns: Lantern[] = [];
  private stars: Star[] = [];

  onShow(s: Scene): void {
    this.rise = 0;
    this.settle = 0;
    // swayAmp and star r scale with canvas width (mirrors C# Px() calls).
    const px = s.w / 464;
    this.lanterns = Array.from({ length: 16 }, () => ({
      nx: Math.random(),
      baseY: Math.random(),
      scale: 0.45 + Math.random() * 0.7,
      swayAmp: (6 + Math.random() * 14) * px,
      swayPh: Math.random() * Math.PI * 2,
      speed: 0.05 + Math.random() * 0.08,
      hue: Math.random(),
    }));
    this.stars = Array.from({ length: 70 }, () => ({
      nx: Math.random(),
      ny: Math.random(),
      r: (0.5 + Math.random() * 1.4) * px,
      ph: Math.random() * Math.PI * 2,
    }));
  }

  draw(s: Scene): void {
    const { ctx, w, h, reduce, content } = s;
    const cx = w / 2;

    if (reduce) {
      this.rise = 1;
      this.settle = 1;
    } else {
      this.rise = clampedProgress(this.rise, s.dt, 0.85);
      if (this.rise > 0.55) this.settle = clampedProgress(this.settle, s.dt, 1.4);
    }

    drawNightSky(ctx, w, h, s.secondaryEnd, s.t, reduce);

    // Stars.
    for (const st of this.stars) {
      const tw = reduce ? 0.65 : 0.4 + 0.45 * Math.sin(s.t * 1.8 + st.ph);
      ctx.fillStyle = rgba([255, 247, 225], tw * 0.85);
      ctx.beginPath();
      ctx.arc(st.nx * w, st.ny * h, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    drawBackgroundLanterns(ctx, w, h, this.lanterns, s.t, reduce);

    const radius = 40;
    const driftStartY = h * 0.86;
    const restY = h * 0.46;
    const ey = reduce ? 1 : easeOutCubic(this.rise);
    const avY = lerp(driftStartY, restY, ey);

    const gap = lerp(96, 58, ey);
    const sway = reduce ? 0 : Math.sin(s.t * 0.9) * 7;
    const lx = cx - gap + sway * 0.4;
    const rx = cx + gap + sway * 0.4;

    drawAvatarLantern(ctx, lx, avY, radius, s.secondaryStart, content.ownAvatar, s.t, 0.3, reduce);
    drawAvatarLantern(ctx, rx, avY, radius, s.secondaryEnd, content.peerAvatar, s.t, 1.7, reduce);

    if (reduce) {
      ctx.strokeStyle = rgba(s.accent, 1);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lx, avY, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rx, avY, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const ringPhase = s.t * 1.4;
      gradientRing(ctx, lx, avY, radius + 3, 2.5, s.secondaryStart, s.secondaryEnd, ringPhase);
      gradientRing(ctx, rx, avY, radius + 3, 2.5, s.secondaryStart, s.secondaryEnd, -ringPhase);
    }

    if (this.settle > 0.01) {
      gradientText(
        ctx,
        cx,
        h * 0.105,
        tr('deck.match_its_a_match'),
        '800 38px "Bricolage Grotesque Variable", sans-serif',
        s.secondaryStart,
        s.secondaryEnd,
        reduce ? 0 : s.t * 1.5,
        this.settle
      );

      centerText(
        ctx,
        cx,
        h * 0.185,
        tr('deck.match_fx_lanterns'),
        '600 16px "Hanken Grotesk Variable", sans-serif',
        rgba(s.accentLight, this.settle * 0.9)
      );

      const nameY = avY + radius + 20;
      centerText(
        ctx,
        lx,
        nameY,
        content.ownName,
        '600 14px "Hanken Grotesk Variable", sans-serif',
        rgba([245, 237, 210], this.settle)
      );
      centerText(
        ctx,
        rx,
        nameY,
        content.peerName,
        '600 14px "Hanken Grotesk Variable", sans-serif',
        rgba([245, 237, 210], this.settle)
      );
    }
  }
}

function drawNightSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  secondaryEnd: Rgb,
  time: number,
  reduce: boolean
): void {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, rgba([8, 10, 28], 1));
  skyGrad.addColorStop(1, rgba([20, 15, 41], 1));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Warm horizon glow from rising lanterns.
  const horizonY = h * 0.72;
  const glow = reduce ? 0.16 : 0.16 + 0.04 * Math.sin(time * 0.7);
  for (let i = 0; i < 7; i++) {
    const rr = w * (0.5 + 0.16 * i);
    const a = glow * (1 - i / 7);
    ctx.fillStyle = rgba(secondaryEnd, a);
    ctx.beginPath();
    ctx.arc(w / 2, horizonY + rr * 0.55, rr, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBackgroundLanterns(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  lanterns: Lantern[],
  time: number,
  reduce: boolean
): void {
  for (const l of lanterns) {
    const prog = reduce ? l.baseY : (l.baseY + time * l.speed) % 1.0;
    const y = h * (1.08 - prog * 1.16);
    const sway = reduce ? 0 : Math.sin(time * 0.8 + l.swayPh) * l.swayAmp;
    const x = l.nx * w + sway;
    const sz = 13 * l.scale;

    const fadeEdge = h * 0.12;
    let fade = 1;
    if (y < fadeEdge) fade = Math.max(0, Math.min(1, y / fadeEdge));
    if (fade <= 0.01) continue;

    const warm: Rgb = lerpRgb([255, 158, 71], [255, 209, 107], l.hue);
    drawSmallLantern(ctx, x, y, sz, warm, fade * 0.85, time + l.swayPh, reduce);
  }
}

function drawSmallLantern(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sz: number,
  warm: Rgb,
  alpha: number,
  time: number,
  reduce: boolean
): void {
  // Glow rings.
  for (let i = 4; i >= 1; i--) {
    const rr = sz * (1.4 + 0.7 * i);
    const a = 0.1 * (1 - i / 5) * alpha;
    ctx.fillStyle = rgba(warm, a);
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lantern body (trapezoid).
  const bw = sz * 0.78;
  ctx.fillStyle = rgba(warm, alpha);
  ctx.beginPath();
  ctx.moveTo(cx - bw, cy - sz * 0.55);
  ctx.lineTo(cx + bw, cy - sz * 0.55);
  ctx.lineTo(cx + bw * 0.7, cy + sz * 0.9);
  ctx.lineTo(cx - bw * 0.7, cy + sz * 0.9);
  ctx.closePath();
  ctx.fill();

  // Cap (triangle).
  ctx.fillStyle = rgba(warm, alpha * 0.92);
  ctx.beginPath();
  ctx.moveTo(cx - bw, cy - sz * 0.55);
  ctx.lineTo(cx + bw, cy - sz * 0.55);
  ctx.lineTo(cx, cy - sz);
  ctx.closePath();
  ctx.fill();

  // Inner flame glow.
  const flameA = reduce ? 1 : 0.7 + 0.3 * Math.sin(time * 6);
  ctx.fillStyle = rgba([255, 245, 178], alpha * flameA);
  ctx.beginPath();
  ctx.arc(cx, cy + sz * 0.05, sz * 0.26, 0, Math.PI * 2);
  ctx.fill();
}

function drawAvatarLantern(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  glowTint: Rgb,
  img: HTMLImageElement | null,
  time: number,
  flamePh: number,
  reduce: boolean
): void {
  const halo = reduce ? 1 : 0.85 + 0.15 * Math.sin(time * 2.4 + flamePh);
  for (let i = 6; i >= 1; i--) {
    const rr = radius * (1.25 + 0.42 * i);
    const a = 0.13 * (1 - i / 7) * halo;
    ctx.fillStyle = rgba(glowTint, a);
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Canopy triangle above.
  const warm: Rgb = lerpRgb([255, 168, 77], glowTint, 0.5);
  ctx.fillStyle = rgba(warm, 0.55);
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 20);
  ctx.lineTo(cx - radius - 8, cy - 4);
  ctx.lineTo(cx + radius + 8, cy - 4);
  ctx.closePath();
  ctx.fill();

  // Hanging flame below.
  const flameY = cy + radius + 26;
  drawFlame(ctx, cx, flameY, 5, time, flamePh, reduce);

  avatarCircle(ctx, cx, cy, radius, img, rgba([255, 255, 255], 1), 0);
}

function drawFlame(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  time: number,
  ph: number,
  reduce: boolean
): void {
  const flick = reduce ? 1 : 0.82 + 0.18 * Math.sin(time * 8 + ph);
  ctx.fillStyle = rgba([255, 140, 51], 0.35 * flick);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba([255, 217, 115], 0.9 * flick);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba([255, 250, 217], flick);
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.25, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
}
