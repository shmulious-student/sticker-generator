/** Prompt building for AI stickers — pure, so it's unit-testable. */

/** Distinct expressions cycled through when generating multiple stickers per face. */
export const EXPRESSION_VARIATIONS = [
  'with a big happy smile',
  'with a surprised, wide-eyed expression',
  'giving a playful wink and a thumbs up',
  'laughing out loud',
  'with a cool, confident look and sunglasses',
  'blowing a kiss with a heart',
];

/**
 * Wraps the user's base prompt with die-cut sticker styling while instructing the
 * model to preserve the person's likeness. When `totalVariations > 1`, a distinct
 * expression is appended per `variationIndex`.
 */
export function buildStickerPrompt(
  base: string,
  variationIndex = 0,
  totalVariations = 1,
): string {
  let subject = base.trim() || 'a fun sticker';
  if (totalVariations > 1) {
    const expression =
      EXPRESSION_VARIATIONS[variationIndex % EXPRESSION_VARIATIONS.length];
    subject += `, ${expression}`;
  }
  return `${subject}. Render as a cute die-cut sticker: bold clean outline, vibrant colors, simple plain background, subject centered, and preserve the person's facial likeness.`;
}
