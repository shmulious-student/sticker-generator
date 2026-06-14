/**
 * Pure geometry helpers for turning a detected face bounding box into a
 * well-framed, square sticker crop. No React Native imports here so this module
 * is fully unit-testable in a plain Node/Jest environment.
 */

import type {Rect} from '../types';

/** Output sticker edge length required by both WhatsApp and Telegram. */
export const STICKER_SIZE = 512;

/** Tray icon edge length required by WhatsApp. */
export const TRAY_ICON_SIZE = 96;

/** Default extra padding around the face box, as a fraction of the box size. */
export const DEFAULT_FACE_PADDING = 0.6;

/** Clamp a value into the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Given a face bounding box inside a source image, compute a square crop that
 * surrounds the face with padding and stays inside the image bounds.
 *
 * The crop is square so it maps cleanly onto the 512x512 sticker canvas without
 * distortion. When padding would push the square past an edge, the square is
 * shifted back inside the image; if the image is smaller than the desired
 * square, the square is shrunk to fit.
 */
export function computeStickerCrop(
  face: Rect,
  imageWidth: number,
  imageHeight: number,
  padding: number = DEFAULT_FACE_PADDING,
): Rect {
  const faceCenterX = face.x + face.width / 2;
  const faceCenterY = face.y + face.height / 2;

  // Desired square side: the larger face dimension grown by the padding factor.
  const base = Math.max(face.width, face.height);
  let side = base * (1 + padding);

  // Cannot exceed the smaller image dimension.
  side = Math.min(side, imageWidth, imageHeight);

  // Center the square on the face, then clamp the top-left so it stays inside.
  const x = clamp(faceCenterX - side / 2, 0, imageWidth - side);
  const y = clamp(faceCenterY - side / 2, 0, imageHeight - side);

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(side),
    height: Math.round(side),
  };
}

/**
 * Compute the destination rect for centering a (possibly non-square) cutout onto
 * the square sticker canvas while preserving aspect ratio ("contain" fit).
 * Used by the native compositor; exposed here so the math is testable.
 */
export function containOnCanvas(
  contentWidth: number,
  contentHeight: number,
  canvasSize: number = STICKER_SIZE,
): Rect {
  const scale = Math.min(
    canvasSize / contentWidth,
    canvasSize / contentHeight,
  );
  const width = Math.round(contentWidth * scale);
  const height = Math.round(contentHeight * scale);
  return {
    x: Math.round((canvasSize - width) / 2),
    y: Math.round((canvasSize - height) / 2),
    width,
    height,
  };
}
