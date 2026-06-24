// Match effect "Supernova" — web port of Screens/Match.Supernova.Screen.cs.
// Supernova Heartbeat: a pulsing heart fires expanding shockwaves over a rotating sunburst
// while two avatars orbit it.

import type { MatchEffect, Scene } from '../types';
import type { Rgb } from '../draw';
import { avatarCircle, centerText, ConfettiBurst, rgba } from '../draw';
import { clampedProgress, easeOutBack, gradientRing, gradientText, lerpRgb } from '../fx';
import type { StringKey } from '@/i18n';
import { languageStore, translate } from '@/i18n';

function tr(key: StringKey): string {
  return translate(languageStore.get(), key);
}

const RAY_COUNT = 28;
const SHOCKWAVE_COUNT = 3;
const BEAT_PERIOD = 0.9;

function heartbeatWave(phase: number): number {
  if (phase < 0.1) return phase / 0.1;
  if (phase < 0.22) return 1 - ((phase - 0.1) / 0.12) * 0.55;
  if (phase < 0.32) return 0.45 + ((phase - 0.22) / 0.1) * 0.4;
  if (phase < 0.55) return 0.85 * (1 - (phase - 0.32) / 0.23);
  return 0;
}

export class SupernovaEffect implements MatchEffect {
  readonly name = 'Supernova';
  private intro = 0;
  private settle = 0;
  private confetti = new ConfettiBurst();

  onShow(s: Scene): void {
    this.intro = 0;
    this.settle = 0;
    this.confetti.reset(s.w);
  }

  draw(s: Scene): void {
    const { ctx, w, h, reduce, content } = s;
    const cx = w / 2;
    const cy = h / 2;

    if (reduce) {
      this.intro = 1;
      this.settle = 1;
    } else {
      this.intro = clampedProgress(this.intro, s.dt, 1.6);
      if (this.intro > 0.55) this.settle = clampedProgress(this.settle, s.dt, 1.8);
    }

    ctx.fillStyle = rgba([10, 6, 18], 1);
    ctx.fillRect(0, 0, w, h);

    const introScale = easeOutBack(this.intro);
    const spin = reduce ? 0 : s.t * 0.32;
    drawSunburst(ctx, cx, cy, w * 0.78 * introScale, spin, s.secondaryStart, s.secondaryEnd);

    // Soft glow rings around the heart.
    for (let i = 5; i >= 1; i--) {
      const rr = w * 0.16 * i * introScale;
      const a = 0.07 * (1 - i / 6);
      ctx.fillStyle = rgba(s.secondaryEnd, a);
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.fill();
    }

    const beatPhase = reduce ? 0 : (s.t % BEAT_PERIOD) / BEAT_PERIOD;
    const beat = reduce ? 0.35 : heartbeatWave(beatPhase);
    const heartScale = (0.92 + beat * 0.32) * introScale;
    const heartR = 46 * heartScale;

    if (!reduce) {
      drawShockwaves(ctx, cx, cy, s.t, w, s.secondaryStart, s.secondaryEnd);
    }

    drawHeart(ctx, cx, cy, heartR, beat, s.secondaryStart, s.secondaryEnd, reduce);

    // Orbiting avatars.
    const orbitR = 98 * introScale;
    const avatarR = 36;
    const orbitAng = reduce ? -Math.PI * 0.5 : s.t * 0.6;
    const lx = cx + Math.cos(orbitAng + Math.PI) * orbitR;
    const ly = cy + Math.sin(orbitAng + Math.PI) * orbitR;
    const rx = cx + Math.cos(orbitAng) * orbitR;
    const ry = cy + Math.sin(orbitAng) * orbitR;

    drawAvatarOrbit(
      ctx,
      lx,
      ly,
      avatarR,
      content.ownAvatar,
      s.t,
      s.secondaryStart,
      s.secondaryEnd,
      s.accent,
      reduce,
      false
    );
    drawAvatarOrbit(
      ctx,
      rx,
      ry,
      avatarR,
      content.peerAvatar,
      s.t,
      s.secondaryStart,
      s.secondaryEnd,
      s.accent,
      reduce,
      true
    );

    if (this.settle > 0.01) {
      // Heart glyphs flanking the title.
      const glow = reduce ? 0.6 : 0.6 + 0.4 * Math.sin(s.t * 3.0);
      const heartGlyphCol = rgba(s.secondaryEnd, this.settle * 0.5 * glow);
      const titleY = h * 0.155 + (1 - easeOutBack(this.settle)) * 14;
      ctx.font = '800 38px "Bricolage Grotesque Variable", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = tr('deck.match_its_a_match');
      const labelW = ctx.measureText(label).width;
      ctx.fillStyle = heartGlyphCol;
      ctx.fillText('♥', cx - labelW / 2 - 20, titleY);
      ctx.fillText('♥', cx + labelW / 2 + 20, titleY);

      // Gradient headline.
      gradientText(
        ctx,
        cx,
        titleY,
        label,
        '800 38px "Bricolage Grotesque Variable", sans-serif',
        s.secondaryStart,
        s.secondaryEnd,
        reduce ? 0 : s.t * 2.0,
        this.settle
      );

      centerText(
        ctx,
        cx,
        h * 0.245,
        tr('deck.match_fx_supernova'),
        '600 16px "Hanken Grotesk Variable", sans-serif',
        rgba(s.accentLight, this.settle * 0.9)
      );

      centerText(
        ctx,
        cx,
        h * 0.8,
        `${content.ownName}  ♥  ${content.peerName}`,
        '600 14px "Hanken Grotesk Variable", sans-serif',
        rgba([235, 235, 235], this.settle)
      );

      if (!reduce) this.confetti.draw(ctx, s.dt, h);
    }
  }
}

function drawSunburst(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  length: number,
  spin: number,
  colorA: Rgb,
  colorB: Rgb
): void {
  if (length <= 1) return;
  const halfWidth = ((Math.PI * 2) / RAY_COUNT) * 0.32;
  for (let i = 0; i < RAY_COUNT; i++) {
    const ang = (i / RAY_COUNT) * Math.PI * 2 + spin;
    const blend = 0.5 + 0.5 * Math.sin((i / RAY_COUNT) * Math.PI * 2);
    const col = lerpRgb(colorA, colorB, blend);
    const tipX = cx + Math.cos(ang) * length;
    const tipY = cy + Math.sin(ang) * length;
    const baseAX = cx + Math.cos(ang - halfWidth) * 20;
    const baseAY = cy + Math.sin(ang - halfWidth) * 20;
    const baseBX = cx + Math.cos(ang + halfWidth) * 20;
    const baseBY = cy + Math.sin(ang + halfWidth) * 20;
    ctx.fillStyle = rgba(col, 0.13);
    ctx.beginPath();
    ctx.moveTo(baseAX, baseAY);
    ctx.lineTo(baseBX, baseBY);
    ctx.lineTo(tipX, tipY);
    ctx.closePath();
    ctx.fill();
  }
}

function drawShockwaves(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  time: number,
  spanX: number,
  colorA: Rgb,
  colorB: Rgb
): void {
  const maxR = spanX * 0.58;
  for (let i = 0; i < SHOCKWAVE_COUNT; i++) {
    const phase = (time / BEAT_PERIOD + i / SHOCKWAVE_COUNT) % 1;
    const r = phase * maxR;
    const alpha = (1 - phase) * 0.45;
    if (alpha <= 0.01 || r <= 1) continue;
    const col = lerpRgb(colorA, colorB, phase);
    ctx.strokeStyle = rgba(col, alpha);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  beat: number,
  colorA: Rgb,
  colorB: Rgb,
  reduce: boolean
): void {
  const fillCol = lerpRgb(colorA, colorB, Math.max(0, Math.min(1, 0.5 + 0.35 * beat)));
  const lobeR = r * 0.5;
  const lobeOffX = r * 0.42;
  const lobeOffY = -r * 0.22;

  ctx.fillStyle = rgba(fillCol, 1);
  ctx.beginPath();
  ctx.arc(cx - lobeOffX, cy + lobeOffY, lobeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + lobeOffX, cy + lobeOffY, lobeR, 0, Math.PI * 2);
  ctx.fill();

  const apex = [cx, cy + r * 0.78] as const;
  const leftWing = [cx - r * 0.78, cy + lobeOffY + r * 0.04] as const;
  const rightWing = [cx + r * 0.78, cy + lobeOffY + r * 0.04] as const;
  ctx.fillStyle = rgba(fillCol, 1);
  ctx.beginPath();
  ctx.moveTo(leftWing[0], leftWing[1]);
  ctx.lineTo(rightWing[0], rightWing[1]);
  ctx.lineTo(apex[0], apex[1]);
  ctx.closePath();
  ctx.fill();

  // Sheen highlight.
  const sheenA = reduce ? 0.18 : 0.18 + 0.22 * Math.max(0, beat);
  ctx.fillStyle = rgba([255, 255, 255], sheenA);
  ctx.beginPath();
  ctx.arc(cx - lobeOffX - lobeR * 0.25, cy + lobeOffY - lobeR * 0.3, lobeR * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawAvatarOrbit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  img: HTMLImageElement | null,
  time: number,
  colorA: Rgb,
  colorB: Rgb,
  accent: Rgb,
  reduce: boolean,
  ccw: boolean
): void {
  avatarCircle(ctx, x, y, radius, img, rgba([255, 255, 255], 1), 0);
  if (reduce) {
    ctx.strokeStyle = rgba(accent, 1);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const phase = time * 1.8 * (ccw ? -1 : 1);
    gradientRing(ctx, x, y, radius + 3, 2.5, colorA, colorB, phase);
  }
}
