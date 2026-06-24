// Match effect "Kaleidoscope" — web port of Screens/Match.Kaleidoscope.Screen.cs.
// Kaleidoscope Bloom: a radially-symmetric mandala of triangular shards blooms outward and
// slowly rotates, revealing the two avatars at its hub.

import type { MatchEffect, Scene } from '../types';
import type { Rgb } from '../draw';
import { avatarCircle, centerText, ConfettiBurst, rgba } from '../draw';
import { clampedProgress, easeOutBack, gradientRing, gradientText, lerpRgb, smooth01 } from '../fx';
import type { StringKey } from '@/i18n';
import { languageStore, translate } from '@/i18n';

function tr(key: StringKey): string {
  return translate(languageStore.get(), key);
}

const SHARD_COUNT = 20;

export class KaleidoscopeEffect implements MatchEffect {
  readonly name = 'Kaleidoscope';
  private bloom = 0;
  private reveal = 0;
  private confetti = new ConfettiBurst();

  onShow(s: Scene): void {
    this.bloom = 0;
    this.reveal = 0;
    this.confetti.reset(s.w);
  }

  draw(s: Scene): void {
    const { ctx, w, h, reduce, content } = s;
    const cx = w / 2;
    const cy = h / 2;

    if (reduce) {
      this.bloom = 1;
      this.reveal = 1;
    } else {
      this.bloom = clampedProgress(this.bloom, s.dt, 0.95);
      if (this.bloom > 0.55) this.reveal = clampedProgress(this.reveal, s.dt, 1.6);
    }

    ctx.fillStyle = rgba([10, 7, 18], 1);
    ctx.fillRect(0, 0, w, h);

    const maxR = Math.min(w, h) * 0.46;
    const bloomEased = easeOutBack(this.bloom);
    const spin = reduce ? 0 : s.t * 0.35;

    // Soft outer glow behind mandala.
    for (let i = 5; i >= 1; i--) {
      const rr = maxR * 1.05 * (i / 5) * bloomEased;
      ctx.fillStyle = rgba(s.secondaryStart, 0.06 * (1 - i / 6));
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Triangular shards — the mandala.
    const shardR = maxR * Math.max(0, Math.min(1, bloomEased));
    const innerR = shardR * 0.18;
    const step = (Math.PI * 2) / SHARD_COUNT;
    for (let i = 0; i < SHARD_COUNT; i++) {
      const ang = i * step + spin;
      const half = step * 0.46;
      const blend = i / (SHARD_COUNT - 1);
      const shade = 0.55 + 0.45 * Math.cos(ang * 2 - spin);
      const baseCol = lerpRgb(s.secondaryStart, s.secondaryEnd, blend);
      const col: Rgb = [baseCol[0] * shade, baseCol[1] * shade, baseCol[2] * shade];

      const tipX = cx + Math.cos(ang) * shardR;
      const tipY = cy + Math.sin(ang) * shardR;
      const baseL = [
        cx + Math.cos(ang - half) * innerR,
        cy + Math.sin(ang - half) * innerR,
      ] as const;
      const baseR = [
        cx + Math.cos(ang + half) * innerR,
        cy + Math.sin(ang + half) * innerR,
      ] as const;

      ctx.fillStyle = rgba(col, 0.92);
      ctx.beginPath();
      ctx.moveTo(baseL[0], baseL[1]);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(baseR[0], baseR[1]);
      ctx.closePath();
      ctx.fill();

      // Sheen facets.
      const midL = [
        cx + Math.cos(ang - half * 0.5) * (shardR * 0.5),
        cy + Math.sin(ang - half * 0.5) * (shardR * 0.5),
      ] as const;
      const midR = [
        cx + Math.cos(ang + half * 0.5) * (shardR * 0.5),
        cy + Math.sin(ang + half * 0.5) * (shardR * 0.5),
      ] as const;
      ctx.fillStyle = rgba(s.accentLight, 0.18 * bloomEased);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(midL[0], midL[1]);
      ctx.lineTo(midR[0], midR[1]);
      ctx.closePath();
      ctx.fill();
    }

    // Rotating concentric rings.
    const ringPhase = reduce ? 0 : s.t * 1.2;
    for (let r = 0; r < 3; r++) {
      const rr = shardR * (0.4 + 0.28 * r);
      if (rr <= 1) continue;
      const thick = Math.max(1, 2.5 - r * 0.5);
      const dir = r % 2 === 0 ? 1 : -1;
      gradientRing(ctx, cx, cy, rr, thick, s.secondaryStart, s.secondaryEnd, ringPhase * dir);
    }

    if (this.reveal > 0.01) {
      const radius = 40 * smooth01(this.reveal);
      const gap = radius * 0.78;
      const lx = cx - gap;
      const rx = cx + gap;

      // Dark hub to punch the avatars out of the mandala.
      ctx.fillStyle = rgba([10, 7, 18], 0.8);
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
      ctx.fill();

      avatarCircle(ctx, lx, cy, radius, content.ownAvatar, rgba([255, 255, 255], 1), 0);
      avatarCircle(ctx, rx, cy, radius, content.peerAvatar, rgba([255, 255, 255], 1), 0);

      if (reduce) {
        ctx.strokeStyle = rgba(s.accent, 1);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lx, cy, radius + 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(rx, cy, radius + 2.5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const avatarPhase = s.t * 1.6;
        gradientRing(ctx, lx, cy, radius + 2.5, 2.5, s.secondaryStart, s.secondaryEnd, avatarPhase);
        gradientRing(
          ctx,
          rx,
          cy,
          radius + 2.5,
          2.5,
          s.secondaryStart,
          s.secondaryEnd,
          -avatarPhase
        );
      }

      gradientText(
        ctx,
        cx,
        h * 0.13,
        tr('deck.match_its_a_match'),
        '800 38px "Bricolage Grotesque Variable", sans-serif',
        s.secondaryStart,
        s.secondaryEnd,
        reduce ? 0 : s.t * 1.6,
        this.reveal
      );

      centerText(
        ctx,
        cx,
        h * 0.215,
        tr('deck.match_fx_kaleido'),
        '600 16px "Hanken Grotesk Variable", sans-serif',
        rgba(s.accentLight, this.reveal * 0.9)
      );

      centerText(
        ctx,
        cx,
        h * 0.83,
        `${content.ownName}  &  ${content.peerName}`,
        '600 14px "Hanken Grotesk Variable", sans-serif',
        rgba([235, 235, 235], this.reveal)
      );

      if (!reduce) this.confetti.draw(ctx, s.dt, h);
    }
  }
}
