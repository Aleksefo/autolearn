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
  savedPairList?: Pair[]
  sourceLanguage?: string
  targetLanguage?: string
  stateLoaded?: boolean
}

export type Action =
  | {
      type: 'loadStoredState'
      payload: {
        state: State
      }
    }
  | {
      type: 'updateSavedPairList'
      payload: {
        savedPairList: Pair[]
      }
    }
