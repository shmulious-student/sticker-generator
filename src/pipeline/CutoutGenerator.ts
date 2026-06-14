/**
 * Generator seam: turning one cropped face into a finished 512x512 WebP sticker.
 *
 * The MVP ships `CutoutGenerator` (on-device background removal + WebP encode).
 * The future AI phase (Phase 6) will add an `AIGenerator` implementing the same
 * `StickerGenerator` interface, so the orchestrator in stickerPipeline.ts does
 * not need to change when AI styling is introduced.
 */

import RNFS from 'react-native-fs';
import {removeBackground} from './backgroundRemoval';
import {encodeSticker} from '../native/WebPEncoder';

export interface GenerateArgs {
  /** Path to the already-cropped square face image (PNG/JPEG). */
  croppedUri: string;
  /** Whether to apply background removal for this sticker. */
  removeBg: boolean;
  /** Where the finished .webp should be written. */
  outputUri: string;
}

export interface StickerGenerator {
  /** Produce a 512x512 WebP at `outputUri`; resolves with that path. */
  generate(args: GenerateArgs): Promise<string>;
}

/** MVP generator: background-removal cutout, composited and WebP-encoded. */
export class CutoutGenerator implements StickerGenerator {
  async generate({croppedUri, removeBg, outputUri}: GenerateArgs): Promise<string> {
    let sourceForEncode = croppedUri;

    if (removeBg) {
      const cutout = await removeBackground(croppedUri);
      if (cutout) {
        sourceForEncode = cutout;
      }
    }

    await encodeSticker({inputUri: sourceForEncode, outputUri});

    // Clean up an intermediate cutout file if one was produced.
    if (sourceForEncode !== croppedUri) {
      RNFS.unlink(sourceForEncode).catch(() => undefined);
    }

    return outputUri;
  }
}
