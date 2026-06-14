import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../navigation/types';
import {runPipeline} from '../pipeline/stickerPipeline';
import {savePack} from '../storage/packStore';
import {getSettings} from '../storage/settings';
import {createAIGenerator} from '../ai';

type Props = NativeStackScreenProps<RootStackParamList, 'Generating'>;

export default function GeneratingScreen({navigation, route}: Props) {
  const {packId, sourceUris, prompt} = route.params;
  const [label, setLabel] = useState('Starting…');
  const [fraction, setFraction] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await getSettings();
        // Use the AI generator when enabled; otherwise the on-device cutout.
        const generator = createAIGenerator(settings.ai, prompt) ?? undefined;

        const {stickers, trayImageFileUri} = await runPipeline({
          packId,
          sourceUris,
          generator,
          onProgress: p => {
            if (!cancelled) {
              setLabel(p.label);
              setFraction(p.fraction);
            }
          },
        });

        if (cancelled) {
          return;
        }

        if (stickers.length === 0) {
          setError('No faces found in the selected photos. Try other photos.');
          return;
        }

        await savePack({
          identifier: packId,
          name: '',
          publisher: settings.defaultPublisher,
          trayImageFileUri,
          stickers,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        navigation.replace('Review', {packId});
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigation, packId, sourceUris, prompt]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.link} onPress={() => navigation.replace('Home')}>
          Back to my packs
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1f6feb" />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, {width: `${Math.round(fraction * 100)}%`}]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  label: {marginTop: 16, color: '#444'},
  barTrack: {
    width: '80%',
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  barFill: {height: 6, backgroundColor: '#1f6feb'},
  error: {color: '#c00', textAlign: 'center', marginBottom: 16},
  link: {color: '#1f6feb', fontWeight: '600'},
});
