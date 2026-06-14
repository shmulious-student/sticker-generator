import React, {useCallback, useState} from 'react';
import {
  Alert,
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
import {deletePack, getPack} from '../storage/packStore';
import {addToWhatsApp} from '../export/whatsapp';
import {importToTelegram} from '../export/telegram';
import type {StickerPack} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PackDetail'>;

export default function PackDetailScreen({navigation, route}: Props) {
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

  const included = pack.stickers.filter(s => s.included);

  const exportWhatsApp = async () => {
    try {
      await addToWhatsApp(pack);
    } catch (e) {
      Alert.alert('Can’t add to WhatsApp', e instanceof Error ? e.message : String(e));
    }
  };

  const exportTelegram = async () => {
    try {
      await importToTelegram(pack);
      Alert.alert(
        'Imported to Telegram',
        'Telegram created a new sticker set for you. Note: each import makes a new set.',
      );
    } catch (e) {
      Alert.alert('Can’t import to Telegram', e instanceof Error ? e.message : String(e));
    }
  };

  const remove = () =>
    Alert.alert('Delete pack?', 'This removes the pack and its stickers.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePack(packId);
          navigation.popToTop();
        },
      },
    ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{pack.name || 'Untitled pack'}</Text>
      <Text style={styles.meta}>
        by {pack.publisher || 'unknown'} • {included.length} stickers
      </Text>

      <FlatList
        data={included}
        numColumns={4}
        keyExtractor={s => s.id}
        renderItem={({item}) => (
          <Image source={{uri: item.fileUri}} style={styles.sticker} />
        )}
      />

      <Pressable style={[styles.cta, styles.wa]} onPress={exportWhatsApp}>
        <Text style={styles.ctaText}>Add to WhatsApp</Text>
      </Pressable>
      <Pressable style={[styles.cta, styles.tg]} onPress={exportTelegram}>
        <Text style={styles.ctaText}>Import to Telegram</Text>
      </Pressable>
      <Pressable
        style={styles.secondary}
        onPress={() => navigation.navigate('Review', {packId})}>
        <Text style={styles.secondaryText}>Edit stickers</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={remove}>
        <Text style={[styles.secondaryText, styles.delete]}>Delete pack</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  title: {fontSize: 22, fontWeight: '700'},
  meta: {color: '#888', marginTop: 4, marginBottom: 12},
  sticker: {width: 72, height: 72, margin: 4, borderRadius: 8, backgroundColor: '#f3f3f3'},
  cta: {paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8},
  wa: {backgroundColor: '#25D366'},
  tg: {backgroundColor: '#229ED9'},
  ctaText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  secondary: {paddingVertical: 12, alignItems: 'center'},
  secondaryText: {color: '#1f6feb', fontWeight: '600'},
  delete: {color: '#c00'},
});
