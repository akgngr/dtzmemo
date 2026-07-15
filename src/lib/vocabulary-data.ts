export interface VocabWord {
  id: string;
  german: string;
  turkish: string;
  category: string;
  frequency: number;
}

import vocabData from './vocabulary-data.json';

export const vocabulary: VocabWord[] = vocabData as VocabWord[];
