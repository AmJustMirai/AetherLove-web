// Match effect "Synthwave" — web port of Screens/Match.Synthwave.Screen.cs.
// Retro outrun: a perspective neon grid floor, a sliced gradient sun, and two glowing avatars.

import type { MatchEffect, Scene } from '../types';
import { avatarCircle, centerText, ConfettiBurst, rgba } from '../draw';
import { clampedProgress, easeOutCubic, gradientRing, gradientText, lerp, lerpRgb } from '../fx';
import type { StringKey } from '@/i18n';
import { languageStore, translate } from '@/i18n';

function tr(key: StringKey): string {
  return translate(languageStore.get(), key);
}

export class SynthwaveEffect implements MatchEffect {
  readonly name = 'Synthwave';
  private rise = 0;
  private settle = 0;
  private scroll = 0;
  private confetti = new ConfettiBurst();

  onShow(s: Scene): void {
    this.rise = 0;
    this.settle = 0;
    this.scroll = 0;
    this.confetti.reset(s.w);
  }

  draw(s: Scene): void {
    const { ctx, w, h, reduce, content } = s;
    const cx = w / 2;

    if (reduce) {
      this.rise = 1;
      this.settle = 1;
    } else {
      this.rise = clampedProgress(this.rise, s.dt, 0.9);
      if (this.rise > 0.55) this.settle = clampedProgress(this.settle, s.dt, 1.4);
      this.scroll = (this.scroll + s.dt * 0.35) % 1;
    }

    const horizonY = h * 0.55;

    // Sky gradient.
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, rgba([13, 8, 33], 1));
    skyGrad.addColorStop(1, rgba(s.secondaryEnd, 1));
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY);

    // Floor gradient.
    const floorGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    floorGrad.addColorStop(0, rgba([20, 5, 41], 1));
    floorGrad.addColorStop(1, rgba([5, 3, 15], 1));
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    drawSun(ctx, cx, horizonY, w, s.secondaryStart, s.secondaryEnd, reduce, s.t);
    drawScanlines(ctx, w, horizonY);
    const pulse = reduce ? 0.85 : 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(s.t * 1.4));
    drawGrid(ctx, w, h, horizonY, s.accentLight, s.secondaryEnd, pulse, reduce ? 0 : this.scroll);

    const radius = 46;
    const gap = 64;
    const avatarY = lerp(horizonY + 40, horizonY - 58, easeOutCubic(this.rise));
    const lx = cx - gap;
    const rx = cx + gap;

    // Glow halos behind avatars.
    const glowR = radius + 10 + (reduce ? 0 : pulse * 6);
    const glowA = (reduce ? 0.35 : 0.2 + 0.25 * pulse) * this.rise;
    ctx.save();
    ctx.globalAlpha = glowA;
    ctx.fillStyle = rgba(s.secondaryEnd, 1);
    ctx.beginPath();
    ctx.arc(lx, avatarY, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(s.secondaryStart, 1);
    ctx.beginPath();
    ctx.arc(rx, avatarY, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    avatarCircle(ctx, lx, avatarY, radius, content.ownAvatar, rgba([255, 255, 255], 1), 0);
    avatarCircle(ctx, rx, avatarY, radius, content.peerAvatar, rgba([255, 255, 255], 1), 0);

    if (reduce) {
      ctx.strokeStyle = rgba(s.accentLight, 1);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(lx, avatarY, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rx, avatarY, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const ringPhase = s.t * 1.7;
      gradientRing(ctx, lx, avatarY, radius + 3, 2.5, s.secondaryStart, s.secondaryEnd, ringPhase);
      gradientRing(ctx, rx, avatarY, radius + 3, 2.5, s.secondaryEnd, s.secondaryStart, -ringPhase);
    }

    if (this.settle > 0.01) {
      gradientText(
        ctx,
        cx,
        h * 0.17,
        tr('deck.match_its_a_match'),
        '800 38px "Bricolage Grotesque Variable", sans-serif',
        s.secondaryStart,
        s.secondaryEnd,
        reduce ? 0 : s.t * 2.2,
        this.settle
      );

      centerText(
        ctx,
        cx,
        h * 0.255,
        tr('deck.match_fx_synthwave'),
        '600 16px "Hanken Grotesk Variable", sans-serif',
        rgba(s.accentLight, this.settle * 0.9)
      );

      centerText(
        ctx,
        lx,
        avatarY + radius + 12,
        content.ownName,
        '600 14px "Hanken Grotesk Variable", sans-serif',
        rgba([242, 235, 250], this.settle)
      );
      centerText(
        ctx,
        rx,
        avatarY + radius + 12,
        content.peerName,
        '600 14px "Hanken Grotesk Variable", sans-serif',
        rgba([242, 235, 250], this.settle)
      );

      if (!reduce) this.confetti.draw(ctx, s.dt, h);
    }
  }
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  horizonY: number,
  w: number,
  colorA: [number, number, number],
  colorB: [number, number, number],
  reduce: boolean,
  time: number
): void {
  const sunR = w * 0.26;
  const bob = reduce ? 0 : Math.sin(time * 0.8) * 3;
  const sunCY = horizonY - sunR * 0.35 + bob;

  const rows = 40;
  for (let i = 0; i < rows; i++) {
    const yy = sunCY - sunR + ((i + 0.5) / rows) * sunR * 2;
    if (yy > horizonY) break;
    const dy = yy - sunCY;
    const half = Math.sqrt(Math.max(0, sunR * sunR - dy * dy));
    if (half <= 0) continue;

    const blend = Math.max(0, Math.min(1, (yy - (sunCY - sunR)) / (sunR * 2)));
    const col = lerpRgb(colorA, colorB, blend);

    let drawHalf = half;
    const lowerHalf = dy > 0;
    if (lowerHalf) {
      const bandPhase = dy / sunR;
      const band = Math.floor(bandPhase * 6);
      if ((band & 1) === 0) continue;
      drawHalf *= 1 - bandPhase * 0.15;
    }

    ctx.strokeStyle = rgba(col, 1);
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(cx - drawHalf, yy);
    ctx.lineTo(cx + drawHalf, yy);
    ctx.stroke();
  }

  ctx.strokeStyle = rgba(colorA, 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, sunCY, sunR, 0, Math.PI * 2);
  ctx.stroke();
}

function drawScanlines(ctx: CanvasRenderingContext2D, w: number, horizonY: number): void {
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let y = 0; y < horizonY; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  horizonY: number,
  accentLight: [number, number, number],
  secondaryEnd: [number, number, number],
  pulse: number,
  scroll: number
): void {
  const floorH = h - horizonY;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, horizonY, w, floorH);
  ctx.clip();

  const vanishX = w / 2;

  // Vertical perspective rays.
  ctx.lineWidth = 1.4;
  for (let i = -12; i <= 12; i++) {
    const bottomX = vanishX + (i / 12) * w * 1.4;
    ctx.strokeStyle = rgba(accentLight, 0.45 * pulse);
    ctx.beginPath();
    ctx.moveTo(vanishX, horizonY);
    ctx.lineTo(bottomX, h);
    ctx.stroke();
  }

  // Horizontal depth lines.
  for (let i = 0; i < 16; i++) {
    const f = Math.max(0, Math.min(1, (i + scroll) / 16));
    const depth = f * f;
    const y = horizonY + depth * floorH;
    ctx.strokeStyle = rgba(accentLight, 0.5 * depth * pulse);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    if (i % 2 === 0) {
      ctx.strokeStyle = rgba(secondaryEnd, 0.25 * pulse);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y + 1.5);
      ctx.lineTo(w, y + 1.5);
      ctx.stroke();
    }
  }

  ctx.restore();
}
