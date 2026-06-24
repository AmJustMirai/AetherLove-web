// Match effect "Tarot" — web port of Screens/Match.Tarot.Screen.cs.
// Tarot Lovers: two ornate tarot cards flip open over a candle-warm glow, a slow zodiac ring,
// and drifting gold sparkles, revealing the two avatars as "The Lovers".

import type { MatchEffect, Scene } from '../types';
import { avatarCircle, centerText, rgba } from '../draw';
import {
  clampedProgress,
  easeOutBack,
  gradientRing,
  gradientText,
  heartGlyph,
  smooth01,
  sparkle,
} from '../fx';
import type { StringKey } from '@/i18n';
import { languageStore, translate } from '@/i18n';

function tr(key: StringKey): string {
  return translate(languageStore.get(), key);
}

const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

interface Sparkle {
  nx: number;
  ny: number;
  r: number;
  ph: number;
  sp: number;
}

const GOLD: [number, number, number] = [237, 204, 107];
const GOLD_DEEP: [number, number, number] = [168, 122, 46];
const CANDLE: [number, number, number] = [250, 158, 77];

export class TarotEffect implements MatchEffect {
  readonly name = 'Tarot';
  private flip = 0;
  private settle = 0;
  private sparkles: Sparkle[] = [];

  onShow(s: Scene): void {
    this.flip = 0;
    this.settle = 0;
    // Sparkle radius scales with canvas (mirrors C# Px(1.0) + NextSingle() * Px(2.4)).
    const px = s.w / 464;
    this.sparkles = Array.from({ length: 26 }, () => ({
      nx: Math.random(),
      ny: Math.random(),
      r: (1.0 + Math.random() * 2.4) * px,
      ph: Math.random() * Math.PI * 2,
      sp: 0.5 + Math.random() * 1.4,
    }));
  }

  draw(s: Scene): void {
    const { ctx, w, h, reduce, content } = s;
    const cx = w / 2;
    const cy = h / 2;

    if (reduce) {
      this.flip = 1;
      this.settle = 1;
    } else {
      this.flip = clampedProgress(this.flip, s.dt, 1.1);
      if (this.flip > 0.62) this.settle = clampedProgress(this.settle, s.dt, 1.5);
    }

    // Candle-warm dusk backdrop.
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, rgba([26, 13, 26], 1));
    bgGrad.addColorStop(1, rgba([10, 5, 13], 1));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Candle glow rising from center.
    const glowCY = cy - 6;
    const glowPulse = reduce ? 0.85 : 0.78 + 0.18 * Math.sin(s.t * 1.4);
    for (let i = 7; i >= 1; i--) {
      const rr = w * 0.16 * i;
      const a = 0.06 * (1 - i / 8) * glowPulse;
      ctx.fillStyle = rgba(CANDLE, a);
      ctx.beginPath();
      ctx.arc(cx, glowCY, rr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Faint zodiac ring.
    const ringR = Math.min(w, h) * 0.4;
    const ringRot = reduce ? 0 : s.t * 0.1;
    ctx.strokeStyle = rgba(GOLD, 0.1);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR + 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.07);
    ctx.beginPath();
    ctx.arc(cx, cy, ringR - 11, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '14px "Hanken Grotesk Variable", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < ZODIAC.length; i++) {
      const ang = (i / ZODIAC.length) * Math.PI * 2 + ringRot - Math.PI * 0.5;
      const px = cx + Math.cos(ang) * ringR;
      const py = cy + Math.sin(ang) * ringR;
      const twinkle = reduce ? 0.3 : 0.2 + 0.16 * Math.sin(s.t * 1.8 + i);
      ctx.fillStyle = rgba(GOLD, twinkle);
      ctx.fillText(ZODIAC[i], px, py);
    }

    // Two tarot cards that flip (scale width) open sequentially.
    const radius = 42;
    const cardGap = 14;
    const cardW = radius * 2 + 22;
    const cardH = radius * 2 + 54;
    const lCenter = [cx - cardW * 0.5 - cardGap * 0.5, cy] as const;
    const rCenter = [cx + cardW * 0.5 + cardGap * 0.5, cy] as const;

    const openL = reduce ? 1 : easeOutBack(smooth01(this.flip / 0.62));
    const openR = reduce ? 1 : easeOutBack(smooth01((this.flip - 0.1) / 0.62));

    drawTarotCard(
      ctx,
      lCenter[0],
      lCenter[1],
      cardW,
      cardH,
      radius,
      openL,
      content.ownName,
      content.ownAvatar,
      s.t,
      reduce
    );
    drawTarotCard(
      ctx,
      rCenter[0],
      rCenter[1],
      cardW,
      cardH,
      radius,
      openR,
      content.peerName,
      content.peerAvatar,
      s.t,
      reduce
    );

    // Title + subtitle after settle.
    if (this.settle > 0.01) {
      gradientText(
        ctx,
        cx,
        h * 0.135,
        tr('deck.match_fx_tarot_title'),
        '800 38px "Bricolage Grotesque Variable", sans-serif',
        GOLD,
        CANDLE,
        reduce ? 0 : s.t * 1.2,
        this.settle
      );

      centerText(
        ctx,
        cx,
        h * 0.205,
        tr('deck.match_its_a_match'),
        '700 22px "Bricolage Grotesque Variable", sans-serif',
        rgba([255, 240, 220], this.settle)
      );

      centerText(
        ctx,
        cx,
        h * 0.255,
        tr('deck.match_fx_tarot'),
        '600 14px "Hanken Grotesk Variable", sans-serif',
        rgba(GOLD, this.settle * 0.78)
      );
    }

    // Drifting gold sparkles.
    if (!reduce) {
      for (const sp of this.sparkles) {
        const rise = (s.t * sp.sp * 0.06) % 1;
        const py = ((sp.ny - rise + 1) % 1) * h;
        const px = sp.nx * w + Math.sin(s.t * 0.9 + sp.ph) * 8;
        const twinkle = 0.3 + 0.45 * (0.5 + 0.5 * Math.sin(s.t * 3 + sp.ph));
        sparkle(ctx, px, py, sp.r * (0.6 + 0.4 * twinkle), rgba(GOLD, twinkle * 0.8));
      }
    }
  }
}

function drawTarotCard(
  ctx: CanvasRenderingContext2D,
  cardCX: number,
  cardCY: number,
  fullW: number,
  fullH: number,
  avatarR: number,
  open: number,
  name: string,
  img: HTMLImageElement | null,
  time: number,
  reduce: boolean
): void {
  open = Math.max(0, Math.min(1, open));
  const halfW = Math.max(1.5, fullW * 0.5 * open);
  const halfH = fullH * 0.5;
  const x0 = cardCX - halfW;
  const y0 = cardCY - halfH;
  const x1 = cardCX + halfW;
  const y1 = cardCY + halfH;
  const round = 10 * Math.max(0, Math.min(1, open * 1.4));

  // Card face.
  const cardGrad = ctx.createLinearGradient(x0, y0, x0, y1);
  cardGrad.addColorStop(0, rgba([46, 26, 36], 1));
  cardGrad.addColorStop(1, rgba([31, 15, 26], 1));
  ctx.fillStyle = cardGrad;
  ctx.save();
  roundRect(ctx, x0, y0, halfW * 2, fullH, round);
  ctx.fill();
  ctx.restore();

  // Candle tint wash.
  ctx.fillStyle = rgba(CANDLE, 0.06);
  ctx.save();
  roundRect(ctx, x0, y0, halfW * 2, fullH, round);
  ctx.fill();
  ctx.restore();

  // Outer gold border.
  ctx.strokeStyle = rgba(GOLD, 0.95);
  ctx.lineWidth = 2.4;
  ctx.save();
  roundRect(ctx, x0, y0, halfW * 2, fullH, round);
  ctx.stroke();
  ctx.restore();

  // Inner gold border (inset).
  const inset = 5;
  if (halfW > inset + 2) {
    ctx.strokeStyle = rgba(GOLD_DEEP, 0.9);
    ctx.lineWidth = 1.2;
    ctx.save();
    roundRect(
      ctx,
      x0 + inset,
      y0 + inset,
      halfW * 2 - inset * 2,
      fullH - inset * 2,
      Math.max(0, round - inset)
    );
    ctx.stroke();
    ctx.restore();
  }

  // Clipped reveal inside the card.
  ctx.save();
  roundRect(
    ctx,
    x0 + inset,
    y0 + inset,
    halfW * 2 - inset * 2,
    fullH - inset * 2,
    Math.max(0, round - inset)
  );
  ctx.clip();

  if (open > 0.35) {
    const avCX = cardCX;
    const avCY = cardCY - 8;

    avatarCircle(ctx, avCX, avCY, avatarR, img, rgba([255, 255, 255], 1), 0);

    if (reduce) {
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(avCX, avCY, avatarR + 3, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const rimPhase = time * 1.3;
      gradientRing(ctx, avCX, avCY, avatarR + 3, 2.4, GOLD, CANDLE, rimPhase);
    }

    // Small heart sigil under the avatar.
    heartGlyph(ctx, avCX, avCY + avatarR + 8, 6, rgba(CANDLE, 0.9));

    // Name label.
    ctx.font = '600 13px "Hanken Grotesk Variable", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nw = ctx.measureText(name).width;
    const clipW = halfW * 2 - inset * 2;
    if (nw < clipW) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillText(name, avCX, avCY + avatarR + 18);
    }
  } else {
    // Card back: arcane heart mark while still mostly closed.
    heartGlyph(ctx, cardCX, cardCY, 10, rgba(GOLD, 0.45));
  }

  ctx.restore();

  // Corner flourishes (drawn on top of frame once there's real width).
  if (halfW > inset + 6) {
    const c = 9;
    drawCornerFlourish(ctx, x0 + inset, y0 + inset, c, c);
    drawCornerFlourish(ctx, x1 - inset, y0 + inset, -c, c);
    drawCornerFlourish(ctx, x0 + inset, y1 - inset, c, -c);
    drawCornerFlourish(ctx, x1 - inset, y1 - inset, -c, -c);
  }
}

function drawCornerFlourish(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  dx: number,
  dy: number
): void {
  ctx.strokeStyle = rgba(GOLD, 0.85);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + dx, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy + dy);
  ctx.stroke();
  ctx.fillStyle = rgba(GOLD, 0.85);
  ctx.beginPath();
  ctx.arc(cx + dx * 0.55, cy + dy * 0.55, 1.4, 0, Math.PI * 2);
  ctx.fill();
}

/** Path helper that traces a rounded rectangle without filling or stroking it. */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }
}
