import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollapsiblePair } from '@/components/CollapsiblePair';
import { EmptyState } from '@/components/EmptyState';
import { SessionCountdown } from '@/components/SessionCountdown';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { starterPairsFor } from '@/constants/starterPairs';
import { Radii, Spacing, TypeScale } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { usePlayback } from '@/state/playback';
import { useAppStore } from '@/state/store';
import { Pair } from '@/state/types';
import { playbackWeight } from '@/utils/familiarity';
import { tapHaptic, warningHaptic } from '@/utils/haptics';
import { weightedShuffle } from '@/utils/weightedShuffle';

const DEFAULT_TIMER_MINUTES = 10;
const UNDO_TIMEOUT_MS = 5000;

type SortMode = 'date' | 'name' | 'listens';
const SORT_SEGMENTS: { value: SortMode; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'name', label: 'Name' },
  { value: 'listens', label: 'Listens' },
];

const sortPairs = (pairs: Pair[], mode: SortMode): Pair[] => {
  const sorted = [...pairs];
  if (mode === 'name') {
    sorted.sort((a, b) => a.term.localeCompare(b.term));
  } else if (mode === 'listens') {
    sorted.sort((a, b) => b.timesListened - a.timesListened);
  } else {
    sorted.sort((a, b) => b.createdAt - a.createdAt);
  }
  return sorted;
};

export default function Index() {
  const colors = useTheme();

  const savedPairList = useAppStore(state => state.savedPairList);
  const sourceLanguage = useAppStore(state => state.sourceLanguage);
  const targetLanguage = useAppStore(state => state.targetLanguage);
  const addPair = useAppStore(state => state.addPair);
  const importPairs = useAppStore(state => state.importPairs);
  const deletePair = useAppStore(state => state.deletePair);
  const restorePair = useAppStore(state => state.restorePair);

  const playbackStatus = usePlayback(state => state.status);
  const sessionEndsAt = usePlayback(state => state.sessionEndsAt);
  const currentPairId = usePlayback(state =>
    state.status === 'idle' ? null : state.queue[state.currentIndex],
  );
  const play = usePlayback(state => state.play);
  const playTimed = usePlayback(state => state.playTimed);
  const pause = usePlayback(state => state.pause);
  const resume = usePlayback(state => state.resume);
  const skipNext = usePlayback(state => state.skipNext);
  const stop = usePlayback(state => state.stop);

  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const termRef = useRef<TextInput>(null);
  const definitionRef = useRef<TextInput>(null);

  // View state only; the store owns the data. Order and expansion are keyed by
  // pair id so they stay correct across shuffles and deletes.
  const [shuffledIds, setShuffledIds] = useState<string[] | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [expandedPairId, setExpandedPairId] = useState<string | null>(null);
  const [timerText, setTimerText] = useState(String(DEFAULT_TIMER_MINUTES));
  const [lastDeleted, setLastDeleted] = useState<{
    pair: Pair;
    index: number;
  } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const archivedPairs = useMemo(
    () => savedPairList.filter(pair => pair.status === 'archived'),
    [savedPairList],
  );

  const mainPairs = useMemo(() => {
    const unarchived = savedPairList.filter(pair => pair.status !== 'archived');
    if (!shuffledIds) return sortPairs(unarchived, sortMode);
    const byId = new Map(unarchived.map(pair => [pair.id, pair]));
    const inShuffle = new Set(shuffledIds);
    // Pairs added (or unarchived) after the shuffle aren't in the shuffle
    // order; surface them at the top instead of hiding them until a re-sort.
    const newcomers = sortPairs(
      unarchived.filter(pair => !inShuffle.has(pair.id)),
      'date',
    );
    return [
      ...newcomers,
      ...shuffledIds
        .map(id => byId.get(id))
        .filter((pair): pair is Pair => pair !== undefined),
    ];
  }, [savedPairList, shuffledIds, sortMode]);

  const sections = useMemo(
    () => [
      { key: 'main', title: null, data: mainPairs },
      ...(archivedPairs.length > 0
        ? [{ key: 'archived', title: 'Learned', data: archivedPairs }]
        : []),
    ],
    [mainPairs, archivedPairs],
  );

  const inactiveCount = savedPairList.filter(
    pair => pair.status === 'inactive',
  ).length;

  const timerMinutes = Number.parseInt(timerText, 10);
  const timerIsValid = Number.isInteger(timerMinutes) && timerMinutes > 0;

  const playableIds = () =>
    mainPairs.filter(pair => pair.status === 'active').map(pair => pair.id);

  const doAdd = () => {
    addPair({
      term: term.trim(),
      definition: definition.trim(),
      sourceLanguage,
      targetLanguage,
    });
    setTerm('');
    setDefinition('');
    // Jump back to the term field so consecutive adds flow without taps.
    termRef.current?.focus();
  };

  const addNewPair = () => {
    if (!term.trim() || !definition.trim()) return;
    const existing = savedPairList.find(
      pair => pair.term.trim().toLowerCase() === term.trim().toLowerCase(),
    );
    if (existing) {
      Alert.alert(
        'Already added',
        `"${existing.term}" is already in your list as "${existing.definition}".`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add anyway', onPress: doAdd },
        ],
      );
      return;
    }
    doAdd();
  };

  const deleteWithUndo = (pair: Pair) => {
    warningHaptic();
    const index = savedPairList.findIndex(entry => entry.id === pair.id);
    deletePair(pair.id);
    setLastDeleted({ pair, index });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setLastDeleted(null), UNDO_TIMEOUT_MS);
  };

  const undoDelete = () => {
    if (!lastDeleted) return;
    tapHaptic();
    restorePair(lastDeleted.pair, lastDeleted.index);
    setLastDeleted(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  };

  const onPlayPress = () => {
    tapHaptic();
    if (playbackStatus === 'paused') {
      resume();
    } else {
      play(playableIds());
    }
  };

  // "Random mode": familiarity-weighted, so better-known pairs land later.
  const randomizePairList = () => {
    tapHaptic();
    setShuffledIds(
      weightedShuffle(mainPairs, playbackWeight).map(pair => pair.id),
    );
    setExpandedPairId(null);
  };

  const changeSortMode = (mode: SortMode) => {
    setShuffledIds(null);
    setSortMode(mode);
  };

  const togglePairView = (id: string) => {
    setExpandedPairId(currentId => (currentId === id ? null : id));
  };

  const renderRightActions = () => (
    <View style={[styles.swipeDelete, { backgroundColor: colors.error }]}>
      <Icon name="trash" size={24} color="onPrimary" />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom', 'left', 'right']}
    >
      <View style={styles.inputs}>
        <Input
          placeholder="Term"
          value={term}
          ref={termRef}
          onChangeText={setTerm}
          clearable
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          onSubmitEditing={() => definitionRef.current?.focus()}
          submitBehavior="submit"
        />
        <Input
          placeholder="Definition"
          value={definition}
          ref={definitionRef}
          onChangeText={setDefinition}
          clearable
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          onSubmitEditing={addNewPair}
          submitBehavior="submit"
        />
      </View>
      {savedPairList.length === 0 ? (
        <EmptyState
          onAddStarterPairs={
            starterPairsFor(sourceLanguage, targetLanguage).length > 0
              ? () =>
                  importPairs(starterPairsFor(sourceLanguage, targetLanguage))
              : undefined
          }
        />
      ) : (
        <>
          <View style={styles.listHeader}>
            <SegmentedControl
              segments={SORT_SEGMENTS}
              value={sortMode}
              onChange={changeSortMode}
            />
            <Text variant="caption" color="textSecondary">
              {`${savedPairList.length} pairs`}
              {inactiveCount > 0 && ` · ${inactiveCount} inactive`}
              {archivedPairs.length > 0 && ` · ${archivedPairs.length} learned`}
            </Text>
          </View>
          <SectionList
            sections={sections}
            renderItem={({ item }) => (
              <Swipeable
                renderRightActions={renderRightActions}
                onSwipeableOpen={() => deleteWithUndo(item)}
              >
                <CollapsiblePair
                  pair={item}
                  isCurrent={item.id === currentPairId}
                  onDelete={() => deleteWithUndo(item)}
                  onToggle={() => togglePairView(item.id)}
                  isOpen={item.id === expandedPairId}
                />
              </Swipeable>
            )}
            renderSectionHeader={({ section }) =>
              section.title ? (
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.separatorLine,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <Text variant="caption" color="textSecondary">
                    {section.title}
                  </Text>
                  <View
                    style={[
                      styles.separatorLine,
                      { backgroundColor: colors.border },
                    ]}
                  />
                </View>
              ) : null
            }
            keyExtractor={item => item.id}
            style={styles.terms}
            contentContainerStyle={styles.termsContent}
            stickySectionHeadersEnabled={false}
          />
        </>
      )}
      <View
        style={[
          styles.controlsContainer,
          { backgroundColor: colors.backgroundElement },
        ]}
      >
        <IconButton
          name="shuffle"
          onPress={randomizePairList}
          accessibilityLabel="Shuffle pairs"
        />
        <View style={styles.timerRow}>
          <SessionCountdown endsAt={sessionEndsAt} />
          <TextInput
            placeholder="Timer"
            placeholderTextColor={colors.textSecondary}
            value={timerText}
            keyboardType="number-pad"
            maxLength={4}
            style={[
              styles.timerInput,
              TypeScale.body,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            onChangeText={text => setTimerText(text.replace(/[^0-9]/g, ''))}
          />
          <IconButton
            name="timer"
            onPress={() => {
              tapHaptic();
              playTimed(playableIds(), timerMinutes);
            }}
            disabled={!timerIsValid}
            color={timerIsValid ? 'text' : 'textSecondary'}
            accessibilityLabel="Start timed playback"
          />
        </View>
      </View>
      {lastDeleted && (
        <View
          style={[
            styles.undoBar,
            { backgroundColor: colors.backgroundSelected },
          ]}
        >
          <Text variant="small" numberOfLines={1} style={styles.undoText}>
            {`Deleted "${lastDeleted.pair.term}"`}
          </Text>
          <Button title="Undo" variant="ghost" onPress={undoDelete} />
        </View>
      )}
      <View style={styles.playbackContainer}>
        {playbackStatus !== 'idle' && (
          <Pressable
            onPress={() => {
              tapHaptic();
              stop();
            }}
            accessibilityRole="button"
            accessibilityLabel="Stop playback"
            style={[
              styles.sideControl,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <Icon name="stop" size={28} />
          </Pressable>
        )}
        <Pressable
          onPress={
            playbackStatus === 'playing'
              ? () => {
                  tapHaptic();
                  pause();
                }
              : onPlayPress
          }
          accessibilityRole="button"
          accessibilityLabel={
            playbackStatus === 'playing'
              ? 'Pause'
              : playbackStatus === 'paused'
                ? 'Resume'
                : 'Play'
          }
          style={[styles.playButton, { backgroundColor: colors.primary }]}
        >
          <Icon
            name={playbackStatus === 'playing' ? 'pause' : 'play'}
            size={40}
            color="onPrimary"
          />
        </Pressable>
        {playbackStatus !== 'idle' && (
          <Pressable
            onPress={() => {
              tapHaptic();
              skipNext();
            }}
            accessibilityRole="button"
            accessibilityLabel="Next pair"
            style={[
              styles.sideControl,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <Icon name="skipNext" size={28} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputs: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  listHeader: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.one,
  },
  terms: {
    marginTop: 0,
  },
  termsContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six + Spacing.five,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  separatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  swipeDelete: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderRadius: Radii.lg,
    marginVertical: Spacing.one,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timerInput: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    minWidth: 64,
    textAlign: 'center',
  },
  undoBar: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: 104,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radii.md,
    paddingLeft: Spacing.three,
    paddingVertical: Spacing.one,
    gap: Spacing.two,
  },
  undoText: {
    flex: 1,
  },
  playbackContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  sideControl: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
