import { Host, Slider } from '@expo/ui';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as Speech from 'expo-speech';
import type { Voice } from 'expo-speech';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { LanguageVoicePicker } from '@/components/LanguageVoicePicker';
import { OptionChips } from '@/components/OptionChips';
import { listensThisWeek, useAppStore } from '@/state/store';
import { parsePairsCsv, serializePairsToCsv } from '@/utils/csv';

const REPEAT_OPTIONS = [1, 2, 3].map(value => ({
  label: `${value}×`,
  value,
}));

export default function Settings() {
  const savedPairList = useAppStore(state => state.savedPairList);
  const sourceLanguage = useAppStore(state => state.sourceLanguage);
  const targetLanguage = useAppStore(state => state.targetLanguage);
  const sourceVoice = useAppStore(state => state.sourceVoice);
  const targetVoice = useAppStore(state => state.targetVoice);
  const playbackSettings = useAppStore(state => state.playbackSettings);
  const dailyListenCounts = useAppStore(state => state.dailyListenCounts);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Languages</Text>
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
      <Text style={styles.hint}>
        New pairs use these languages; each pair keeps its own.
      </Text>

      <Text style={styles.sectionTitle}>Playback</Text>
      <Text style={styles.settingLabel}>
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
      <Text style={styles.settingLabel}>
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
      <Text style={styles.settingLabel}>Repeats per pair</Text>
      <OptionChips
        options={REPEAT_OPTIONS}
        selected={playbackSettings.repeatsPerPair}
        onSelect={repeatsPerPair => updatePlaybackSettings({ repeatsPerPair })}
      />
      <View style={styles.switchRow}>
        <Text style={styles.settingLabel}>Loop playback</Text>
        <Switch
          value={playbackSettings.loop}
          onValueChange={loop => updatePlaybackSettings({ loop })}
        />
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchLabelGroup}>
          <Text style={styles.settingLabel}>Shuffle each loop</Text>
          <Text style={styles.hint}>
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

      <Text style={styles.sectionTitle}>Stats</Text>
      <Text style={styles.statLine}>{`Pairs: ${savedPairList.length}`}</Text>
      <Text style={styles.statLine}>{`Total listens: ${totalListens}`}</Text>
      <Text style={styles.statLine}>
        {`Listens this week: ${listensThisWeek(dailyListenCounts)}`}
      </Text>

      <Text style={styles.sectionTitle}>Data</Text>
      <TouchableOpacity style={styles.button} onPress={exportCsv}>
        <Text style={styles.buttonText}>Export as CSV</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={exportJson}>
        <Text style={styles.buttonText}>Export as JSON</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={importCsv}>
        <Text style={styles.buttonText}>Import from CSV</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        CSV columns: term, definition, sourceLanguage, targetLanguage. Rows
        already in your list are skipped.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Explicit light palette until Phase 4 theming.
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 48,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#111',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  slider: {
    width: '100%',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  switchLabelGroup: {
    flex: 1,
    gap: 2,
  },
  hint: {
    color: '#666',
    fontSize: 13,
  },
  statLine: {
    fontSize: 15,
    color: '#333',
  },
  button: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    color: '#333',
  },
});
