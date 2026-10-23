import {
  dateKey,
  DEFAULT_PLAYBACK_SETTINGS,
  listensThisWeek,
  migrateState,
  STORAGE_VERSION,
  useAppStore,
} from '../store';
import { Pair } from '../types';

const initialState = useAppStore.getState();

const addPair = (term: string, definition: string) =>
  useAppStore.getState().addPair({
    term,
    definition,
    sourceLanguage: 'es',
    targetLanguage: 'en',
  });

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('addPair', () => {
  it('prepends a pair with generated id and defaults', () => {
    addPair('hola', 'hello');
    addPair('adiós', 'goodbye');

    const [second, first] = useAppStore.getState().savedPairList;
    expect(second.term).toBe('adiós');
    expect(first.term).toBe('hola');
    expect(first.id).toBeTruthy();
    expect(second.id).not.toBe(first.id);
    expect(first).toMatchObject({
      definition: 'hello',
      sourceLanguage: 'es',
      targetLanguage: 'en',
      timesListened: 0,
      status: 'active',
      familiarity: 0,
    });
  });
});

describe('updatePair', () => {
  it('patches only the matching pair and bumps modifiedAt', () => {
    addPair('hola', 'hello');
    addPair('adiós', 'goodbye');
    const target = useAppStore.getState().savedPairList[1];

    useAppStore.getState().updatePair(target.id, { definition: 'hi' });

    const [untouched, updated] = useAppStore.getState().savedPairList;
    expect(updated.definition).toBe('hi');
    expect(updated.modifiedAt).toBeGreaterThanOrEqual(target.modifiedAt);
    expect(untouched.definition).toBe('goodbye');
  });
});

describe('deletePair', () => {
  it('removes only the pair with the given id', () => {
    addPair('uno', 'one');
    addPair('dos', 'two');
    addPair('tres', 'three');
    const toDelete = useAppStore.getState().savedPairList[1];

    useAppStore.getState().deletePair(toDelete.id);

    const remaining = useAppStore.getState().savedPairList;
    expect(remaining).toHaveLength(2);
    expect(remaining.map(pair => pair.term)).toEqual(['tres', 'uno']);
  });
});

describe('restorePair', () => {
  it('reinserts a deleted pair at its original index', () => {
    addPair('uno', 'one');
    addPair('dos', 'two');
    addPair('tres', 'three');
    const deleted = useAppStore.getState().savedPairList[1];

    useAppStore.getState().deletePair(deleted.id);
    useAppStore.getState().restorePair(deleted, 1);

    expect(useAppStore.getState().savedPairList.map(pair => pair.term)).toEqual(
      ['tres', 'dos', 'uno'],
    );
  });
});

describe('importPairs', () => {
  it('prepends all imported pairs with unique ids', () => {
    addPair('uno', 'one');
    useAppStore.getState().importPairs([
      {
        term: 'dos',
        definition: 'two',
        sourceLanguage: 'es',
        targetLanguage: 'en',
      },
      {
        term: 'tres',
        definition: 'three',
        sourceLanguage: 'es',
        targetLanguage: 'en',
      },
    ]);

    const list = useAppStore.getState().savedPairList;
    expect(list.map(pair => pair.term)).toEqual(['dos', 'tres', 'uno']);
    expect(new Set(list.map(pair => pair.id)).size).toBe(3);
  });
});

describe('incrementTimesListened', () => {
  it('increments only the matching pair', () => {
    addPair('uno', 'one');
    addPair('dos', 'two');
    const target = useAppStore.getState().savedPairList[0];

    useAppStore.getState().incrementTimesListened(target.id);
    useAppStore.getState().incrementTimesListened(target.id);

    const [incremented, untouched] = useAppStore.getState().savedPairList;
    expect(incremented.timesListened).toBe(2);
    expect(untouched.timesListened).toBe(0);
  });

  it('records listens per day and prunes old days', () => {
    addPair('uno', 'one');
    const target = useAppStore.getState().savedPairList[0];
    useAppStore.setState({
      dailyListenCounts: { '2001-01-01': 7 }, // far past the retention window
    });

    useAppStore.getState().incrementTimesListened(target.id);
    useAppStore.getState().incrementTimesListened(target.id);

    const counts = useAppStore.getState().dailyListenCounts;
    expect(counts[dateKey(Date.now())]).toBe(2);
    expect(counts['2001-01-01']).toBeUndefined();
  });
});

describe('listensThisWeek', () => {
  it('sums only the trailing seven days', () => {
    const now = Date.now();
    const counts = {
      [dateKey(now)]: 2,
      [dateKey(now - 3 * 86_400_000)]: 3,
      [dateKey(now - 10 * 86_400_000)]: 50,
    };
    expect(listensThisWeek(counts, now)).toBe(5);
  });
});

describe('migrateState', () => {
  const legacyPair = {
    term: 'hola',
    definition: 'hello',
    sourceLanguage: 'es',
    targetLanguage: 'en',
    createdAt: 1,
    modifiedAt: 1,
    timesListened: 3,
    status: 'active',
    familiarity: 0,
  } as Omit<Pair, 'id'> as Pair;

  it('assigns unique ids to version-0 pairs and keeps their data', () => {
    const migrated = migrateState(
      {
        savedPairList: [legacyPair, { ...legacyPair, term: 'adiós' }],
        sourceLanguage: 'es',
        targetLanguage: 'en',
      },
      0,
    );

    const [a, b] = migrated.savedPairList;
    expect(a.id).toBeTruthy();
    expect(b.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
    expect(a.timesListened).toBe(3);
    expect(b.term).toBe('adiós');
  });

  it('handles missing savedPairList', () => {
    const migrated = migrateState(
      { sourceLanguage: 'es', targetLanguage: 'en' },
      0,
    );
    expect(migrated.savedPairList).toEqual([]);
  });

  it('adds default playback settings to version-1 state', () => {
    const migrated = migrateState(
      {
        savedPairList: [{ ...legacyPair, id: 'existing-id' }],
        sourceLanguage: 'es',
        targetLanguage: 'en',
      },
      1,
    );

    expect(migrated.savedPairList[0].id).toBe('existing-id');
    expect(migrated.playbackSettings).toEqual(DEFAULT_PLAYBACK_SETTINGS);
  });

  it('adds empty daily listen counts to version-2 state', () => {
    const migrated = migrateState(
      {
        savedPairList: [{ ...legacyPair, id: 'existing-id' }],
        sourceLanguage: 'es',
        targetLanguage: 'en',
        playbackSettings: { ...DEFAULT_PLAYBACK_SETTINGS, rate: 1 },
      },
      2,
    );

    expect(migrated.dailyListenCounts).toEqual({});
    expect(migrated.playbackSettings.rate).toBe(1);
  });

  it('adds the system theme default to version-3 state', () => {
    const migrated = migrateState(
      {
        savedPairList: [{ ...legacyPair, id: 'existing-id' }],
        sourceLanguage: 'es',
        targetLanguage: 'en',
        playbackSettings: { ...DEFAULT_PLAYBACK_SETTINGS },
        dailyListenCounts: {},
      },
      3,
    );

    expect(migrated.theme).toBe('system');
  });

  it('returns current-version state untouched', () => {
    const state = {
      savedPairList: [{ ...legacyPair, id: 'existing-id' }],
      sourceLanguage: 'es',
      targetLanguage: 'en',
      playbackSettings: { ...DEFAULT_PLAYBACK_SETTINGS, rate: 1 },
      dailyListenCounts: {},
      theme: 'dark' as const,
    };
    expect(migrateState(state, STORAGE_VERSION)).toBe(state);
  });
});
