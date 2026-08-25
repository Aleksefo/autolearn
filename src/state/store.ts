import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

import { newId } from '../utils/id';
import { Pair, State } from './types';

export const STORAGE_VERSION = 1;

type PersistedState = Pick<
  State,
  'savedPairList' | 'sourceLanguage' | 'targetLanguage'
>;

// Data persisted before STORAGE_VERSION 1 has pairs without ids.
export function migrateState(
  persisted: unknown,
  version: number,
): PersistedState {
  const state = persisted as PersistedState;
  if (version < 1) {
    return {
      ...state,
      savedPairList: (state.savedPairList ?? []).map(pair => ({
        ...pair,
        id: pair.id ?? newId(),
      })),
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
