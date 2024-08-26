export type Term = {
  id: number
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
  savedTermList?: Term[]
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
      type: 'updateSavedTermList'
      payload: {
        savedTermList: Term[]
      }
    }
