export interface VocabWord {
  id: string;
  german: string;
  turkish: string;
  category: string;
  frequency: number;
}

import memoData from './word-vocabulary.json';

const rawMemo = (memoData as { words: { id: string; german: string; turkish: string; category: string }[] }).words;

export const vocabulary: VocabWord[] = rawMemo.map((w, i) => ({
  id: w.id,
  german: w.german,
  turkish: w.turkish,
  category: w.category,
  frequency: 1,
}));
