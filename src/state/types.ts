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

export type PlaybackSettings = {
  /** Speech rate passed to expo-speech (1 is normal speed). */
  rate: number;
  /** Pause between utterances (term → definition, and between pairs), in ms. */
  gapMs: number;
  /** How many times each pair is spoken before advancing. */
  repeatsPerPair: number;
  /** Restart from the top when the queue drains. */
  loop: boolean;
  /** Reshuffle the queue on every loop restart. */
  shuffleEachLoop: boolean;
};

export interface State {
  savedPairList: Pair[];
  sourceLanguage: string;
  targetLanguage: string;
  playbackSettings: PlaybackSettings;
  addPair: (input: NewPairInput) => void;
  updatePair: (id: string, patch: Partial<Omit<Pair, 'id'>>) => void;
  deletePair: (id: string) => void;
  incrementTimesListened: (id: string) => void;
  updatePlaybackSettings: (patch: Partial<PlaybackSettings>) => void;
}
