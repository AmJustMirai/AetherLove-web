// Match-effect contract — web port of Screens/IMatchEffect.cs + MatchContent.cs. Each effect is a small
// stateful object: onShow() resets it, draw() renders one frame into the 2D context. The shared runner
// (MatchCanvas) drives the rAF loop and passes a Scene each frame; effects never own the loop. This is a
// direct analog to the plugin's ImGui draw-list effects.

export interface MatchContent {
  ownAvatar: HTMLImageElement | null;
  peerAvatar: HTMLImageElement | null;
  ownName: string;
  peerName: string;
}

export interface Scene {
  ctx: CanvasRenderingContext2D;
  /** Design-space dimensions (464×835); the runner scales the context for DPR. */
  w: number;
  h: number;
  /** Seconds since the effect was shown. */
  t: number;
  /** Seconds since the previous frame. */
  dt: number;
  /** Effective reduce-motion: effects skip animation and render their static end-frame. */
  reduce: boolean;
  content: MatchContent;
  /** Themed accent as [r,g,b] (0-255), resolved from the active theme's CSS vars. */
  accent: [number, number, number];
  accentLight: [number, number, number];
  /** The theme's secondary gradient stops (ThemeDefinition.SecondaryStart/End). */
  secondaryStart: [number, number, number];
  secondaryEnd: [number, number, number];
}

export interface MatchEffect {
  readonly name: string;

  onShow(scene: Scene): void;

  draw(scene: Scene): void;
}
