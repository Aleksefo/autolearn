import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClearableInput } from '@/components/ClearableInput';
import { CollapsiblePair } from '@/components/CollapsiblePair';
import { EmptyState } from '@/components/EmptyState';
import { SessionCountdown } from '@/components/SessionCountdown';
import { starterPairsFor } from '@/constants/starterPairs';
import { usePlayback } from '@/state/playback';
import { useAppStore } from '@/state/store';
import { Pair } from '@/state/types';
import { playbackWeight } from '@/utils/familiarity';
import { weightedShuffle } from '@/utils/weightedShuffle';

const DEFAULT_TIMER_MINUTES = 10;
const UNDO_TIMEOUT_MS = 5000;

type SortMode = 'date' | 'name' | 'listens';
const SORT_LABELS: Record<SortMode, string> = {
  date: 'Date',
  name: 'Name',
  listens: 'Listens',
};
const NEXT_SORT: Record<SortMode, SortMode> = {
  date: 'name',
  name: 'listens',
  listens: 'date',
};

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
    const index = savedPairList.findIndex(entry => entry.id === pair.id);
    deletePair(pair.id);
    setLastDeleted({ pair, index });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setLastDeleted(null), UNDO_TIMEOUT_MS);
  };

  const undoDelete = () => {
    if (!lastDeleted) return;
    restorePair(lastDeleted.pair, lastDeleted.index);
    setLastDeleted(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  };

  const onPlayPress = () => {
    if (playbackStatus === 'paused') {
      resume();
    } else {
      play(playableIds());
    }
  };

  // "Random mode": familiarity-weighted, so better-known pairs land later.
  const randomizePairList = () => {
    setShuffledIds(
      weightedShuffle(mainPairs, playbackWeight).map(pair => pair.id),
    );
    setExpandedPairId(null);
  };

  const cycleSortMode = () => {
    setShuffledIds(null);
    setSortMode(mode => NEXT_SORT[mode]);
  };

  const togglePairView = (id: string) => {
    setExpandedPairId(currentId => (currentId === id ? null : id));
  };

  const renderRightActions = () => (
    <View style={styles.swipeDelete}>
      <Ionicons name="trash-outline" size={24} color="#fff" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ClearableInput
        placeholder="Term"
        value={term}
        ref={termRef}
        onChangeText={setTerm}
        style={styles.input}
        onSubmitEditing={() => definitionRef.current?.focus()}
        submitBehavior="submit"
      />
      <ClearableInput
        placeholder="Definition"
        value={definition}
        ref={definitionRef}
        onChangeText={setDefinition}
        style={styles.input}
        onSubmitEditing={addNewPair}
        submitBehavior="submit"
      />
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
            <Text style={styles.counts}>
              {`${savedPairList.length} pairs`}
              {inactiveCount > 0 && ` · ${inactiveCount} inactive`}
              {archivedPairs.length > 0 && ` · ${archivedPairs.length} learned`}
            </Text>
            <TouchableOpacity
              onPress={cycleSortMode}
              style={styles.sortButton}
              accessibilityLabel={`Sort by ${SORT_LABELS[NEXT_SORT[sortMode]]}`}
            >
              <Ionicons name="swap-vertical" size={16} color="#333" />
              <Text style={styles.sortLabel}>{SORT_LABELS[sortMode]}</Text>
            </TouchableOpacity>
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
                  <View style={styles.separatorLine} />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <View style={styles.separatorLine} />
                </View>
              ) : null
            }
            keyExtractor={item => item.id}
            style={styles.terms}
            stickySectionHeadersEnabled={false}
          />
        </>
      )}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          onPress={randomizePairList}
          accessibilityLabel="Shuffle pairs"
        >
          <Ionicons name="shuffle" size={32} color="black" />
        </TouchableOpacity>
        <View style={styles.timerRow}>
          <SessionCountdown endsAt={sessionEndsAt} />
          <TextInput
            placeholder="Timer"
            placeholderTextColor="#888"
            value={timerText}
            keyboardType="number-pad"
            maxLength={4}
            style={styles.timerInput}
            onChangeText={text => setTimerText(text.replace(/[^0-9]/g, ''))}
          />
          <TouchableOpacity
            onPress={() => playTimed(playableIds(), timerMinutes)}
            disabled={!timerIsValid}
            accessibilityLabel="Start timed playback"
          >
            <Ionicons
              name="timer-outline"
              size={32}
              color={timerIsValid ? 'black' : '#888'}
            />
          </TouchableOpacity>
        </View>
      </View>
      {lastDeleted && (
        <View style={styles.undoBar}>
          <Text style={styles.undoText} numberOfLines={1}>
            {`Deleted "${lastDeleted.pair.term}"`}
          </Text>
          <TouchableOpacity
            onPress={undoDelete}
            accessibilityLabel="Undo delete"
          >
            <Text style={styles.undoAction}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.playbackContainer}>
        {playbackStatus !== 'idle' && (
          <TouchableOpacity
            onPress={stop}
            style={styles.sideControl}
            accessibilityLabel="Stop playback"
          >
            <Ionicons name="stop-circle-outline" size={40} color="black" />
          </TouchableOpacity>
        )}
        <View style={styles.playback}>
          {playbackStatus === 'playing' ? (
            <TouchableOpacity onPress={pause} accessibilityLabel="Pause">
              <Ionicons name="pause-circle-outline" size={64} color="black" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onPlayPress}
              accessibilityLabel={
                playbackStatus === 'paused' ? 'Resume' : 'Play'
              }
            >
              <Ionicons name="play-circle-outline" size={64} color="black" />
            </TouchableOpacity>
          )}
        </View>
        {playbackStatus !== 'idle' && (
          <TouchableOpacity
            onPress={skipNext}
            style={styles.sideControl}
            accessibilityLabel="Next pair"
          >
            <Ionicons
              name="play-skip-forward-outline"
              size={40}
              color="black"
            />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Explicit light palette until Phase 4 theming: the OS dark theme otherwise
  // flips default text to white on our light backgrounds.
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  input: {
    margin: 8,
    marginBottom: 0,
  },
  terms: {
    marginTop: 0,
    paddingHorizontal: 8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  counts: {
    color: '#666',
    fontSize: 13,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#b1b1b1',
  },
  sectionTitle: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  swipeDelete: {
    backgroundColor: '#c0392b',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderRadius: 8,
    marginVertical: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#c1c1c1',
    height: 40,
    paddingHorizontal: 16,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerInput: {
    borderWidth: 1,
    color: '#111',
  },
  undoBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  undoText: {
    color: '#fff',
    flex: 1,
  },
  undoAction: {
    color: '#7cc0f5',
    fontWeight: '700',
  },
  playbackContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  sideControl: {
    backgroundColor: '#fff',
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playback: {
    backgroundColor: '#fff',
    borderRadius: 64,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
