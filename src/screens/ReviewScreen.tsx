import React, {useCallback, useState} from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../navigation/types';
import {getPack, savePack} from '../storage/packStore';
import {includedCount} from '../export/validation';
import type {StickerPack} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export default function ReviewScreen({navigation, route}: Props) {
  const {packId} = route.params;
  const [pack, setPack] = useState<StickerPack | null>(null);

  useFocusEffect(
    useCallback(() => {
      getPack(packId).then(setPack);
    }, [packId]),
  );

  if (!pack) {
    return <View style={styles.container} />;
  }

  const update = (next: StickerPack) => setPack({...next});

  const toggle = (id: string) =>
    update({
      ...pack,
      stickers: pack.stickers.map(s =>
        s.id === id ? {...s, included: !s.included} : s,
      ),
    });

  const setEmoji = (id: string, emoji: string) =>
    update({
      ...pack,
      stickers: pack.stickers.map(s => (s.id === id ? {...s, emoji} : s)),
    });

  const saveAndContinue = async () => {
    await savePack(pack);
    navigation.replace('PackDetail', {packId});
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Pack name"
        value={pack.name}
        onChangeText={t => update({...pack, name: t})}
      />
      <TextInput
        style={styles.input}
        placeholder="Publisher (your name)"
        value={pack.publisher}
        onChangeText={t => update({...pack, publisher: t})}
      />
      <Text style={styles.counter}>
        {includedCount(pack)} included • WhatsApp needs 3–30
      </Text>

      <FlatList
        data={pack.stickers}
        numColumns={3}
        keyExtractor={s => s.id}
        renderItem={({item}) => (
          <View style={styles.cell}>
            <Pressable onPress={() => toggle(item.id)}>
              <Image
                source={{uri: item.fileUri}}
                style={[styles.sticker, !item.included && styles.excluded]}
              />
              {!item.included && <Text style={styles.excludedTag}>off</Text>}
            </Pressable>
            <TextInput
              style={styles.emoji}
              value={item.emoji}
              maxLength={2}
              onChangeText={t => setEmoji(item.id, t)}
            />
          </View>
        )}
      />

      <Pressable style={styles.cta} onPress={saveAndContinue}>
        <Text style={styles.ctaText}>Save pack</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  counter: {color: '#888', marginBottom: 8},
  cell: {flex: 1 / 3, alignItems: 'center', margin: 4},
  sticker: {width: 96, height: 96, borderRadius: 8, backgroundColor: '#f3f3f3'},
  excluded: {opacity: 0.25},
  excludedTag: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#0008',
    color: '#fff',
    fontSize: 10,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  emoji: {
    textAlign: 'center',
    fontSize: 20,
    marginTop: 4,
    minWidth: 40,
  },
  cta: {
    backgroundColor: '#1f6feb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
