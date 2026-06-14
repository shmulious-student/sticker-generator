/**
 * Pack persistence. Metadata lives in AsyncStorage; the heavy assets (.webp,
 * tray .png) live on disk under packDir() and are referenced by path. This keeps
 * AsyncStorage small while assets stay in the app sandbox.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import {packDir} from '../pipeline/stickerPipeline';
import type {StickerPack} from '../types';

const INDEX_KEY = 'packs:index';
const packKey = (id: string) => `pack:${id}`;

/** Return all pack identifiers, newest first. */
async function readIndex(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

async function writeIndex(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

/** Load a single pack by id. */
export async function getPack(id: string): Promise<StickerPack | null> {
  const raw = await AsyncStorage.getItem(packKey(id));
  return raw ? (JSON.parse(raw) as StickerPack) : null;
}

/** Load all packs, newest first. */
export async function listPacks(): Promise<StickerPack[]> {
  const ids = await readIndex();
  const packs = await Promise.all(ids.map(getPack));
  return packs.filter((p): p is StickerPack => p !== null);
}

/** Create or update a pack and keep the index in sync. */
export async function savePack(pack: StickerPack): Promise<void> {
  const next: StickerPack = {...pack, updatedAt: Date.now()};
  await AsyncStorage.setItem(packKey(pack.identifier), JSON.stringify(next));
  const ids = await readIndex();
  if (!ids.includes(pack.identifier)) {
    await writeIndex([pack.identifier, ...ids]);
  }
}

/** Delete a pack's metadata and on-disk assets. */
export async function deletePack(id: string): Promise<void> {
  await AsyncStorage.removeItem(packKey(id));
  await writeIndex((await readIndex()).filter(x => x !== id));
  await RNFS.unlink(packDir(id)).catch(() => undefined);
}
