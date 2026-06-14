/**
 * WhatsApp export. Builds the contents.json-shaped pack expected by
 * react-native-whatsapp-stickers and triggers the "Add to WhatsApp" flow.
 *
 * Android note: app/build.gradle must set `aaptOptions { noCompress "webp" }`
 * so bundled webp assets are not recompressed.
 */

import * as WhatsAppStickers from 'react-native-whatsapp-stickers';
import {validatePack} from './validation';
import type {StickerPack} from '../types';

/** Strip the file:// scheme if present (the native side expects bare paths). */
function toPath(uri?: string): string {
  return (uri ?? '').replace(/^file:\/\//, '');
}

/**
 * Send a pack to WhatsApp. Throws with a combined message if the pack fails
 * WhatsApp's validation (e.g. fewer than 3 stickers).
 */
export async function addToWhatsApp(pack: StickerPack): Promise<void> {
  const result = validatePack(pack, 'whatsapp');
  if (!result.ok) {
    throw new Error(result.errors.join('\n'));
  }

  const included = pack.stickers.filter(s => s.included && s.fileUri);

  const payload = {
    identifier: pack.identifier,
    name: pack.name,
    publisher: pack.publisher,
    trayImageFile: toPath(pack.trayImageFileUri),
    stickers: included.map(s => ({
      imageFile: toPath(s.fileUri),
      emojis: [s.emoji],
    })),
  };

  // The library exposes a single entry point that opens WhatsApp's add-pack UI.
  await (WhatsAppStickers as any).send(payload);
}
