import React, {useCallback, useState} from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../navigation/types';
import {listPacks} from '../storage/packStore';
import type {StickerPack} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({navigation}: Props) {
  const [packs, setPacks] = useState<StickerPack[]>([]);

  useFocusEffect(
    useCallback(() => {
      listPacks().then(setPacks);
    }, []),
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.headerButton}>⚙️</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <FlatList
        data={packs}
        keyExtractor={p => p.identifier}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No packs yet. Tap “Create new pack” to turn your photos into
            stickers.
          </Text>
        }
        renderItem={({item}) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate('PackDetail', {packId: item.identifier})
            }>
            {item.trayImageFileUri ? (
              <Image source={{uri: item.trayImageFileUri}} style={styles.tray} />
            ) : (
              <View style={[styles.tray, styles.trayPlaceholder]} />
            )}
            <View style={styles.rowText}>
              <Text style={styles.packName}>{item.name || 'Untitled pack'}</Text>
              <Text style={styles.packMeta}>
                {item.stickers.filter(s => s.included).length} stickers
              </Text>
            </View>
          </Pressable>
        )}
      />
      <Pressable
        style={styles.cta}
        onPress={() => navigation.navigate('SelectPhotos')}>
        <Text style={styles.ctaText}>＋ Create new pack</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  headerButton: {fontSize: 20},
  empty: {textAlign: 'center', color: '#666', marginTop: 48, paddingHorizontal: 24},
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 12},
  tray: {width: 48, height: 48, borderRadius: 8, backgroundColor: '#eee'},
  trayPlaceholder: {borderWidth: 1, borderColor: '#ddd'},
  rowText: {marginLeft: 12},
  packName: {fontSize: 16, fontWeight: '600'},
  packMeta: {color: '#888', marginTop: 2},
  cta: {
    backgroundColor: '#1f6feb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
