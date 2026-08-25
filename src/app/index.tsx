import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollapsiblePair } from '@/components/CollapsiblePair';
import { SessionCountdown } from '@/components/SessionCountdown';
import { usePlayback } from '@/state/playback';
import { useAppStore } from '@/state/store';
import { Pair } from '@/state/types';

const DEFAULT_TIMER_MINUTES = 10;

export default function Index() {
  const savedPairList = useAppStore(state => state.savedPairList);
  const sourceLanguage = useAppStore(state => state.sourceLanguage);
  const targetLanguage = useAppStore(state => state.targetLanguage);
  const addPair = useAppStore(state => state.addPair);
  const deletePair = useAppStore(state => state.deletePair);

  const playbackStatus = usePlayback(state => state.status);
  const sessionEndsAt = usePlayback(state => state.sessionEndsAt);
  const play = usePlayback(state => state.play);
  const playTimed = usePlayback(state => state.playTimed);
  const pause = usePlayback(state => state.pause);
  const resume = usePlayback(state => state.resume);
  const skipNext = usePlayback(state => state.skipNext);
  const stop = usePlayback(state => state.stop);

  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const definitionRef = useRef<TextInput>(null);

  // View state only; the store owns the data. Order and expansion are keyed by
  // pair id so they stay correct across shuffles and deletes.
  const [shuffledIds, setShuffledIds] = useState<string[] | null>(null);
  const [expandedPairId, setExpandedPairId] = useState<string | null>(null);

  const [timerText, setTimerText] = useState(String(DEFAULT_TIMER_MINUTES));

  const pairList = useMemo(() => {
    if (!shuffledIds) return savedPairList;
    const byId = new Map(savedPairList.map(pair => [pair.id, pair]));
    return shuffledIds
      .map(id => byId.get(id))
      .filter((pair): pair is Pair => pair !== undefined);
  }, [savedPairList, shuffledIds]);

  const timerMinutes = Number.parseInt(timerText, 10);
  const timerIsValid = Number.isInteger(timerMinutes) && timerMinutes > 0;

  const addNewPair = () => {
    addPair({ term, definition, sourceLanguage, targetLanguage });
    setTerm('');
    setDefinition('');
  };

  const pairIds = () => pairList.map(pair => pair.id);

  const onPlayPress = () => {
    if (playbackStatus === 'paused') {
      resume();
    } else {
      play(pairIds());
    }
  };

  const randomizePairList = () => {
    const ids = pairIds();
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setShuffledIds(ids);
    setExpandedPairId(null);
  };

  const togglePairView = (id: string) => {
    setExpandedPairId(currentId => (currentId === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <TextInput
        placeholder="Term"
        value={term}
        onChangeText={setTerm}
        style={styles.input}
        onSubmitEditing={() => definitionRef.current?.focus()}
      />
      <TextInput
        placeholder="Definition"
        value={definition}
        ref={definitionRef}
        onChangeText={setDefinition}
        style={styles.input}
        onSubmitEditing={addNewPair}
      />
      <FlatList
        data={pairList}
        renderItem={({ item }) => (
          <CollapsiblePair
            onDelete={() => deletePair(item.id)}
            pair={item}
            onToggle={() => togglePairView(item.id)}
            isOpen={item.id === expandedPairId}
          />
        )}
        keyExtractor={item => item.id}
        style={styles.terms}
      />
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
            value={timerText}
            keyboardType="number-pad"
            maxLength={4}
            style={styles.timerInput}
            onChangeText={text => setTimerText(text.replace(/[^0-9]/g, ''))}
          />
          <TouchableOpacity
            onPress={() => playTimed(pairIds(), timerMinutes)}
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
  container: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 8,
    padding: 8,
    margin: 8,
    marginBottom: 0,
  },
  terms: {
    marginTop: 0,
    padding: 8,
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
