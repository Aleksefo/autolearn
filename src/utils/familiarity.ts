import { Pair } from '@/state/types';

export const MAX_FAMILIARITY = 5;

// Manual rating (0 = unrated) plus a small automatic nudge from listens
// (+0.05 per listen, capped at +1.5), so heavily-listened pairs fade from
// rotation even when never rated.
export function effectiveFamiliarity(pair: Pair): number {
  const nudge = Math.min(1.5, pair.timesListened * 0.05);
  return Math.min(MAX_FAMILIARITY, pair.familiarity + nudge);
}

// Sampling weight for shuffles: an unfamiliar pair (0) is ~6x more likely to
// come up early than a mastered one (5).
export function playbackWeight(pair: Pair): number {
  return MAX_FAMILIARITY + 1 - effectiveFamiliarity(pair);
}
