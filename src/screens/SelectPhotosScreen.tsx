import React, {useState} from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectPhotos'>;

export default function SelectPhotosScreen({navigation}: Props) {
  const [uris, setUris] = useState<string[]>([]);

  const pick = async () => {
    const res = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 0, // 0 = unlimited multi-select
      quality: 1,
    });
    if (res.assets) {
      const picked = res.assets
        .map(a => a.uri)
        .filter((u): u is string => !!u);
      setUris(prev => Array.from(new Set([...prev, ...picked])));
    }
  };

  const start = () => {
    const packId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    navigation.replace('Generating', {packId, sourceUris: uris});
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.pick} onPress={pick}>
        <Text style={styles.pickText}>
          {uris.length ? 'Add more photos' : 'Pick portrait photos'}
        </Text>
      </Pressable>

      <FlatList
        data={uris}
        numColumns={3}
        keyExtractor={u => u}
        contentContainerStyle={styles.grid}
        renderItem={({item}) => (
          <Image source={{uri: item}} style={styles.thumb} />
        )}
        ListEmptyComponent={
          <Text style={styles.hint}>
            Choose photos with clear faces. We’ll find every face and make a
            sticker from each one.
          </Text>
        }
      />

      <Pressable
        style={[styles.cta, !uris.length && styles.ctaDisabled]}
        disabled={!uris.length}
        onPress={start}>
        <Text style={styles.ctaText}>
          Generate stickers{uris.length ? ` (${uris.length} photos)` : ''}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  pick: {
    borderWidth: 1,
    borderColor: '#1f6feb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  pickText: {color: '#1f6feb', fontWeight: '600'},
  grid: {gap: 4},
  thumb: {flex: 1 / 3, aspectRatio: 1, margin: 2, borderRadius: 6, backgroundColor: '#eee'},
  hint: {textAlign: 'center', color: '#666', marginTop: 32, paddingHorizontal: 24},
  cta: {
    backgroundColor: '#1f6feb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  ctaDisabled: {backgroundColor: '#aaa'},
  ctaText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
