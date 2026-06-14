/**
 * On-device face detection using Google ML Kit via @react-native-ml-kit/face-detection.
 * Maps detector output into our DetectedFace domain type.
 */

import FaceDetection from '@react-native-ml-kit/face-detection';
import type {DetectedFace} from '../types';

/**
 * Detect faces in a single photo. Returns one DetectedFace per face found,
 * with a stable id of the form `${sourceUri}#${index}`.
 */
export async function detectFaces(sourceUri: string): Promise<DetectedFace[]> {
  const faces = await FaceDetection.detect(sourceUri, {
    landmarkMode: 'none',
    contourMode: 'none',
    classificationMode: 'none',
    performanceMode: 'accurate',
  });

  return faces.map((face, index) => ({
    id: `${sourceUri}#${index}`,
    sourceUri,
    bounds: {
      x: face.frame.left,
      y: face.frame.top,
      width: face.frame.width,
      height: face.frame.height,
    },
  }));
}

/** Detect faces across many photos, flattening the result. */
export async function detectFacesInMany(
  sourceUris: string[],
): Promise<DetectedFace[]> {
  const perPhoto = await Promise.all(sourceUris.map(detectFaces));
  return perPhoto.flat();
}
