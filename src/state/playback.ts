import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import { create } from 'zustand';

import { useAppStore } from './store';
import { Pair } from './types';

const KEEP_AWAKE_TAG = 'autolearn-playback';

export type PlaybackStatus = 'idle' | 'playing' | 'paused';

export interface PlaybackState {
  status: PlaybackStatus;
  /** Ordered pair ids for this session. */
  queue: string[];
  currentIndex: number;
  currentRepeat: number;
  /**
   * Wall-clock end of a timed session, or null for open-ended playback.
   * The clock keeps running while paused, like a kitchen timer.
   */
  sessionEndsAt: number | null;
  play: (pairIds: string[]) => void;
  playTimed: (pairIds: string[], minutes: number) => void;
  pause: () => void;
  resume: () => void;
  skipNext: () => void;
  stop: () => void;
}

// Bumped on every user action. Speech callbacks and gap timers capture the
// generation they were scheduled in and become no-ops once it moves on, so
// stale async work can never touch state.
let generation = 0;
let gapTimer: ReturnType<typeof setTimeout> | null = null;
let sessionTimer: ReturnType<typeof setTimeout> | null = null;

const clearGapTimer = () => {
  if (gapTimer !== null) {
    clearTimeout(gapTimer);
    gapTimer = null;
  }
};

const clearSessionTimer = () => {
  if (sessionTimer !== null) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }
};

const settings = () => useAppStore.getState().playbackSettings;

const pairById = (id: string): Pair | undefined =>
  useAppStore.getState().savedPairList.find(pair => pair.id === id);

const shuffled = (ids: string[]): string[] => {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const afterGap = (gen: number, step: () => void) => {
  gapTimer = setTimeout(() => {
    gapTimer = null;
    if (gen === generation) step();
  }, settings().gapMs);
};

const speakCurrentPair = (gen: number) => {
  if (gen !== generation) return;
  const { status, queue, currentIndex } = usePlayback.getState();
  if (status !== 'playing') return;
  const pair = pairById(queue[currentIndex]);
  if (!pair) {
    // The pair was deleted mid-session; move on.
    advance(gen);
    return;
  }
  Speech.speak(pair.term, {
    language: pair.sourceLanguage,
    rate: settings().rate,
    onDone: () => {
      if (gen === generation) afterGap(gen, () => speakDefinition(gen, pair));
    },
  });
};

const speakDefinition = (gen: number, pair: Pair) => {
  if (gen !== generation) return;
  Speech.speak(pair.definition, {
    language: pair.targetLanguage,
    rate: settings().rate,
    onDone: () => {
      if (gen !== generation) return;
      useAppStore.getState().incrementTimesListened(pair.id);
      afterGap(gen, () => advance(gen));
    },
  });
};

const advance = (gen: number) => {
  if (gen !== generation) return;
  const state = usePlayback.getState();
  if (state.sessionEndsAt !== null && Date.now() >= state.sessionEndsAt) {
    finish();
    return;
  }
  const { repeatsPerPair, loop, shuffleEachLoop } = settings();
  if (state.currentRepeat + 1 < repeatsPerPair) {
    usePlayback.setState({ currentRepeat: state.currentRepeat + 1 });
  } else if (state.currentIndex + 1 < state.queue.length) {
    usePlayback.setState({
      currentIndex: state.currentIndex + 1,
      currentRepeat: 0,
    });
  } else if (loop && state.queue.some(id => pairById(id) !== undefined)) {
    // The liveness check keeps a loop over fully-deleted pairs from recursing
    // through speakCurrentPair → advance forever.
    usePlayback.setState({
      queue: shuffleEachLoop ? shuffled(state.queue) : state.queue,
      currentIndex: 0,
      currentRepeat: 0,
    });
  } else {
    finish();
    return;
  }
  speakCurrentPair(gen);
};

const finish = () => {
  generation++;
  clearGapTimer();
  clearSessionTimer();
  Speech.stop();
  deactivateKeepAwake(KEEP_AWAKE_TAG);
  usePlayback.setState({
    status: 'idle',
    queue: [],
    currentIndex: 0,
    currentRepeat: 0,
    sessionEndsAt: null,
  });
};

export const usePlayback = create<PlaybackState>()((set, get) => ({
  status: 'idle',
  queue: [],
  currentIndex: 0,
  currentRepeat: 0,
  sessionEndsAt: null,

  play: pairIds => {
    if (pairIds.length === 0) return;
    generation++;
    const gen = generation;
    clearGapTimer();
    clearSessionTimer();
    Speech.stop();
    activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    set({
      status: 'playing',
      queue: pairIds,
      currentIndex: 0,
      currentRepeat: 0,
      sessionEndsAt: null,
    });
    speakCurrentPair(gen);
  },

  playTimed: (pairIds, minutes) => {
    if (!Number.isInteger(minutes) || minutes <= 0) return;
    get().play(pairIds);
    if (get().status !== 'playing') return;
    set({ sessionEndsAt: Date.now() + minutes * 60_000 });
    sessionTimer = setTimeout(finish, minutes * 60_000);
  },

  pause: () => {
    if (get().status !== 'playing') return;
    generation++;
    clearGapTimer();
    Speech.stop();
    deactivateKeepAwake(KEEP_AWAKE_TAG);
    set({ status: 'paused' });
  },

  resume: () => {
    if (get().status !== 'paused') return;
    generation++;
    const gen = generation;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    // The current pair restarts from its term so the listener regains context.
    set({ status: 'playing', currentRepeat: 0 });
    speakCurrentPair(gen);
  },

  skipNext: () => {
    const state = get();
    if (state.status === 'idle' || state.queue.length === 0) return;
    generation++;
    const gen = generation;
    clearGapTimer();
    Speech.stop();
    const atEnd = state.currentIndex + 1 >= state.queue.length;
    if (atEnd && !settings().loop) {
      finish();
      return;
    }
    set({
      currentIndex: atEnd ? 0 : state.currentIndex + 1,
      currentRepeat: 0,
    });
    if (get().status === 'playing') speakCurrentPair(gen);
  },

  stop: finish,
}));
