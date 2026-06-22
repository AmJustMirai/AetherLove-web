// Web port of UI/UiScale.cs + UI/PhoneScalePreset.cs.
//
// The plugin authored every length against a fixed 464×835 "phone" and multiplied by a single S knob
// (Px()). On the web we instead lay the phone out at the design size and scale the whole frame with a
// CSS transform — so child elements are authored in plain design pixels and never need a per-length
// helper. The active scale is the smaller of the user's size preset and whatever fits the viewport,
// so the phone shrinks to fit small screens and never overflows.

export const DESIGN = {width: 464, height: 835} as const;

export type PhoneScalePreset = 'small' | 'medium' | 'large';

/** Multiplier each preset maps to (mirrors UiScale.MultiplierFor). */
export const PRESET_MULTIPLIER: Record<PhoneScalePreset, number> = {
    small: 1.0,
    medium: 1.15,
    large: 1.3,
};

/** Margin (design px) kept around the phone so the bezel/shadow isn't flush to the viewport edge. */
const VIEWPORT_MARGIN = 24;

/**
 * The scale to render the phone at: the preset multiplier, capped so the framed phone (plus margin)
 * still fits the viewport. Returns a plain number the shell applies as `transform: scale(...)`.
 */
export function computePhoneScale(
    preset: PhoneScalePreset,
    viewportWidth: number,
    viewportHeight: number,
): number {
    const fit = Math.min(
        viewportWidth / (DESIGN.width + VIEWPORT_MARGIN),
        viewportHeight / (DESIGN.height + VIEWPORT_MARGIN),
    );
    return Math.min(PRESET_MULTIPLIER[preset], fit);
}
