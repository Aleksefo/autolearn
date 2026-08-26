import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

import { newId } from '@/utils/id';
import { NewPairInput, Pair, PlaybackSettings, State } from './types';

export const STORAGE_VERSION = 3;

// Defaults preserve pre-settings behavior: rate 0.8, no gap, endless loop.
export const DEFAULT_PLAYBACK_SETTINGS: PlaybackSettings = {
  rate: 0.8,
  gapMs: 0,
  repeatsPerPair: 1,
  loop: true,
  shuffleEachLoop: false,
};

const DAILY_COUNT_RETENTION_DAYS = 14;

export const dateKey = (timestamp: number): string =>
  new Date(timestamp).toISOString().slice(0, 10);

const prunedDailyCounts = (
  counts: Record<string, number>,
  now: number,
): Record<string, number> => {
  const cutoff = dateKey(now - DAILY_COUNT_RETENTION_DAYS * 86_400_000);
  return Object.fromEntries(
    Object.entries(counts).filter(([day]) => day >= cutoff),
  );
};

const buildPair = (input: NewPairInput, now: number): Pair => ({
  ...input,
  id: newId(),
  createdAt: now,
  modifiedAt: now,
  timesListened: 0,
  status: 'active',
  familiarity: 0,
});

type PersistedState = Pick<
  State,
  | 'savedPairList'
  | 'sourceLanguage'
  | 'targetLanguage'
  | 'sourceVoice'
  | 'targetVoice'
  | 'playbackSettings'
  | 'dailyListenCounts'
>;

// v1: pairs gained stable ids. v2: playback settings joined the persisted
// state. v3: daily listen counts (voice ids stay optional; no default needed).
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
  if (version < 3) {
    state = { ...state, dailyListenCounts: {} };
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
        sourceVoice: undefined,
        targetVoice: undefined,
        playbackSettings: DEFAULT_PLAYBACK_SETTINGS,
        dailyListenCounts: {},
        addPair: input =>
          set(state => ({
            savedPairList: [
              buildPair(input, Date.now()),
              ...state.savedPairList,
            ],
          })),
        importPairs: inputs =>
          set(state => {
            const now = Date.now();
            return {
              savedPairList: [
                ...inputs.map(input => buildPair(input, now)),
                ...state.savedPairList,
              ],
            };
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
        restorePair: (pair, index) =>
          set(state => {
            const savedPairList = [...state.savedPairList];
            savedPairList.splice(
              Math.min(Math.max(index, 0), savedPairList.length),
              0,
              pair,
            );
            return { savedPairList };
          }),
        incrementTimesListened: id =>
          set(state => {
            const now = Date.now();
            const today = dateKey(now);
            const counts = prunedDailyCounts(state.dailyListenCounts, now);
            return {
              savedPairList: state.savedPairList.map(pair =>
                pair.id === id
                  ? { ...pair, timesListened: pair.timesListened + 1 }
                  : pair,
              ),
              dailyListenCounts: {
                ...counts,
                [today]: (counts[today] ?? 0) + 1,
              },
            };
          }),
        updatePlaybackSettings: patch =>
          set(state => ({
            playbackSettings: { ...state.playbackSettings, ...patch },
          })),
        updateLanguages: patch => set(() => ({ ...patch })),
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

// Sum of listens in the trailing 7 days, for the stats block.
export const listensThisWeek = (
  dailyListenCounts: Record<string, number>,
  now: number = Date.now(),
): number => {
  const cutoff = dateKey(now - 7 * 86_400_000);
  return Object.entries(dailyListenCounts)
    .filter(([day]) => day >= cutoff)
    .reduce((sum, [, count]) => sum + count, 0);
};
