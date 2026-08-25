export type Pair = {
  id: string;
  term: string;
  definition: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: number;
  modifiedAt: number;
  timesListened: number;
  status: 'active' | 'inactive';
  familiarity: number;
};

export type NewPairInput = {
  term: string;
  definition: string;
  sourceLanguage: string;
  targetLanguage: string;
};

export interface State {
  savedPairList: Pair[];
  sourceLanguage: string;
  targetLanguage: string;
  addPair: (input: NewPairInput) => void;
  updatePair: (id: string, patch: Partial<Omit<Pair, 'id'>>) => void;
  deletePair: (id: string) => void;
  incrementTimesListened: (id: string) => void;
}
