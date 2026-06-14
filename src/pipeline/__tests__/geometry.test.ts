import {
  clamp,
  computeStickerCrop,
  containOnCanvas,
  STICKER_SIZE,
} from '../geometry';

describe('clamp', () => {
  it('clamps below, within and above the range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(50, 0, 10)).toBe(10);
  });
});

describe('computeStickerCrop', () => {
  it('produces a square crop centered on the face with padding', () => {
    const face = {x: 100, y: 100, width: 100, height: 100};
    const crop = computeStickerCrop(face, 1000, 1000, 0.6);
    expect(crop.width).toBe(crop.height); // square
    expect(crop.width).toBe(160); // 100 * 1.6
    // centered: face center is (150,150), so top-left = 150 - 80 = 70
    expect(crop.x).toBe(70);
    expect(crop.y).toBe(70);
  });

  it('keeps the crop inside the image when the face is near an edge', () => {
    const face = {x: 0, y: 0, width: 100, height: 100};
    const crop = computeStickerCrop(face, 1000, 1000, 0.6);
    expect(crop.x).toBeGreaterThanOrEqual(0);
    expect(crop.y).toBeGreaterThanOrEqual(0);
    expect(crop.x + crop.width).toBeLessThanOrEqual(1000);
    expect(crop.y + crop.height).toBeLessThanOrEqual(1000);
  });

  it('shrinks the square to fit a small image', () => {
    const face = {x: 10, y: 10, width: 80, height: 80};
    const crop = computeStickerCrop(face, 100, 60, 0.6);
    expect(crop.width).toBeLessThanOrEqual(60);
    expect(crop.height).toBeLessThanOrEqual(60);
    expect(crop.x + crop.width).toBeLessThanOrEqual(100);
    expect(crop.y + crop.height).toBeLessThanOrEqual(60);
  });
});

describe('containOnCanvas', () => {
  it('fits a wide image and centers it', () => {
    const dest = containOnCanvas(1000, 500);
    expect(dest.width).toBe(STICKER_SIZE);
    expect(dest.height).toBe(256);
    expect(dest.x).toBe(0);
    expect(dest.y).toBe(128); // (512 - 256) / 2
  });

  it('fits a square image exactly', () => {
    const dest = containOnCanvas(200, 200);
    expect(dest.width).toBe(STICKER_SIZE);
    expect(dest.height).toBe(STICKER_SIZE);
    expect(dest.x).toBe(0);
    expect(dest.y).toBe(0);
  });
});
