export interface MemorizationWord {
  id: string;
  german: string;
  turkish: string;
  category: string;
}

import memoData from './word-vocabulary.json';

const rawData = memoData as { words: MemorizationWord[] };

export const memorizationWords: MemorizationWord[] = rawData.words;

export const memorizationCategories = Array.from(
  new Set(memorizationWords.map((w) => w.category))
).sort();
