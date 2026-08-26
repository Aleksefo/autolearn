import { Pair } from '@/state/types';
import { parsePairsCsv, serializePairsToCsv } from '../csv';
import { effectiveFamiliarity, playbackWeight } from '../familiarity';
import { weightedShuffle } from '../weightedShuffle';

const pairWith = (patch: Partial<Pair>): Pair => ({
  id: 'id',
  term: 'hola',
  definition: 'hello',
  sourceLanguage: 'es',
  targetLanguage: 'en',
  createdAt: 0,
  modifiedAt: 0,
  timesListened: 0,
  status: 'active',
  familiarity: 0,
  ...patch,
});

describe('effectiveFamiliarity', () => {
  it('is 0 for a fresh unrated pair', () => {
    expect(effectiveFamiliarity(pairWith({}))).toBe(0);
  });

  it('nudges up with listens, capped at +1.5', () => {
    expect(effectiveFamiliarity(pairWith({ timesListened: 10 }))).toBeCloseTo(
      0.5,
    );
    expect(effectiveFamiliarity(pairWith({ timesListened: 500 }))).toBe(1.5);
  });

  it('never exceeds the maximum', () => {
    expect(
      effectiveFamiliarity(pairWith({ familiarity: 5, timesListened: 500 })),
    ).toBe(5);
  });
});

describe('playbackWeight', () => {
  it('weights unfamiliar pairs ~6x over mastered ones', () => {
    expect(playbackWeight(pairWith({}))).toBe(6);
    expect(playbackWeight(pairWith({ familiarity: 5 }))).toBe(1);
  });
});

describe('weightedShuffle', () => {
  it('returns a permutation of the input', () => {
    const items = ['a', 'b', 'c', 'd'];
    const result = weightedShuffle(items, () => 1);
    expect([...result].sort()).toEqual(items);
  });

  it('tends to place heavier items first (deterministic random)', () => {
    const result = weightedShuffle(
      [
        { name: 'light', weight: 1 },
        { name: 'heavy', weight: 100 },
      ],
      item => item.weight,
      () => 0.5, // lands well past the light item's slice
    );
    expect(result.map(item => item.name)).toEqual(['heavy', 'light']);
  });

  it('handles empty input', () => {
    expect(weightedShuffle([], () => 1)).toEqual([]);
  });
});

describe('csv', () => {
  it('round-trips pairs through serialize and parse', () => {
    const csv = serializePairsToCsv([
      {
        term: 'hola',
        definition: 'hello',
        sourceLanguage: 'es',
        targetLanguage: 'en',
      },
      { term: 'quotes "and" commas,', definition: 'tricky\nline' },
    ]);

    const rows = parsePairsCsv(csv);
    expect(rows).toEqual([
      {
        term: 'hola',
        definition: 'hello',
        sourceLanguage: 'es',
        targetLanguage: 'en',
      },
      {
        term: 'quotes "and" commas,',
        definition: 'tricky\nline',
        sourceLanguage: undefined,
        targetLanguage: undefined,
      },
    ]);
  });

  it('accepts two-column input without a header', () => {
    const rows = parsePairsCsv('hola,hello\r\nadiós,goodbye\n');
    expect(rows).toEqual([
      {
        term: 'hola',
        definition: 'hello',
        sourceLanguage: undefined,
        targetLanguage: undefined,
      },
      {
        term: 'adiós',
        definition: 'goodbye',
        sourceLanguage: undefined,
        targetLanguage: undefined,
      },
    ]);
  });

  it('drops incomplete rows', () => {
    const rows = parsePairsCsv('term,definition\nhola,hello\nlonely\n,\n');
    expect(rows).toHaveLength(1);
    expect(rows[0].term).toBe('hola');
  });
});
