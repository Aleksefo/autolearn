import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/state/store';
import { Pair } from '@/state/types';
import { MAX_FAMILIARITY } from '@/utils/familiarity';
import { tapHaptic } from '@/utils/haptics';

export function CollapsiblePair({
  pair,
  onDelete,
  onToggle,
  isOpen,
  isCurrent = false,
}: {
  pair: Pair;
  onDelete: () => void;
  onToggle: () => void;
  isOpen: boolean;
  isCurrent?: boolean;
}) {
  const colors = useTheme();
  const updatePair = useAppStore(state => state.updatePair);

  const [isEditing, setIsEditing] = useState(false);
  const [editTerm, setEditTerm] = useState(pair.term);
  const [editDefinition, setEditDefinition] = useState(pair.definition);
  const [editSource, setEditSource] = useState(pair.sourceLanguage);
  const [editTarget, setEditTarget] = useState(pair.targetLanguage);

  const startEditing = () => {
    setEditTerm(pair.term);
    setEditDefinition(pair.definition);
    setEditSource(pair.sourceLanguage);
    setEditTarget(pair.targetLanguage);
    setIsEditing(true);
  };

  const saveEdits = () => {
    if (editTerm.trim() && editDefinition.trim()) {
      updatePair(pair.id, {
        term: editTerm.trim(),
        definition: editDefinition.trim(),
        sourceLanguage: editSource.trim() || pair.sourceLanguage,
        targetLanguage: editTarget.trim() || pair.targetLanguage,
      });
    }
    setIsEditing(false);
  };

  const swapDirection = () => {
    tapHaptic();
    updatePair(pair.id, {
      term: pair.definition,
      definition: pair.term,
      sourceLanguage: pair.targetLanguage,
      targetLanguage: pair.sourceLanguage,
    });
  };

  const setFamiliarity = (value: number) => {
    tapHaptic();
    // Tapping the current rating clears it back to unrated.
    updatePair(pair.id, {
      familiarity: pair.familiarity === value ? 0 : value,
    });
  };

  const setStatus = (status: Pair['status']) => {
    tapHaptic();
    updatePair(pair.id, { status });
  };

  const isArchived = pair.status === 'archived';
  const isInactive = pair.status === 'inactive';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.backgroundElement },
        isCurrent && {
          backgroundColor: colors.primaryMuted,
          borderColor: colors.primary,
          borderWidth: 2,
        },
        isInactive && styles.inactive,
      ]}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={isOpen ? 'Collapse pair' : 'Expand pair'}
        style={styles.row}
      >
        <View style={styles.textWrapper}>
          <Text variant="bodyBold" style={styles.word}>
            {pair.term}
          </Text>
          <Text color="textSecondary" style={styles.word}>
            {pair.definition}
          </Text>
        </View>
        <Icon
          name={isOpen ? 'chevronDown' : 'chevronRight'}
          size={18}
          color="textSecondary"
        />
      </Pressable>
      {isOpen && !isEditing && (
        <View style={styles.details}>
          <View style={styles.metaRow}>
            <Text variant="caption" color="textSecondary">
              {`Added ${new Date(pair.createdAt).toLocaleDateString()}`}
            </Text>
            <Text variant="caption" color="textSecondary">
              {`Times listened: ${pair.timesListened}`}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.stars}>
              {Array.from({ length: MAX_FAMILIARITY }, (_, index) => (
                <Pressable
                  key={index}
                  onPress={() => setFamiliarity(index + 1)}
                  accessibilityRole="button"
                  accessibilityLabel={`Set familiarity ${index + 1}`}
                  hitSlop={4}
                >
                  <Icon
                    name={pair.familiarity > index ? 'star' : 'starOutline'}
                    size={20}
                    color={
                      pair.familiarity > index ? 'accent' : 'textSecondary'
                    }
                  />
                </Pressable>
              ))}
            </View>
            <View style={styles.actions}>
              {!isArchived && (
                <IconButton
                  name={isInactive ? 'eyeOff' : 'eye'}
                  color="textSecondary"
                  size={20}
                  onPress={() => setStatus(isInactive ? 'active' : 'inactive')}
                  accessibilityLabel={
                    isInactive ? 'Activate pair' : 'Deactivate pair'
                  }
                />
              )}
              <IconButton
                name={isArchived ? 'undo' : 'archive'}
                color="textSecondary"
                size={20}
                onPress={() => setStatus(isArchived ? 'active' : 'archived')}
                accessibilityLabel={
                  isArchived ? 'Unarchive pair' : 'Archive as learned'
                }
              />
              <IconButton
                name="swap"
                color="textSecondary"
                size={20}
                onPress={swapDirection}
                accessibilityLabel="Swap term and definition"
              />
              <IconButton
                name="edit"
                color="textSecondary"
                size={20}
                onPress={startEditing}
                accessibilityLabel="Edit pair"
              />
              <IconButton
                name="trash"
                color="error"
                size={20}
                onPress={onDelete}
                accessibilityLabel="Delete pair"
              />
            </View>
          </View>
        </View>
      )}
      {isOpen && isEditing && (
        <View style={styles.details}>
          <Input
            value={editTerm}
            onChangeText={setEditTerm}
            placeholder="Term"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            value={editDefinition}
            onChangeText={setEditDefinition}
            placeholder="Definition"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.langRow}>
            <View style={styles.langInput}>
              <Input
                value={editSource}
                onChangeText={setEditSource}
                label="Term language"
                placeholder="es"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.langInput}>
              <Input
                value={editTarget}
                onChangeText={setEditTarget}
                label="Definition language"
                placeholder="en"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
          <View style={styles.editButtons}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setIsEditing(false)}
            />
            <Button title="Save" onPress={saveEdits} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginVertical: Spacing.one,
  },
  inactive: {
    opacity: 0.45,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  textWrapper: {
    flex: 1,
  },
  // Lowercase presentation is a deliberate part of the card's type treatment.
  word: {
    textTransform: 'lowercase',
  },
  details: {
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stars: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
  },
  langRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  langInput: {
    flex: 1,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
});
