/**
 * Telegram export via the native TelegramImport bridge (official import API).
 * Each import creates a NEW set for the importing user — surface this in the UI.
 */

import {importStickers, isTelegramInstalled} from '../native/TelegramImport';
import {validatePack} from './validation';
import type {StickerPack} from '../types';

export {isTelegramInstalled};

/** Import a pack's stickers into Telegram. Throws on validation failure. */
export async function importToTelegram(pack: StickerPack): Promise<void> {
  const result = validatePack(pack, 'telegram');
  if (!result.ok) {
    throw new Error(result.errors.join('\n'));
  }

  const included = pack.stickers.filter(s => s.included && s.fileUri);

  await importStickers({
    software: 'Sticker Generator',
    isAnimated: false,
    stickers: included.map(s => ({
      fileUri: s.fileUri!,
      emojis: [s.emoji],
    })),
  });
}
