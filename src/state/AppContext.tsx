import { State, Pair } from './types'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const useAppStore = create<State>()(
  devtools(
    persist(
      (set) => ({
        savedPairList: [],
        sourceLanguage: 'es',
        targetLanguage: 'en',
        loadStoredState: (storedState: State) =>
          set(() => ({ ...storedState })),
        updateSavedPairList: (savedPairList: Pair[]) =>
          set(() => ({ savedPairList })),
      }),
      {
        name: 'app-storage',
        storage: createJSONStorage(() => AsyncStorage),
      },
    ),
  ),
)
