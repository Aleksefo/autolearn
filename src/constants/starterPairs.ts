import { NewPairInput } from '@/state/types';

// Sample vocabulary offered from the empty state, per language pair.
const STARTER_SETS: Record<string, [string, string][]> = {
  'es->en': [
    ['hola', 'hello'],
    ['gracias', 'thank you'],
    ['por favor', 'please'],
    ['la casa', 'the house'],
    ['el agua', 'the water'],
    ['comer', 'to eat'],
    ['hablar', 'to speak'],
    ['aprender', 'to learn'],
    ['despacio', 'slowly'],
    ['la palabra', 'the word'],
  ],
};

export function starterPairsFor(
  sourceLanguage: string,
  targetLanguage: string,
): NewPairInput[] {
  const key = `${sourceLanguage.slice(0, 2)}->${targetLanguage.slice(0, 2)}`;
  return (STARTER_SETS[key] ?? []).map(([term, definition]) => ({
    term,
    definition,
    sourceLanguage,
    targetLanguage,
  }));
}
