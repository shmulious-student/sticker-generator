import {includedCount, validatePack} from '../validation';
import type {StickerCandidate, StickerPack} from '../../types';

function makeSticker(over: Partial<StickerCandidate> = {}): StickerCandidate {
  return {
    id: Math.random().toString(36).slice(2),
    sourceUri: 'file:///photo.jpg',
    crop: {x: 0, y: 0, width: 512, height: 512},
    emoji: '😀',
    included: true,
    removeBackground: true,
    fileUri: 'file:///sticker.webp',
    ...over,
  };
}

function makePack(stickers: StickerCandidate[], over: Partial<StickerPack> = {}): StickerPack {
  return {
    identifier: 'pack-1',
    name: 'My Pack',
    publisher: 'Me',
    trayImageFileUri: 'file:///tray.png',
    stickers,
    createdAt: 0,
    updatedAt: 0,
    ...over,
  };
}

describe('includedCount', () => {
  it('counts only included stickers', () => {
    const pack = makePack([
      makeSticker({included: true}),
      makeSticker({included: false}),
      makeSticker({included: true}),
    ]);
    expect(includedCount(pack)).toBe(2);
  });
});

describe('validatePack — whatsapp', () => {
  it('passes a well-formed pack of 3 stickers', () => {
    const pack = makePack([makeSticker(), makeSticker(), makeSticker()]);
    expect(validatePack(pack, 'whatsapp')).toEqual({ok: true, errors: []});
  });

  it('fails when fewer than 3 stickers are included', () => {
    const pack = makePack([makeSticker(), makeSticker()]);
    const res = validatePack(pack, 'whatsapp');
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/at least 3/);
  });

  it('fails when more than 30 stickers are included', () => {
    const pack = makePack(Array.from({length: 31}, () => makeSticker()));
    const res = validatePack(pack, 'whatsapp');
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/at most 30/);
  });

  it('fails when the tray icon is missing', () => {
    const pack = makePack([makeSticker(), makeSticker(), makeSticker()], {
      trayImageFileUri: undefined,
    });
    const res = validatePack(pack, 'whatsapp');
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/tray icon/);
  });

  it('fails when a sticker is missing its emoji or file', () => {
    const pack = makePack([
      makeSticker({emoji: ''}),
      makeSticker({fileUri: undefined}),
      makeSticker(),
    ]);
    const res = validatePack(pack, 'whatsapp');
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/emoji/);
    expect(res.errors.join(' ')).toMatch(/finished generating/);
  });
});

describe('validatePack — telegram', () => {
  it('passes with a single sticker (no 3-minimum)', () => {
    const pack = makePack([makeSticker()], {trayImageFileUri: undefined});
    expect(validatePack(pack, 'telegram')).toEqual({ok: true, errors: []});
  });

  it('fails when empty', () => {
    const pack = makePack([makeSticker({included: false})]);
    const res = validatePack(pack, 'telegram');
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/at least one sticker/);
  });
});
