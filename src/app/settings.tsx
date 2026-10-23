import { Host, Slider } from '@expo/ui';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as Speech from 'expo-speech';
import type { Voice } from 'expo-speech';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';

import { LanguageVoicePicker } from '@/components/LanguageVoicePicker';
import { OptionChips } from '@/components/OptionChips';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { listensThisWeek, useAppStore } from '@/state/store';
import { ThemeSetting } from '@/state/types';
import { parsePairsCsv, serializePairsToCsv } from '@/utils/csv';

const REPEAT_OPTIONS = [1, 2, 3].map(value => ({
  label: `${value}×`,
  value,
}));

const THEME_SEGMENTS: { value: ThemeSetting; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function Settings() {
  const colors = useTheme();

  const savedPairList = useAppStore(state => state.savedPairList);
  const sourceLanguage = useAppStore(state => state.sourceLanguage);
  const targetLanguage = useAppStore(state => state.targetLanguage);
  const sourceVoice = useAppStore(state => state.sourceVoice);
  const targetVoice = useAppStore(state => state.targetVoice);
  const playbackSettings = useAppStore(state => state.playbackSettings);
  const dailyListenCounts = useAppStore(state => state.dailyListenCounts);
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);
  const updateLanguages = useAppStore(state => state.updateLanguages);
  const updatePlaybackSettings = useAppStore(
    state => state.updatePlaybackSettings,
  );
  const importPairs = useAppStore(state => state.importPairs);

  const [voices, setVoices] = useState<Voice[]>([]);

  useEffect(() => {
    let cancelled = false;
    Speech.getAvailableVoicesAsync()
      .then(available => {
        if (!cancelled) setVoices(available);
      })
      .catch(() => {
        // Voice listing is best-effort; the pickers show a hint when empty.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalListens = savedPairList.reduce(
    (sum, pair) => sum + pair.timesListened,
    0,
  );

  const exportCsv = () =>
    Share.share({ message: serializePairsToCsv(savedPairList) });

  const exportJson = () =>
    Share.share({ message: JSON.stringify(savedPairList, null, 2) });

  const importCsv = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    try {
      const text = await new File(result.assets[0].uri).text();
      const rows = parsePairsCsv(text);
      const existing = new Set(
        savedPairList.map(
          pair => `${pair.term.toLowerCase()}|${pair.definition.toLowerCase()}`,
        ),
      );
      const fresh = rows.filter(
        row =>
          !existing.has(
            `${row.term.toLowerCase()}|${row.definition.toLowerCase()}`,
          ),
      );
      importPairs(
        fresh.map(row => ({
          term: row.term,
          definition: row.definition,
          sourceLanguage: row.sourceLanguage ?? sourceLanguage,
          targetLanguage: row.targetLanguage ?? targetLanguage,
        })),
      );
      Alert.alert(
        'Import complete',
        `Added ${fresh.length} pairs (${rows.length - fresh.length} duplicates skipped).`,
      );
    } catch {
      Alert.alert(
        'Import failed',
        'Could not read that file as CSV. Expected columns: term, definition, and optionally sourceLanguage, targetLanguage.',
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text variant="heading" style={styles.sectionTitle}>
        Appearance
      </Text>
      <SegmentedControl
        segments={THEME_SEGMENTS}
        value={theme}
        onChange={setTheme}
      />

      <Text variant="heading" style={styles.sectionTitle}>
        Languages
      </Text>
      <LanguageVoicePicker
        label="Term language"
        voices={voices}
        language={sourceLanguage}
        voice={sourceVoice}
        onChange={(language, voice) =>
          updateLanguages({ sourceLanguage: language, sourceVoice: voice })
        }
      />
      <LanguageVoicePicker
        label="Definition language"
        voices={voices}
        language={targetLanguage}
        voice={targetVoice}
        onChange={(language, voice) =>
          updateLanguages({ targetLanguage: language, targetVoice: voice })
        }
      />
      <Text variant="caption" color="textSecondary">
        New pairs use these languages; each pair keeps its own.
      </Text>

      <Text variant="heading" style={styles.sectionTitle}>
        Playback
      </Text>
      <Text variant="bodyBold">
        {`Speed: ${playbackSettings.rate.toFixed(1)}×`}
      </Text>
      <Host matchContents={{ vertical: true }} style={styles.slider}>
        <Slider
          value={playbackSettings.rate}
          min={0.5}
          max={1.5}
          step={0.1}
          onValueChange={value =>
            updatePlaybackSettings({ rate: Math.round(value * 10) / 10 })
          }
        />
      </Host>
      <Text variant="bodyBold">
        {`Pause between words: ${(playbackSettings.gapMs / 1000).toFixed(1)}s`}
      </Text>
      <Host matchContents={{ vertical: true }} style={styles.slider}>
        <Slider
          value={playbackSettings.gapMs / 1000}
          min={0}
          max={3}
          step={0.1}
          onValueChange={value =>
            updatePlaybackSettings({ gapMs: Math.round(value * 10) * 100 })
          }
        />
      </Host>
      <Text variant="bodyBold">Repeats per pair</Text>
      <OptionChips
        options={REPEAT_OPTIONS}
        selected={playbackSettings.repeatsPerPair}
        onSelect={repeatsPerPair => updatePlaybackSettings({ repeatsPerPair })}
      />
      <View style={styles.switchRow}>
        <Text variant="bodyBold">Loop playback</Text>
        <Switch
          value={playbackSettings.loop}
          onValueChange={loop => updatePlaybackSettings({ loop })}
        />
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchLabelGroup}>
          <Text variant="bodyBold">Shuffle each loop</Text>
          <Text variant="caption" color="textSecondary">
            Familiarity-weighted: well-known pairs come up less often.
          </Text>
        </View>
        <Switch
          value={playbackSettings.shuffleEachLoop}
          onValueChange={shuffleEachLoop =>
            updatePlaybackSettings({ shuffleEachLoop })
          }
        />
      </View>

      <Text variant="heading" style={styles.sectionTitle}>
        Stats
      </Text>
      <Text>{`Pairs: ${savedPairList.length}`}</Text>
      <Text>{`Total listens: ${totalListens}`}</Text>
      <Text>{`Listens this week: ${listensThisWeek(dailyListenCounts)}`}</Text>

      <Text variant="heading" style={styles.sectionTitle}>
        Data
      </Text>
      <Button title="Export as CSV" variant="secondary" onPress={exportCsv} />
      <Button title="Export as JSON" variant="secondary" onPress={exportJson} />
      <Button title="Import from CSV" variant="secondary" onPress={importCsv} />
      <Text variant="caption" color="textSecondary">
        CSV columns: term, definition, sourceLanguage, targetLanguage. Rows
        already in your list are skipped.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two + Spacing.one,
    paddingBottom: Spacing.six,
  },
  sectionTitle: {
    marginTop: Spacing.three,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  switchLabelGroup: {
    flex: 1,
    gap: Spacing.half,
  },
  slider: {
    width: '100%',
  },
});
