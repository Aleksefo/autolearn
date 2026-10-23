export type PairStatus = 'active' | 'inactive' | 'archived';

export type Pair = {
  id: string;
  term: string;
  definition: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: number;
  modifiedAt: number;
  timesListened: number;
  /** inactive: temporarily out of playback. archived: learned, listed at the bottom. */
  status: PairStatus;
  /** Manual rating 1–5; 0 = unrated. */
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
  /** Reshuffle the queue (familiarity-weighted) on every loop restart. */
  shuffleEachLoop: boolean;
};

export type ThemeSetting = 'system' | 'light' | 'dark';

export type LanguageSettings = Partial<
  Pick<
    State,
    'sourceLanguage' | 'targetLanguage' | 'sourceVoice' | 'targetVoice'
  >
>;

export interface State {
  savedPairList: Pair[];
  sourceLanguage: string;
  targetLanguage: string;
  /** Specific device voice ids for each direction; undefined = system default. */
  sourceVoice?: string;
  targetVoice?: string;
  playbackSettings: PlaybackSettings;
  /** Listen counts per day (YYYY-MM-DD), pruned to the last 14 days. */
  dailyListenCounts: Record<string, number>;
  theme: ThemeSetting;
  addPair: (input: NewPairInput) => void;
  importPairs: (inputs: NewPairInput[]) => void;
  updatePair: (id: string, patch: Partial<Omit<Pair, 'id'>>) => void;
  deletePair: (id: string) => void;
  restorePair: (pair: Pair, index: number) => void;
  incrementTimesListened: (id: string) => void;
  updatePlaybackSettings: (patch: Partial<PlaybackSettings>) => void;
  updateLanguages: (patch: LanguageSettings) => void;
  setTheme: (theme: ThemeSetting) => void;
}
