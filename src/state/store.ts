import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

import { newId } from '@/utils/id';
import { Pair, PlaybackSettings, State } from './types';

export const STORAGE_VERSION = 2;

// Defaults preserve pre-settings behavior: rate 0.8, no gap, endless loop.
export const DEFAULT_PLAYBACK_SETTINGS: PlaybackSettings = {
  rate: 0.8,
  gapMs: 0,
  repeatsPerPair: 1,
  loop: true,
  shuffleEachLoop: false,
};

type PersistedState = Pick<
  State,
  'savedPairList' | 'sourceLanguage' | 'targetLanguage' | 'playbackSettings'
>;

// v1: pairs gained stable ids. v2: playback settings joined the persisted state.
export function migrateState(
  persisted: unknown,
  version: number,
): PersistedState {
  let state = persisted as PersistedState;
  if (version < 1) {
    state = {
      ...state,
      savedPairList: (state.savedPairList ?? []).map(pair => ({
        ...pair,
        id: pair.id ?? newId(),
      })),
    };
  }
  if (version < 2) {
    state = {
      ...state,
      playbackSettings: {
        ...DEFAULT_PLAYBACK_SETTINGS,
        ...state.playbackSettings,
      },
    };
  }
  return state;
}

export const useAppStore = create<State>()(
  devtools(
    persist(
      set => ({
        savedPairList: [],
        sourceLanguage: 'es',
        targetLanguage: 'en',
        playbackSettings: DEFAULT_PLAYBACK_SETTINGS,
        addPair: input =>
          set(state => {
            const now = Date.now();
            const pair: Pair = {
              ...input,
              id: newId(),
              createdAt: now,
              modifiedAt: now,
              timesListened: 0,
              status: 'active',
              familiarity: 0,
            };
            return { savedPairList: [pair, ...state.savedPairList] };
          }),
        updatePair: (id, patch) =>
          set(state => ({
            savedPairList: state.savedPairList.map(pair =>
              pair.id === id
                ? { ...pair, ...patch, modifiedAt: Date.now() }
                : pair,
            ),
          })),
        deletePair: id =>
          set(state => ({
            savedPairList: state.savedPairList.filter(pair => pair.id !== id),
          })),
        incrementTimesListened: id =>
          set(state => ({
            savedPairList: state.savedPairList.map(pair =>
              pair.id === id
                ? { ...pair, timesListened: pair.timesListened + 1 }
                : pair,
            ),
          })),
        updatePlaybackSettings: patch =>
          set(state => ({
            playbackSettings: { ...state.playbackSettings, ...patch },
          })),
      }),
      {
        name: 'app-storage',
        storage: createJSONStorage(() => AsyncStorage),
        version: STORAGE_VERSION,
        migrate: migrateState,
      },
    ),
  ),
);
