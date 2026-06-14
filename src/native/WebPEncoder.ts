/**
 * JS binding for the custom native WebP encoder / 512x512 canvas compositor.
 *
 * Native contract (to be implemented in Phase 2):
 *  - Android: encode via Bitmap.compress(Bitmap.CompressFormat.WEBP_LOSSY, q, ...).
 *  - iOS: encode via libwebp / SDWebImageWebPCoder.
 *
 * The native module composites a (possibly transparent, non-square) cutout onto
 * a transparent 512x512 canvas ("contain" fit, see geometry.containOnCanvas),
 * then encodes to WebP while auto-tuning quality to stay under MAX_STICKER_BYTES.
 */

import {NativeModules} from 'react-native';
import {MAX_STICKER_BYTES, MAX_TRAY_BYTES} from '../export/validation';
import {STICKER_SIZE, TRAY_ICON_SIZE} from '../pipeline/geometry';

export interface WebPEncodeOptions {
  /** Source image path/uri (PNG with alpha expected for cutouts). */
  inputUri: string;
  /** Output file path the encoder should write to. */
  outputUri: string;
  /** Target canvas edge length (defaults to 512). */
  canvasSize?: number;
  /** Maximum output size in bytes; encoder lowers quality until it fits. */
  maxBytes?: number;
}

interface NativeWebPEncoder {
  /** Crop a rectangle out of a source image, writing a PNG to outputUri. */
  cropToFile(
    inputUri: string,
    outputUri: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<string>;
  /** Composite + encode to WebP. Resolves with the bytes written. */
  encodeSticker(options: Required<WebPEncodeOptions>): Promise<number>;
  /** Produce a 96x96 PNG tray icon from a source image. */
  encodeTrayIcon(inputUri: string, outputUri: string, size: number): Promise<number>;
}

const native = NativeModules.WebPEncoder as NativeWebPEncoder | undefined;

function assertNative(): NativeWebPEncoder {
  if (!native) {
    throw new Error(
      'WebPEncoder native module is not linked. Build the app (not Expo Go) after running pod install / gradle sync.',
    );
  }
  return native;
}

/** Crop a rect (in source pixels) out of an image into a PNG file. */
export async function cropToFile(
  inputUri: string,
  outputUri: string,
  rect: {x: number; y: number; width: number; height: number},
): Promise<string> {
  return assertNative().cropToFile(
    inputUri,
    outputUri,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
  );
}

/** Composite a cutout onto a 512x512 transparent canvas and encode to WebP. */
export async function encodeSticker(opts: WebPEncodeOptions): Promise<number> {
  return assertNative().encodeSticker({
    inputUri: opts.inputUri,
    outputUri: opts.outputUri,
    canvasSize: opts.canvasSize ?? STICKER_SIZE,
    maxBytes: opts.maxBytes ?? MAX_STICKER_BYTES,
  });
}

/** Produce a 96x96 PNG tray icon (kept under MAX_TRAY_BYTES). */
export async function encodeTrayIcon(
  inputUri: string,
  outputUri: string,
): Promise<number> {
  const bytes = await assertNative().encodeTrayIcon(
    inputUri,
    outputUri,
    TRAY_ICON_SIZE,
  );
  if (bytes > MAX_TRAY_BYTES) {
    throw new Error('Generated tray icon exceeds WhatsApp size limit.');
  }
  return bytes;
}
