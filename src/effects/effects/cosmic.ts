// Match effect "Cosmic" — web port of Screens/Match.Cosmic.Screen.cs. Two avatars hurtle together into a
// shockwave of light over a twinkling starfield.

import type { MatchEffect, Scene } from '../types';
import { avatarCircle, centerText, easeOut, progress, rgba } from '../draw';

interface Star {
  x: number;
  y: number;
  r: number;
  twinkle: number;
}

export class CosmicEffect implements MatchEffect {
  readonly name = 'Cosmic';
  private stars: Star[] = [];

  onShow(s: Scene): void {
    this.stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * s.w,
      y: Math.random() * s.h,
      r: Math.random() * 1.6 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
    }));
  }

  draw(s: Scene): void {
    const { ctx, w, h, reduce, content } = s;
    const cx = w / 2;
    const cy = h * 0.46;

    // Deep space backdrop.
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, h * 0.7);
    grad.addColorStop(0, '#1a0f2e');
    grad.addColorStop(1, '#05030a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (const st of this.stars) {
      const a = reduce ? 0.8 : 0.4 + 0.5 * Math.abs(Math.sin(st.twinkle + s.t * 3));
      ctx.fillStyle = rgba([255, 255, 255], a);
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const meet = reduce ? 1 : easeOut(progress(s.t, 1.1));
    const textA = reduce ? 1 : easeOut(progress(s.t, 1.4));

    // Shockwave once the avatars meet.
    if (meet > 0.85 || reduce) {
      const wp = reduce ? 0.6 : progress(s.t - 1.0, 1.2);
      const radius = wp * h * 0.5;
      ctx.lineWidth = 6 * (1 - wp);
      ctx.strokeStyle = rgba(s.accentLight, 0.7 * (1 - wp));
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    const r = 50;
    const start = w * 0.6;
    const lx = cx - start * (1 - meet) - r - 8;
    const rx = cx + start * (1 - meet) + r + 8;
    avatarCircle(ctx, lx, cy, r, content.ownAvatar, rgba(s.accentLight, 1), 3);
    avatarCircle(ctx, rx, cy, r, content.peerAvatar, rgba(s.accentLight, 1), 3);

    centerText(
      ctx,
      cx,
      h * 0.2,
      "It's a match!",
      '800 36px "Bricolage Grotesque Variable", sans-serif',
      rgba([255, 255, 255], textA)
    );
    centerText(
      ctx,
      cx,
      cy + r + 30,
      `${content.ownName}  &  ${content.peerName}`,
      '600 15px "Hanken Grotesk Variable", sans-serif',
      rgba(s.accentLight, textA)
    );
  }
}
