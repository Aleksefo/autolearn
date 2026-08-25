import * as Speech from 'expo-speech';

import { usePlayback } from '../playback';
import { useAppStore } from '../store';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));

const speakMock = Speech.speak as jest.Mock;
const initialAppState = useAppStore.getState();

const seedPairs = (...pairs: [string, string][]) => {
  pairs.forEach(([term, definition]) =>
    useAppStore.getState().addPair({
      term,
      definition,
      sourceLanguage: 'es',
      targetLanguage: 'en',
    }),
  );
  // addPair prepends, so reverse back to insertion order for readable tests.
  return [...useAppStore.getState().savedPairList].reverse();
};

const spokenTexts = () => speakMock.mock.calls.map(call => call[0]);

const lastUtteranceOptions = () =>
  speakMock.mock.calls[speakMock.mock.calls.length - 1][1];

// Completes the current utterance and runs the (default 0 ms) gap timer.
const finishUtterance = () => {
  lastUtteranceOptions().onDone();
  jest.advanceTimersByTime(0);
};

beforeEach(() => {
  jest.useFakeTimers();
  usePlayback.getState().stop();
  useAppStore.setState(initialAppState, true);
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('play', () => {
  it('speaks the first pair term with its language and configured rate', () => {
    const [first] = seedPairs(['uno', 'one'], ['dos', 'two']);

    usePlayback.getState().play([first.id]);

    expect(speakMock).toHaveBeenCalledTimes(1);
    expect(speakMock).toHaveBeenCalledWith(
      'uno',
      expect.objectContaining({ language: 'es', rate: 0.8 }),
    );
    expect(usePlayback.getState().status).toBe('playing');
  });

  it('ignores an empty queue', () => {
    usePlayback.getState().play([]);
    expect(usePlayback.getState().status).toBe('idle');
    expect(speakMock).not.toHaveBeenCalled();
  });

  it('walks term → definition, counts the listen, and advances', () => {
    const pairs = seedPairs(['uno', 'one'], ['dos', 'two']);

    usePlayback.getState().play(pairs.map(pair => pair.id));
    finishUtterance(); // 'uno' done → definition
    expect(speakMock).toHaveBeenLastCalledWith(
      'one',
      expect.objectContaining({ language: 'en' }),
    );

    finishUtterance(); // 'one' done → count + next pair
    expect(spokenTexts()).toEqual(['uno', 'one', 'dos']);
    const uno = useAppStore
      .getState()
      .savedPairList.find(pair => pair.term === 'uno');
    expect(uno?.timesListened).toBe(1);
  });

  it('waits for the configured gap between utterances', () => {
    const [pair] = seedPairs(['uno', 'one']);
    useAppStore.getState().updatePlaybackSettings({ gapMs: 1000 });

    usePlayback.getState().play([pair.id]);
    lastUtteranceOptions().onDone();
    jest.advanceTimersByTime(999);
    expect(spokenTexts()).toEqual(['uno']);
    jest.advanceTimersByTime(1);
    expect(spokenTexts()).toEqual(['uno', 'one']);
  });

  it('repeats each pair repeatsPerPair times before advancing', () => {
    const pairs = seedPairs(['uno', 'one'], ['dos', 'two']);
    useAppStore.getState().updatePlaybackSettings({ repeatsPerPair: 2 });

    usePlayback.getState().play(pairs.map(pair => pair.id));
    finishUtterance(); // uno
    finishUtterance(); // one → repeat pair
    finishUtterance(); // uno again
    finishUtterance(); // one again → next pair
    expect(spokenTexts()).toEqual(['uno', 'one', 'uno', 'one', 'dos']);
  });
});

describe('looping', () => {
  it('restarts from the top when loop is on (default)', () => {
    const [pair] = seedPairs(['uno', 'one']);

    usePlayback.getState().play([pair.id]);
    finishUtterance();
    finishUtterance();

    expect(spokenTexts()).toEqual(['uno', 'one', 'uno']);
    expect(usePlayback.getState().status).toBe('playing');
  });

  it('goes idle at the end when loop is off', () => {
    const [pair] = seedPairs(['uno', 'one']);
    useAppStore.getState().updatePlaybackSettings({ loop: false });

    usePlayback.getState().play([pair.id]);
    finishUtterance();
    finishUtterance();

    expect(spokenTexts()).toEqual(['uno', 'one']);
    expect(usePlayback.getState().status).toBe('idle');
  });

  it('reshuffles the queue each loop when shuffleEachLoop is on', () => {
    const pairs = seedPairs(['uno', 'one'], ['dos', 'two']);
    useAppStore.getState().updatePlaybackSettings({ shuffleEachLoop: true });
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

    const ids = pairs.map(pair => pair.id);
    usePlayback.getState().play(ids);
    finishUtterance(); // uno
    finishUtterance(); // one
    finishUtterance(); // dos
    finishUtterance(); // two → loop restart, shuffled

    // With Math.random() === 0 a two-item Fisher–Yates shuffle swaps the items.
    expect(usePlayback.getState().queue).toEqual([ids[1], ids[0]]);
    expect(usePlayback.getState().status).toBe('playing');
    randomSpy.mockRestore();
  });

  it('finishes cleanly when every queued pair was deleted mid-session', () => {
    const [pair] = seedPairs(['uno', 'one']);

    usePlayback.getState().play([pair.id]);
    finishUtterance(); // term done → definition speaking
    useAppStore.getState().deletePair(pair.id);
    finishUtterance(); // definition done → advance over dead queue

    expect(usePlayback.getState().status).toBe('idle');
  });
});

describe('pause and resume', () => {
  it('pause stops speech and ignores stale utterance callbacks', () => {
    const pairs = seedPairs(['uno', 'one'], ['dos', 'two']);
    usePlayback.getState().play(pairs.map(pair => pair.id));
    const staleOptions = lastUtteranceOptions();

    usePlayback.getState().pause();
    expect(Speech.stop).toHaveBeenCalled();
    expect(usePlayback.getState().status).toBe('paused');

    staleOptions.onDone();
    jest.advanceTimersByTime(1000);
    expect(speakMock).toHaveBeenCalledTimes(1); // nothing new was spoken
  });

  it('resume restarts the current pair from its term', () => {
    const pairs = seedPairs(['uno', 'one'], ['dos', 'two']);
    usePlayback.getState().play(pairs.map(pair => pair.id));
    finishUtterance(); // uno done → 'one' speaking

    usePlayback.getState().pause();
    usePlayback.getState().resume();

    expect(speakMock).toHaveBeenLastCalledWith(
      'uno',
      expect.objectContaining({ language: 'es' }),
    );
    expect(usePlayback.getState().status).toBe('playing');
  });
});

describe('skipNext', () => {
  it('jumps to the next pair immediately', () => {
    const pairs = seedPairs(['uno', 'one'], ['dos', 'two']);
    usePlayback.getState().play(pairs.map(pair => pair.id));

    usePlayback.getState().skipNext();

    expect(Speech.stop).toHaveBeenCalled();
    expect(speakMock).toHaveBeenLastCalledWith('dos', expect.anything());
  });

  it('wraps to the first pair at the end when looping', () => {
    const pairs = seedPairs(['uno', 'one'], ['dos', 'two']);
    usePlayback.getState().play(pairs.map(pair => pair.id));

    usePlayback.getState().skipNext();
    usePlayback.getState().skipNext();

    expect(speakMock).toHaveBeenLastCalledWith('uno', expect.anything());
  });

  it('finishes at the end when loop is off', () => {
    const [pair] = seedPairs(['uno', 'one']);
    useAppStore.getState().updatePlaybackSettings({ loop: false });
    usePlayback.getState().play([pair.id]);

    usePlayback.getState().skipNext();

    expect(usePlayback.getState().status).toBe('idle');
  });
});

describe('timed sessions', () => {
  it('stops cleanly when the session expires', () => {
    const [pair] = seedPairs(['uno', 'one']);

    usePlayback.getState().playTimed([pair.id], 1);
    expect(usePlayback.getState().sessionEndsAt).toBe(Date.now() + 60_000);

    jest.advanceTimersByTime(60_000);

    expect(usePlayback.getState().status).toBe('idle');
    expect(usePlayback.getState().sessionEndsAt).toBeNull();
    expect(Speech.stop).toHaveBeenCalled();
  });

  it('rejects invalid minutes', () => {
    const [pair] = seedPairs(['uno', 'one']);

    usePlayback.getState().playTimed([pair.id], 0);

    expect(usePlayback.getState().status).toBe('idle');
    expect(speakMock).not.toHaveBeenCalled();
  });
});

describe('stop', () => {
  it('resets everything to idle', () => {
    const pairs = seedPairs(['uno', 'one'], ['dos', 'two']);
    usePlayback.getState().playTimed(
      pairs.map(pair => pair.id),
      5,
    );

    usePlayback.getState().stop();

    expect(usePlayback.getState()).toMatchObject({
      status: 'idle',
      queue: [],
      currentIndex: 0,
      currentRepeat: 0,
      sessionEndsAt: null,
    });
    expect(Speech.stop).toHaveBeenCalled();
  });
});
