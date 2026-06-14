/** Lightweight app settings persisted in AsyncStorage. */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  defaultPublisher: string;
}

const KEY = 'settings';
const DEFAULTS: AppSettings = {defaultPublisher: ''};

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? {...DEFAULTS, ...(JSON.parse(raw) as AppSettings)} : DEFAULTS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
