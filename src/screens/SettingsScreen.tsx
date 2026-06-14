import React, {useEffect, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../navigation/types';
import {getSettings, saveSettings} from '../storage/settings';
import {DEFAULT_AI_CONFIG, type AIConfig, type AIProviderId} from '../ai/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const PROVIDERS: {id: AIProviderId; label: string; hint: string}[] = [
  {id: 'gemini', label: 'Gemini', hint: 'Free tier · fast'},
  {id: 'replicate', label: 'Replicate', hint: 'Best quality · paid'},
];

export default function SettingsScreen({navigation}: Props) {
  const [publisher, setPublisher] = useState('');
  const [ai, setAi] = useState<AIConfig>(DEFAULT_AI_CONFIG);

  useEffect(() => {
    getSettings().then(s => {
      setPublisher(s.defaultPublisher);
      setAi(s.ai);
    });
  }, []);

  const save = async () => {
    await saveSettings({defaultPublisher: publisher, ai});
    navigation.goBack();
  };

  const patchAi = (patch: Partial<AIConfig>) => setAi(prev => ({...prev, ...patch}));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>AI stickers</Text>
        <Switch
          value={ai.enabled}
          onValueChange={v => patchAi({enabled: v})}
        />
      </View>
      <Text style={styles.help}>
        Generate stickers from your faces with an AI prompt instead of a plain
        cutout. Requires an API key and sends images to the selected provider.
      </Text>

      {ai.enabled && (
        <>
          <Text style={styles.subLabel}>Provider</Text>
          <View style={styles.providerRow}>
            {PROVIDERS.map(p => {
              const selected = ai.provider === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={[styles.provider, selected && styles.providerSelected]}
                  onPress={() => patchAi({provider: p.id})}>
                  <Text style={[styles.providerLabel, selected && styles.providerLabelSelected]}>
                    {p.label}
                  </Text>
                  <Text style={[styles.providerHint, selected && styles.providerLabelSelected]}>
                    {p.hint}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.subLabel}>Default prompt</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. cartoon astronaut"
            value={ai.prompt}
            onChangeText={t => patchAi({prompt: t})}
            multiline
          />

          {ai.provider === 'gemini' ? (
            <>
              <Text style={styles.subLabel}>Gemini API key</Text>
              <TextInput
                style={styles.input}
                placeholder="AIza… / AQ.…"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                value={ai.geminiApiKey ?? ''}
                onChangeText={t => patchAi({geminiApiKey: t})}
              />
            </>
          ) : (
            <>
              <Text style={styles.subLabel}>Replicate API token</Text>
              <TextInput
                style={styles.input}
                placeholder="r8_…"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                value={ai.replicateApiKey ?? ''}
                onChangeText={t => patchAi({replicateApiKey: t})}
              />
            </>
          )}

          <Text style={styles.warn}>
            Keys are stored on this device only. With AI enabled, your photos are
            sent to the selected provider — this is the one feature that is not
            on-device.
          </Text>
        </>
      )}

      <Pressable style={styles.cta} onPress={save}>
        <Text style={styles.ctaText}>Save</Text>
      </Pressable>

      <Text style={styles.about}>
        Without AI, Sticker Generator processes your photos entirely on your
        device and nothing is uploaded.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 16},
  label: {fontSize: 16, fontWeight: '600'},
  subLabel: {fontSize: 14, fontWeight: '600', marginTop: 14, marginBottom: 6},
  help: {color: '#888', marginTop: 4, marginBottom: 12},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  divider: {height: 1, backgroundColor: '#eee', marginVertical: 20},
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  providerRow: {flexDirection: 'row', gap: 10},
  provider: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
  },
  providerSelected: {borderColor: '#1f6feb', backgroundColor: '#eaf2ff'},
  providerLabel: {fontWeight: '600', color: '#333'},
  providerLabelSelected: {color: '#1f6feb'},
  providerHint: {fontSize: 12, color: '#888', marginTop: 2},
  warn: {color: '#a15c00', backgroundColor: '#fff5e6', padding: 10, borderRadius: 8, marginTop: 14, fontSize: 12},
  cta: {
    backgroundColor: '#1f6feb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  ctaText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  about: {color: '#aaa', marginTop: 24, fontSize: 12},
});
