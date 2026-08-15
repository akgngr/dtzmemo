/* B1 Sınavı Tip Tanımları — DeutschMemo */

export interface VocabItem {
  id: string;
  german: string;
  article?: string | null;
  plural?: string | null;
  turkish: string;
  example: string;
  exampleTr?: string;
  topic: string;
  topicTr: string;
}

export interface WritingPrompt {
  id: string;
  title: string;
  titleTr: string;
  description: string;
  descriptionTr: string;
  tips: string[];
  minWords: number;
  maxWords: number;
}

export interface GrammarQuestion {
  id: string;
  sentence: string;
  sentenceTr: string;
  blank: string;
  options: string[];
  correctIndex: number;
  grammarTopic: string;
  grammarTopicTr: string;
}

export interface PicturePrompt {
  id: string;
  title: string;
  titleTr: string;
  imageUrl: string;
  description: string;
  descriptionTr: string;
  guidedQuestions: { de: string; tr: string }[];
  usefulPhrases: string[];
  minSentences: number;
}
