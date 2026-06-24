import { emojify } from 'node-emoji';

/** Replace :shortcode: patterns with their Unicode emoji equivalents. */
export function withEmoji(text: string): string {
  return emojify(text);
}
