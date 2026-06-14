import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../navigation/types';
import {getSettings, saveSettings} from '../storage/settings';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({navigation}: Props) {
  const [publisher, setPublisher] = useState('');

  useEffect(() => {
    getSettings().then(s => setPublisher(s.defaultPublisher));
  }, []);

  const save = async () => {
    await saveSettings({defaultPublisher: publisher});
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Default publisher name</Text>
      <Text style={styles.help}>
        Shown as the author of packs you create. You can override it per pack.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Your name"
        value={publisher}
        onChangeText={setPublisher}
      />
      <Pressable style={styles.cta} onPress={save}>
        <Text style={styles.ctaText}>Save</Text>
      </Pressable>

      <Text style={styles.about}>
        Sticker Generator processes your photos entirely on your device. Nothing
        is uploaded.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  label: {fontSize: 16, fontWeight: '600'},
  help: {color: '#888', marginTop: 4, marginBottom: 12},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cta: {
    backgroundColor: '#1f6feb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  ctaText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  about: {color: '#aaa', marginTop: 32, fontSize: 12},
});
