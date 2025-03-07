export type Pair = {
  term: string
  definition: string
  sourceLanguage: string
  targetLanguage: string
  createdAt: number
  modifiedAt: number
  timesListened: number
  status: 'active' | 'inactive'
  familiarity: number
}

export interface State {
  savedPairList: Pair[]
  sourceLanguage: string
  targetLanguage: string
  loadStoredState: (storedState: State) => void
  updateSavedPairList: (savedPairList: Pair[]) => void
}
