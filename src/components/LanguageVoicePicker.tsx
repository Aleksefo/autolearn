import Ionicons from '@expo/vector-icons/Ionicons';
import type { Voice } from 'expo-speech';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { OptionChips } from './OptionChips';

// Collapsible language + voice selector fed by the device's speech voices.
export function LanguageVoicePicker({
  label,
  voices,
  language,
  voice,
  onChange,
}: {
  label: string;
  voices: Voice[];
  language: string;
  voice: string | undefined;
  onChange: (language: string, voice: string | undefined) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const languages = useMemo(
    () =>
      [...new Set(voices.map(item => item.language))]
        .sort()
        .map(tag => ({ label: tag, value: tag })),
    [voices],
  );

  const voicesForLanguage = useMemo(
    () =>
      voices.filter(
        item =>
          item.language === language ||
          item.language.startsWith(`${language}-`),
      ),
    [voices, language],
  );

  const selectedVoiceName = voicesForLanguage.find(
    item => item.identifier === voice,
  )?.name;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(current => !current)}
        accessibilityLabel={`${label}: ${language}`}
      >
        <Text style={styles.label}>{label}</Text>
        <View style={styles.value}>
          <Text style={styles.valueText}>
            {language}
            {selectedVoiceName ? ` · ${selectedVoiceName}` : ''}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-forward-outline'}
            size={16}
            color="#666"
          />
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.body}>
          {languages.length === 0 ? (
            <Text style={styles.hint}>
              No speech voices reported by this device.
            </Text>
          ) : (
            <OptionChips
              options={languages}
              selected={language}
              onSelect={value => onChange(value, undefined)}
            />
          )}
          {voicesForLanguage.length > 0 && (
            <>
              <Text style={styles.hint}>Voice</Text>
              <OptionChips
                options={[
                  { label: 'Default', value: '' },
                  ...voicesForLanguage.map(item => ({
                    label: item.name,
                    value: item.identifier,
                  })),
                ]}
                selected={voice ?? ''}
                onSelect={value =>
                  onChange(language, value === '' ? undefined : value)
                }
              />
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    color: '#666',
    fontSize: 14,
  },
  body: {
    gap: 8,
  },
  hint: {
    color: '#666',
    fontSize: 13,
  },
});
