/** Lightweight app settings persisted in AsyncStorage. */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {DEFAULT_AI_CONFIG, type AIConfig} from '../ai/types';

export interface AppSettings {
  defaultPublisher: string;
  /** AI sticker generation config (Phase 6). Off by default. */
  ai: AIConfig;
}

const KEY = 'settings';
const DEFAULTS: AppSettings = {defaultPublisher: '', ai: DEFAULT_AI_CONFIG};

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) {
    return DEFAULTS;
  }
  const parsed = JSON.parse(raw) as Partial<AppSettings>;
  return {
    ...DEFAULTS,
    ...parsed,
    // Merge nested AI config so new fields get defaults on upgrade.
    ai: {...DEFAULT_AI_CONFIG, ...(parsed.ai ?? {})},
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
