import Ionicons from '@expo/vector-icons/Ionicons';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollapsiblePair } from '@/components/CollapsiblePair';
import { useAppStore } from '@/state/store';
import { Pair } from '@/state/types';

const DEFAULT_TIMER_MINUTES = 10;
const SPEECH_RATE = 0.8;

export default function Index() {
  const savedPairList = useAppStore(state => state.savedPairList);
  const sourceLanguage = useAppStore(state => state.sourceLanguage);
  const targetLanguage = useAppStore(state => state.targetLanguage);
  const addPair = useAppStore(state => state.addPair);
  const deletePair = useAppStore(state => state.deletePair);

  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const definitionRef = useRef<TextInput>(null);

  // View state only; the store owns the data. Order and expansion are keyed by
  // pair id so they stay correct across shuffles and deletes.
  const [shuffledIds, setShuffledIds] = useState<string[] | null>(null);
  const [expandedPairId, setExpandedPairId] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isTimed, setIsTimed] = useState(false);
  const [timeStarted, setTimeStarted] = useState(0);
  const [timerText, setTimerText] = useState(String(DEFAULT_TIMER_MINUTES));
  const [wordsLeft, setWordsLeft] = useState(0);

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

  const startTimedPlayback = () => {
    if (!timerIsValid) return;
    setIsTimed(true);
    // eslint-disable-next-line react-hooks/purity -- event handler, not render; session timing moves into the Phase 2 playback engine
    setTimeStarted(Date.now());
    startPlayback();
  };

  const startPlayback = () => {
    setIsPlaying(true);
    setWordsLeft(pairList.length);
    pairList.forEach((pair, index) => {
      Speech.speak(pair.term, {
        language: pair.sourceLanguage,
        rate: SPEECH_RATE,
        onDone: () => useAppStore.getState().incrementTimesListened(pair.id),
      });
      Speech.speak(pair.definition, {
        language: pair.targetLanguage,
        rate: SPEECH_RATE,
        onDone: () => setWordsLeft(pairList.length - index - 1),
      });
    });
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setIsTimed(false);
    setTimeStarted(0);
    Speech.stop();
  };

  // Playback currently loops by restarting when the queue drains; replaced by a
  // proper playback engine in Phase 2 of docs/DEVELOPMENT_PLAN.md.
  useEffect(() => {
    if (isTimed && Date.now() >= timeStarted + 60000 * timerMinutes) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legacy restart loop, replaced by the Phase 2 playback engine
      stopPlayback();
    } else if (wordsLeft === 0 && isPlaying) {
      startPlayback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsLeft]);

  const randomizePairList = () => {
    const ids = pairList.map(pair => pair.id);
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
        <TouchableOpacity onPress={randomizePairList}>
          <Ionicons name="shuffle" size={32} color="black" />
        </TouchableOpacity>
        <View style={styles.timerRow}>
          <TextInput
            placeholder="Timer"
            value={timerText}
            keyboardType="number-pad"
            maxLength={4}
            style={styles.timerInput}
            onChangeText={text => setTimerText(text.replace(/[^0-9]/g, ''))}
          />
          <TouchableOpacity
            onPress={startTimedPlayback}
            disabled={!timerIsValid}
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
        <View style={styles.playback}>
          {!isPlaying ? (
            <TouchableOpacity onPress={startPlayback}>
              <Ionicons name="play-circle-outline" size={64} color="black" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={stopPlayback}>
              <Ionicons name="stop-circle-outline" size={64} color="black" />
            </TouchableOpacity>
          )}
        </View>
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
    alignItems: 'flex-end',
  },
  timerInput: {
    borderWidth: 1,
  },
  playbackContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    alignItems: 'center',
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
