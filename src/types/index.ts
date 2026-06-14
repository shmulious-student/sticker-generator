/**
 * Domain types shared across the sticker-generation pipeline, storage and export layers.
 */

/** A rectangle in pixel coordinates of a source image (origin = top-left). */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A face detected by the on-device face detector. */
export interface DetectedFace {
  /** Stable id derived from source image + index. */
  id: string;
  /** Absolute path / uri of the source photo this face came from. */
  sourceUri: string;
  /** Bounding box of the face within the source image, in source pixels. */
  bounds: Rect;
}

/**
 * A single generated sticker candidate, before/after it is committed to a pack.
 * `fileUri` points at the normalized 512x512 WebP once generation completes.
 */
export interface StickerCandidate {
  id: string;
  sourceUri: string;
  /** The padded crop rect actually used (see geometry.computeStickerCrop). */
  crop: Rect;
  /** Emoji associated with this sticker (required by both WhatsApp & Telegram). */
  emoji: string;
  /** Whether the user has included this sticker in the pack. */
  included: boolean;
  /** Whether background removal should be applied to this sticker. */
  removeBackground: boolean;
  /** Path to the generated 512x512 WebP, set after the pipeline runs. */
  fileUri?: string;
}

/** A persisted sticker pack. */
export interface StickerPack {
  /** UUID, also used as WhatsApp identifier and Telegram set short-name seed. */
  identifier: string;
  name: string;
  publisher: string;
  /** Path to the 96x96 PNG tray icon. */
  trayImageFileUri?: string;
  stickers: StickerCandidate[];
  createdAt: number;
  updatedAt: number;
}

/** Target messenger for export. */
export type ExportTarget = 'whatsapp' | 'telegram';
