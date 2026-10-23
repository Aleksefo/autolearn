import type { Voice } from 'expo-speech';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { OptionChips } from '@/components/OptionChips';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';

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
      <Pressable
        style={styles.header}
        onPress={() => setExpanded(current => !current)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${language}`}
      >
        <Text variant="bodyBold">{label}</Text>
        <View style={styles.value}>
          <Text variant="small" color="textSecondary">
            {language}
            {selectedVoiceName ? ` · ${selectedVoiceName}` : ''}
          </Text>
          <Icon
            name={expanded ? 'chevronDown' : 'chevronRight'}
            size={16}
            color="textSecondary"
          />
        </View>
      </Pressable>
      {expanded && (
        <View style={styles.body}>
          {languages.length === 0 ? (
            <Text variant="caption" color="textSecondary">
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
              <Text variant="caption" color="textSecondary">
                Voice
              </Text>
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
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flexShrink: 1,
  },
  body: {
    gap: Spacing.two,
  },
});
