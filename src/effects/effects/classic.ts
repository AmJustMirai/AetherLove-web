// Match effect "Classic" — web port of Screens/Match.Classic.Screen.cs. Dimming overlay, confetti, and
// two avatars sliding in to meet beneath the title.

import type {MatchEffect, Scene} from '../types';
import {avatarCircle, centerText, ConfettiBurst, easeOut, progress, rgba} from '../draw';

export class ClassicEffect implements MatchEffect {
    readonly name = 'Classic';
    private confetti = new ConfettiBurst();

    onShow(s: Scene): void {
        this.confetti.reset(s.w);
    }

    draw(s: Scene): void {
        const {ctx, w, h, reduce, content} = s;
        const bg = reduce ? 1 : easeOut(progress(s.t, 1.2));
        const slide = reduce ? 1 : easeOut(progress(s.t, 1.0));
        const text = reduce ? 1 : easeOut(progress(s.t, 0.9));

        ctx.fillStyle = rgba([10, 6, 18], 0.82 * bg);
        ctx.fillRect(0, 0, w, h);

        if (!reduce) this.confetti.draw(ctx, s.dt, h);

        const cx = w / 2;
        centerText(ctx, cx, h * 0.2, 'Congratulations', '600 20px "Hanken Grotesk Variable", sans-serif', rgba(s.accentLight, text));
        centerText(ctx, cx, h * 0.27, "It's a match!", '800 38px "Bricolage Grotesque Variable", sans-serif', rgba([255, 255, 255], text));

        const r = 52;
        const spacing = 70;
        const avatarY = h * 0.48;
        const lx = cx - spacing - r * 2 * (1 - slide);
        const rx = cx + spacing + r * 2 * (1 - slide);
        avatarCircle(ctx, lx, avatarY, r, content.ownAvatar);
        avatarCircle(ctx, rx, avatarY, r, content.peerAvatar);

        centerText(ctx, lx, avatarY + r + 18, content.ownName, '600 14px "Hanken Grotesk Variable", sans-serif', rgba([235, 235, 235], text));
        centerText(ctx, rx, avatarY + r + 18, content.peerName, '600 14px "Hanken Grotesk Variable", sans-serif', rgba([235, 235, 235], text));
    }
}
