/**
 * On-device background removal.
 *
 * Primary path: @six33/react-native-bg-removal
 *   - iOS 17+: Vision VNGenerateForegroundInstanceMaskRequest
 *   - Android: ML Kit Subject Segmentation
 *
 * Everything stays on-device — we never fall back to a network API. On older iOS
 * (<17) the library's subject path is unavailable; callers should treat a thrown
 * error as "keep the original crop" so generation still succeeds.
 *
 * TODO(Phase 2): if @six33 attempts a network fallback, fork it / gate it off so
 * we remain strictly on-device per the product requirement.
 */

import {removeBackground as nativeRemoveBackground} from '@six33/react-native-bg-removal';

/**
 * Remove the background from an image, returning the path to a transparent PNG.
 * Returns `null` if removal is unsupported on this device so the caller can fall
 * back to the original (opaque) crop.
 */
export async function removeBackground(inputUri: string): Promise<string | null> {
  try {
    // The native lib loads via URL(string:)+CIImage(contentsOf:), which needs a
    // proper file:// URL. Our pipeline passes bare filesystem paths, so prefix
    // them (leave already-schemed uris like file:// or ph:// untouched).
    const fileUri = inputUri.includes('://') ? inputUri : `file://${inputUri}`;
    const result = await nativeRemoveBackground(fileUri);
    return result ?? null;
  } catch (err) {
    if (__DEV__) {
      console.warn('Background removal unavailable, using original crop:', err);
    }
    return null;
  }
}
