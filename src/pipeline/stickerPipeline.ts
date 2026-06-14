/**
 * Orchestrates the on-device sticker pipeline:
 *
 *   photos → detect faces → square crop (geometry) → generate (cutout + WebP)
 *
 * The generation step is pluggable via the StickerGenerator interface so the
 * future AI phase can swap implementations without touching this orchestrator.
 */

import RNFS from 'react-native-fs';
import {detectFaces} from './faceDetection';
import {computeStickerCrop} from './geometry';
import {CutoutGenerator, type StickerGenerator} from './CutoutGenerator';
import {cropToFile, encodeTrayIcon} from '../native/WebPEncoder';
import {imageSize} from '../native/imageInfo';
import type {StickerCandidate} from '../types';

export interface PipelineProgress {
  /** 0..1 overall progress. */
  fraction: number;
  /** Human-readable current step, e.g. "Cutting out face 3 of 8". */
  label: string;
}

export interface RunPipelineArgs {
  sourceUris: string[];
  packId: string;
  generator?: StickerGenerator;
  onProgress?: (p: PipelineProgress) => void;
}

export interface PipelineResult {
  stickers: StickerCandidate[];
  /** Path to the generated tray icon, if any stickers were produced. */
  trayImageFileUri?: string;
}

/** Directory where a pack's generated assets live. */
export function packDir(packId: string): string {
  return `${RNFS.DocumentDirectoryPath}/packs/${packId}`;
}

/**
 * Run the full pipeline over the selected photos and return sticker candidates.
 * Files are written under packDir(packId). Stickers default to included with a
 * neutral emoji the user can change in the Review screen.
 */
export async function runPipeline({
  sourceUris,
  packId,
  generator = new CutoutGenerator(),
  onProgress,
}: RunPipelineArgs): Promise<PipelineResult> {
  const dir = packDir(packId);
  await RNFS.mkdir(dir);

  onProgress?.({fraction: 0, label: 'Detecting faces…'});

  // 1. Detect faces across all photos.
  const faces: {sourceUri: string; index: number; bounds: ReturnType<typeof computeStickerCrop>}[] = [];
  for (const uri of sourceUris) {
    const {width, height} = await imageSize(uri);
    const detected = await detectFaces(uri);
    detected.forEach((face, i) => {
      faces.push({
        sourceUri: uri,
        index: faces.length + i,
        bounds: computeStickerCrop(face.bounds, width, height),
      });
    });
  }

  if (faces.length === 0) {
    return {stickers: []};
  }

  // 2. Crop + generate each face into a sticker.
  const candidates: StickerCandidate[] = [];
  for (let i = 0; i < faces.length; i++) {
    const face = faces[i];
    onProgress?.({
      fraction: (i + 1) / (faces.length + 1),
      label: `Creating sticker ${i + 1} of ${faces.length}…`,
    });

    const croppedUri = `${dir}/crop_${i}.png`;
    const stickerUri = `${dir}/sticker_${i}.webp`;

    await cropToFile(face.sourceUri, croppedUri, face.bounds);
    await generator.generate({
      croppedUri,
      removeBg: true,
      outputUri: stickerUri,
    });
    RNFS.unlink(croppedUri).catch(() => undefined);

    candidates.push({
      id: `${packId}#${i}`,
      sourceUri: face.sourceUri,
      crop: face.bounds,
      emoji: '😀',
      included: true,
      removeBackground: true,
      fileUri: stickerUri,
    });
  }

  // 3. Tray icon from the first sticker.
  let trayImageFileUri: string | undefined;
  if (candidates[0]?.fileUri) {
    const trayUri = `${dir}/tray.png`;
    const ok = await encodeTrayIcon(candidates[0].fileUri, trayUri)
      .then(() => true)
      .catch(() => false);
    if (ok) {
      trayImageFileUri = trayUri;
    }
  }

  onProgress?.({fraction: 1, label: 'Done'});
  return {stickers: candidates, trayImageFileUri};
}
