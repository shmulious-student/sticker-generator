/**
 * Pure validation rules for sticker packs against WhatsApp and Telegram limits.
 * No native imports — unit-testable in plain Node/Jest.
 */

import type {ExportTarget, StickerPack} from '../types';

/** WhatsApp requires at least 3 and at most 30 stickers per pack. */
export const WHATSAPP_MIN_STICKERS = 3;
export const WHATSAPP_MAX_STICKERS = 30;

/** Telegram allows up to 120 static stickers per imported set. */
export const TELEGRAM_MAX_STICKERS = 120;

/** Max WebP sticker file size accepted by WhatsApp (bytes). */
export const MAX_STICKER_BYTES = 100 * 1024;

/** Max tray-icon PNG size accepted by WhatsApp (bytes). */
export const MAX_TRAY_BYTES = 50 * 1024;

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/** Count the stickers the user has marked as included. */
export function includedCount(pack: StickerPack): number {
  return pack.stickers.filter(s => s.included).length;
}

/**
 * Validate a pack for a given export target. Returns all problems found so the
 * UI can surface them together rather than one at a time.
 */
export function validatePack(
  pack: StickerPack,
  target: ExportTarget,
): ValidationResult {
  const errors: string[] = [];
  const count = includedCount(pack);

  if (!pack.name.trim()) {
    errors.push('Pack name is required.');
  }
  if (!pack.publisher.trim()) {
    errors.push('Publisher name is required.');
  }

  const included = pack.stickers.filter(s => s.included);
  if (included.some(s => !s.emoji.trim())) {
    errors.push('Every sticker needs at least one emoji.');
  }
  if (included.some(s => !s.fileUri)) {
    errors.push('Some stickers have not finished generating yet.');
  }

  if (target === 'whatsapp') {
    if (count < WHATSAPP_MIN_STICKERS) {
      errors.push(
        `WhatsApp needs at least ${WHATSAPP_MIN_STICKERS} stickers (you have ${count}). Add more photos or faces.`,
      );
    }
    if (count > WHATSAPP_MAX_STICKERS) {
      errors.push(
        `WhatsApp allows at most ${WHATSAPP_MAX_STICKERS} stickers (you have ${count}). Remove some or split into multiple packs.`,
      );
    }
    if (!pack.trayImageFileUri) {
      errors.push('WhatsApp requires a tray icon.');
    }
  }

  if (target === 'telegram') {
    if (count < 1) {
      errors.push('Add at least one sticker to import into Telegram.');
    }
    if (count > TELEGRAM_MAX_STICKERS) {
      errors.push(
        `Telegram allows at most ${TELEGRAM_MAX_STICKERS} stickers per set (you have ${count}).`,
      );
    }
  }

  return {ok: errors.length === 0, errors};
}
