/**
 * Image dimension helper built on React Native's built-in Image.getSize —
 * no custom native module required.
 */

import {Image} from 'react-native';

export interface ImageSize {
  width: number;
  height: number;
}

/** Resolve the pixel dimensions of an image at the given uri/path. */
export function imageSize(uri: string): Promise<ImageSize> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({width, height}),
      reject,
    );
  });
}
