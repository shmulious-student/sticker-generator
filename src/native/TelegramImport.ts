/**
 * JS binding for the custom native Telegram sticker-import bridge.
 *
 * Native contract (to be implemented in Phase 5), wrapping the official
 * TelegramStickersImport libraries (https://core.telegram.org/import-stickers):
 *  - Android: startActivity with action `org.telegram.messenger.CREATE_STICKER_PACK`,
 *    EXTRA_STREAM = content:// uris, STICKER_EMOJIS = emoji list, plus set title.
 *  - iOS: serialize the set to the system pasteboard per Telegram's iOS lib and
 *    open `tg://importStickers`.
 *
 * Note: each import creates a NEW set on Telegram — this is for the importing
 * user only, not for sharing (sharing should go through @stickers).
 */

import {NativeModules} from 'react-native';

export interface TelegramStickerInput {
  /** Path to a static .webp sticker file. */
  fileUri: string;
  /** Emojis associated with the sticker. */
  emojis: string[];
}

export interface TelegramImportRequest {
  /** Software/app identifier shown by Telegram. */
  software: string;
  /** Whether the set is static images (always true for the cutout MVP). */
  isAnimated: boolean;
  stickers: TelegramStickerInput[];
}

interface NativeTelegramImport {
  importStickers(request: TelegramImportRequest): Promise<void>;
  isTelegramInstalled(): Promise<boolean>;
}

const native = NativeModules.TelegramImport as NativeTelegramImport | undefined;

function assertNative(): NativeTelegramImport {
  if (!native) {
    throw new Error(
      'TelegramImport native module is not linked. Build the app after running pod install / gradle sync.',
    );
  }
  return native;
}

export async function isTelegramInstalled(): Promise<boolean> {
  return assertNative().isTelegramInstalled();
}

export async function importStickers(request: TelegramImportRequest): Promise<void> {
  return assertNative().importStickers(request);
}
