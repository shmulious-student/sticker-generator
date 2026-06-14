/**
 * AIGenerator: the Phase-6 implementation of the StickerGenerator seam.
 *
 * Instead of cutting out the original face (CutoutGenerator), it sends the cropped
 * face + prompt to an AI provider, materializes the result to a file, optionally
 * removes the background, then reuses the same `encodeSticker` native step so the
 * output is an identical 512x512 WebP. The orchestrator in stickerPipeline.ts does
 * not change — it just receives this generator instead of the default.
 */

import RNFS from 'react-native-fs';

import {encodeSticker} from '../native/WebPEncoder';
import {removeBackground} from '../pipeline/backgroundRemoval';
import type {GenerateArgs, StickerGenerator} from '../pipeline/CutoutGenerator';
import {AIError} from './types';
import type {AIProvider} from './types';

export interface AIGeneratorArgs {
  provider: AIProvider;
  /** Fully-built prompt applied to every face in the pack. */
  prompt: string;
}

export class AIGenerator implements StickerGenerator {
  constructor(private args: AIGeneratorArgs) {}

  async generate({croppedUri, removeBg, outputUri}: GenerateArgs): Promise<string> {
    const faceBase64 = await RNFS.readFile(croppedUri, 'base64');

    const result = await this.args.provider.generate({
      faceBase64,
      faceMime: 'image/png',
      prompt: this.args.prompt,
    });

    // Materialize the AI image to a local file the native encoder can read.
    const aiUri = `${outputUri}.ai.png`;
    if (result.kind === 'base64') {
      await RNFS.writeFile(aiUri, result.data, 'base64');
    } else {
      const download = await RNFS.downloadFile({
        fromUrl: result.url,
        toFile: aiUri,
      }).promise;
      if (download.statusCode && download.statusCode >= 400) {
        throw new AIError(`Failed to download generated image (${download.statusCode}).`);
      }
    }

    // Same finishing path as CutoutGenerator: optional bg removal, then WebP encode.
    let sourceForEncode = aiUri;
    if (removeBg) {
      const cutout = await removeBackground(aiUri);
      if (cutout) {
        sourceForEncode = cutout;
      }
    }

    await encodeSticker({inputUri: sourceForEncode, outputUri});

    RNFS.unlink(aiUri).catch(() => undefined);
    if (sourceForEncode !== aiUri) {
      RNFS.unlink(sourceForEncode).catch(() => undefined);
    }

    return outputUri;
  }
}
