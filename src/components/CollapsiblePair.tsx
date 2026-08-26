import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppStore } from '@/state/store';
import { Pair } from '@/state/types';
import { MAX_FAMILIARITY } from '@/utils/familiarity';

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

  const swapDirection = () =>
    updatePair(pair.id, {
      term: pair.definition,
      definition: pair.term,
      sourceLanguage: pair.targetLanguage,
      targetLanguage: pair.sourceLanguage,
    });

  const setFamiliarity = (value: number) =>
    // Tapping the current rating clears it back to unrated.
    updatePair(pair.id, {
      familiarity: pair.familiarity === value ? 0 : value,
    });

  const isArchived = pair.status === 'archived';
  const isInactive = pair.status === 'inactive';

  return (
    <View>
      <View
        style={[
          styles.pair,
          isInactive && styles.pairInactive,
          isCurrent && styles.pairCurrent,
        ]}
      >
        <View style={styles.textWrapper}>
          <Text style={styles.text}>{pair.term}</Text>
          <View style={styles.divider} />
          <Text style={styles.text}>{pair.definition}</Text>
        </View>
        <TouchableOpacity
          style={styles.heading}
          onPress={onToggle}
          activeOpacity={0.8}
          accessibilityLabel={isOpen ? 'Collapse pair' : 'Expand pair'}
        >
          <Ionicons
            name={isOpen ? 'chevron-down' : 'chevron-forward-outline'}
            size={18}
          />
        </TouchableOpacity>
      </View>
      {isOpen && !isEditing && (
        <View style={styles.details}>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {`Added ${new Date(pair.createdAt).toLocaleDateString()}`}
            </Text>
            <Text style={styles.meta}>
              {`Times listened: ${pair.timesListened}`}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.stars}>
              {Array.from({ length: MAX_FAMILIARITY }, (_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setFamiliarity(index + 1)}
                  accessibilityLabel={`Set familiarity ${index + 1}`}
                >
                  <Ionicons
                    name={pair.familiarity > index ? 'star' : 'star-outline'}
                    size={20}
                    color="#555"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.actions}>
              {!isArchived && (
                <TouchableOpacity
                  onPress={() =>
                    updatePair(pair.id, {
                      status: isInactive ? 'active' : 'inactive',
                    })
                  }
                  accessibilityLabel={
                    isInactive ? 'Activate pair' : 'Deactivate pair'
                  }
                >
                  <Ionicons
                    name={isInactive ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#555"
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  updatePair(pair.id, {
                    status: isArchived ? 'active' : 'archived',
                  })
                }
                accessibilityLabel={
                  isArchived ? 'Unarchive pair' : 'Archive as learned'
                }
              >
                <Ionicons
                  name={isArchived ? 'arrow-undo-outline' : 'school-outline'}
                  size={22}
                  color="#555"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={swapDirection}
                accessibilityLabel="Swap term and definition"
              >
                <Ionicons name="swap-vertical-outline" size={22} color="#555" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={startEditing}
                accessibilityLabel="Edit pair"
              >
                <Ionicons name="pencil-outline" size={22} color="#555" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onDelete}
                accessibilityLabel="Delete pair"
              >
                <Ionicons name="trash-outline" size={22} color="#a33" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {isOpen && isEditing && (
        <View style={styles.details}>
          <TextInput
            value={editTerm}
            onChangeText={setEditTerm}
            style={styles.editInput}
            placeholder="Term"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#888"
          />
          <TextInput
            value={editDefinition}
            onChangeText={setEditDefinition}
            style={styles.editInput}
            placeholder="Definition"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#888"
          />
          <View style={styles.metaRow}>
            <TextInput
              value={editSource}
              onChangeText={setEditSource}
              style={[styles.editInput, styles.langInput]}
              placeholder="Term lang (es)"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#888"
            />
            <TextInput
              value={editTarget}
              onChangeText={setEditTarget}
              style={[styles.editInput, styles.langInput]}
              placeholder="Definition lang (en)"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#888"
            />
          </View>
          <View style={styles.editButtons}>
            <TouchableOpacity onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveEdits}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 4,
    borderRadius: 8,
    marginVertical: 4,
    borderColor: '#686868',
    borderWidth: 1,
  },
  pairInactive: {
    opacity: 0.45,
  },
  pairCurrent: {
    borderColor: '#1774c6',
    borderWidth: 2,
    backgroundColor: '#eef5fc',
  },
  divider: {
    backgroundColor: '#b1b1b1',
    height: 1,
  },
  textWrapper: {
    flex: 1,
  },
  text: {
    fontSize: 18,
    color: '#111',
  },
  details: {
    paddingHorizontal: 4,
    paddingBottom: 8,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  meta: {
    color: '#666',
    fontSize: 13,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 14,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 8,
    padding: 8,
    color: '#111',
  },
  langInput: {
    flex: 1,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
  },
  cancelText: {
    color: '#666',
    fontWeight: '600',
  },
  saveText: {
    color: '#1774c6',
    fontWeight: '600',
  },
});
