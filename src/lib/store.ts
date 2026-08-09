import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CardProgress {
  ease: number;
  interval: number;
  nextReview: number;
  correct: number;
  wrong: number;
}

interface ExerciseResult {
  correct: number;
  total: number;
}

interface ExerciseHistoryEntry {
  id: string;
  date: string;
  exercise: string;
  exerciseLabel: string;
  correct: number;
  total: number;
  categories: string[];
}

interface ApiKeys {
  zhipuKey: string;
  openaiKey: string;
  claudeKey: string;
  googleAiKey: string;
  elevenLabsKey: string;
  googleTtsKey: string;
}

export interface CustomWord {
  german: string;
  turkish: string;
}

export interface CustomWordList {
  id: string;
  name: string;
  description: string;
  words: CustomWord[];
  createdAt: string;
  category: string;
}

export interface CustomReadingQuestion {
  id: number;
  text: string;
  type: 'richtig-falsch' | 'multiple-choice';
  correctAnswer: string;
  options?: { key: string; text: string }[];
}

export interface CustomReadingExercise {
  id: string;
  level: 'A1' | 'A2' | 'B1';
  title: string;
  titleTr: string;
  category: string;
  text: string;
  questions: CustomReadingQuestion[];
  createdAt: string;
}

export type TargetLanguage = 'tr' | 'en' | 'fa' | 'ar' | 'fr';

export const LANGUAGE_OPTIONS: { value: TargetLanguage; label: string; flag: string }[] = [
  { value: 'tr', label: 'Turkce', flag: 'TR' },
  { value: 'en', label: 'Ingilizce', flag: 'EN' },
  { value: 'fa', label: 'Farsca', flag: 'FA' },
  { value: 'ar', label: 'Arapca', flag: 'AR' },
  { value: 'fr', label: 'Fransizca', flag: 'FR' },
];

interface SpeechUsage {
  // YYYY-MM format — when the current billing cycle started
  month: string;
  // How many successful STT calls happened this month
  count: number;
  // User-configurable monthly limit (default 300 — well within Google's
  // practical free-tier tolerance for an individual user)
  monthlyLimit: number;
}

interface AppState {
  // Current view/module
  activeModule: string;
  setActiveModule: (module: string) => void;

  // Selected categories filter (multi-select)
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  toggleCategory: (categoryId: string) => void;
  clearCategories: () => void;

  // Spaced repetition data
  cardProgress: Record<string, CardProgress>;
  updateCardProgress: (id: string, rating: "easy" | "medium" | "hard") => void;

  // Statistics
  totalPracticed: number;
  correctAnswers: number;
  incrementPracticed: (correct: boolean) => void;

  // Streak
  streak: number;
  lastPracticeDate: string | null;
  checkStreak: () => void;

  // Exercise results
  exerciseResults: Record<string, ExerciseResult>;
  saveExerciseResult: (exercise: string, correct: number, total: number, categories?: string[]) => void;

  // Exercise history
  exerciseHistory: ExerciseHistoryEntry[];
  clearHistory: () => void;

  // Today's review count
  todayReviewed: number;
  lastReviewDate: string | null;
  incrementTodayReviewed: () => void;

  // ===== Google Web Speech API usage tracking =====
  // STT is the only metered service — TTS is unlimited (browser-local).
  // Counter resets automatically on the 1st of each month.
  speechUsage: SpeechUsage;
  // Increment today's STT count — auto-rolls over if month changed
  incrementSpeechUsage: () => void;
  // Set user-configurable monthly limit
  setSpeechMonthlyLimit: (limit: number) => void;
  // Check if user has remaining quota (after auto-rollover)
  hasSpeechQuota: () => boolean;
  // Remaining count this month (0 if exhausted)
  remainingSpeechQuota: () => number;
  // Days until next reset (1st of next month)
  daysUntilSpeechReset: () => number;

  // ===== API Keys =====
  apiKeys: ApiKeys;
  setApiKey: (key: keyof ApiKeys, value: string) => void;
  setApiKeys: (keys: Partial<ApiKeys>) => void;
  clearApiKeys: () => void;

  // ===== Custom Reading Exercises =====
  customReadingExercises: CustomReadingExercise[];
  addCustomReadingExercise: (exercise: CustomReadingExercise) => void;
  deleteCustomReadingExercise: (id: string) => void;

  // ===== Custom Word Lists =====
  customWordLists: CustomWordList[];
  addCustomWordList: (list: CustomWordList) => void;
  deleteCustomWordList: (id: string) => void;
  updateCustomWordList: (id: string, updates: Partial<CustomWordList>) => void;

  // ===== Vorstellung (B1 Exam Self-Introduction) =====
  vorstellungText: string;
  vorstellungChunks: string[];
  setVorstellungText: (text: string) => void;

  // ===== Target Language =====
  targetLanguage: TargetLanguage;
  setTargetLanguage: (lang: TargetLanguage) => void;

  // Clear all data (preserves API keys + custom words + vorstellung)
  clearAllData: () => void;
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// Current month in YYYY-MM format (used for monthly quota rollover)
function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Default monthly limit for Google Web Speech API STT calls.
// 300 is well within Google's practical free-tier tolerance for individual
// users; user can adjust in Settings.
const DEFAULT_SPEECH_MONTHLY_LIMIT = 300;

// Split a Vorstellung text into meaningful chunks (2-4 sentences each)
function splitVorstellungIntoChunks(text: string): string[] {
  // Split on sentence endings, keeping the delimiter
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length === 0) return [];

  // Group sentences into chunks of 2-3, or 1-2 for short sentences
  const chunks: string[] = [];
  let current = '';
  let sentenceCount = 0;

  for (const sentence of sentences) {
    const isShort = sentence.split(' ').length <= 5;
    const maxSentences = isShort ? 3 : 2;

    if (current) {
      current += ' ' + sentence;
      sentenceCount++;
    } else {
      current = sentence;
      sentenceCount = 1;
    }

    if (sentenceCount >= maxSentences) {
      chunks.push(current.trim());
      current = '';
      sentenceCount = 0;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

let historyCounter = 0;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeModule: "dashboard",
      setActiveModule: (module) => set({ activeModule: module }),

      selectedCategories: [],
      setSelectedCategories: (categories) => set({ selectedCategories: categories }),
      toggleCategory: (categoryId) =>
        set((state) => {
          const exists = state.selectedCategories.includes(categoryId);
          if (exists) {
            return { selectedCategories: state.selectedCategories.filter((c) => c !== categoryId) };
          }
          return { selectedCategories: [...state.selectedCategories, categoryId] };
        }),
      clearCategories: () => set({ selectedCategories: [] }),

      cardProgress: {},
      updateCardProgress: (id, rating) =>
        set((state) => {
          const existing = state.cardProgress[id] || {
            ease: 2.5,
            interval: 1,
            nextReview: Date.now(),
            correct: 0,
            wrong: 0,
          };

          let { ease, interval, nextReview, correct, wrong } = existing;

          if (rating === "easy") {
            ease = Math.min(ease + 0.3, 5.0);
            interval = Math.max(interval * ease, 1);
            correct += 1;
          } else if (rating === "medium") {
            interval = Math.max(interval * 1.2, 1);
            correct += 1;
          } else {
            ease = Math.max(ease - 0.3, 1.3);
            interval = 1;
            wrong += 1;
          }

          nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

          return {
            cardProgress: {
              ...state.cardProgress,
              [id]: { ease, interval, nextReview, correct, wrong },
            },
          };
        }),

      totalPracticed: 0,
      correctAnswers: 0,
      incrementPracticed: (correct) =>
        set((state) => ({
          totalPracticed: state.totalPracticed + 1,
          correctAnswers: state.correctAnswers + (correct ? 1 : 0),
        })),

      streak: 0,
      lastPracticeDate: null,
      checkStreak: () => {
        const today = getTodayStr();
        const state = get();
        if (state.lastPracticeDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        if (state.lastPracticeDate === yesterdayStr) {
          set({ streak: state.streak + 1, lastPracticeDate: today });
        } else if (state.lastPracticeDate !== today) {
          set({ streak: 1, lastPracticeDate: today });
        }
      },

      exerciseResults: {},
      saveExerciseResult: (exercise, correct, total, categories = []) =>
        set((state) => {
          const labels: Record<string, string> = {
            'fill-blank': 'Boşluk Doldurma',
            'word-completion': 'Kelime Tamamlama',
            'drag-drop': 'Sürükle Bırak',
            'matching': 'Eşleştirme',
            'flashcards': 'Kartlar',
            'competition': 'Yarışma',
            'kelime-ezber': 'Kelime Ezberleme',
            'conversation': 'Konuşma Pratiği',
            'pronunciation': 'Telaffuz Pratiği',
            'spaced-repetition': 'Aralıklı Tekrar',
            'listening': 'Dinleme Anlama',
            'quiz': 'Kelime Quiz',
          };

          const entry: ExerciseHistoryEntry = {
            id: `hist-${Date.now()}-${historyCounter++}`,
            date: new Date().toISOString(),
            exercise,
            exerciseLabel: labels[exercise] || exercise,
            correct,
            total,
            categories,
          };

          return {
            exerciseResults: {
              ...state.exerciseResults,
              [exercise]: {
                correct:
                  (state.exerciseResults[exercise]?.correct || 0) + correct,
                total: (state.exerciseResults[exercise]?.total || 0) + total,
              },
            },
            exerciseHistory: [entry, ...state.exerciseHistory].slice(0, 100), // Keep last 100 entries
          };
        }),

      exerciseHistory: [],
      clearHistory: () => set({ exerciseHistory: [] }),

      todayReviewed: 0,
      lastReviewDate: null,
      incrementTodayReviewed: () =>
        set((state) => {
          const today = getTodayStr();
          if (state.lastReviewDate === today) {
            return { todayReviewed: state.todayReviewed + 1 };
          }
          return { todayReviewed: 1, lastReviewDate: today };
        }),

      // ===== Google Web Speech API usage tracking =====
      speechUsage: {
        month: getCurrentMonth(),
        count: 0,
        monthlyLimit: DEFAULT_SPEECH_MONTHLY_LIMIT,
      },

      incrementSpeechUsage: () =>
        set((state) => {
          const currentMonth = getCurrentMonth();
          // If the calendar month changed since last call, reset counter to 1
          // (this is the auto-rollover — happens automatically on the 1st)
          if (state.speechUsage.month !== currentMonth) {
            return {
              speechUsage: {
                ...state.speechUsage,
                month: currentMonth,
                count: 1,
              },
            };
          }
          // Same month — just bump the counter
          return {
            speechUsage: {
              ...state.speechUsage,
              count: state.speechUsage.count + 1,
            },
          };
        }),

      setSpeechMonthlyLimit: (limit) =>
        set((state) => {
          // Clamp to a sane range [1, 10000]
          const safe = Math.max(1, Math.min(10000, Math.floor(limit)));
          return {
            speechUsage: {
              ...state.speechUsage,
              monthlyLimit: safe,
            },
          };
        }),

      hasSpeechQuota: () => {
        const state = get();
        const currentMonth = getCurrentMonth();
        // If month rolled over, quota is fresh
        if (state.speechUsage.month !== currentMonth) return true;
        return state.speechUsage.count < state.speechUsage.monthlyLimit;
      },

      remainingSpeechQuota: () => {
        const state = get();
        const currentMonth = getCurrentMonth();
        // If month rolled over, full quota is available
        if (state.speechUsage.month !== currentMonth) {
          return state.speechUsage.monthlyLimit;
        }
        return Math.max(
          0,
          state.speechUsage.monthlyLimit - state.speechUsage.count
        );
      },

      daysUntilSpeechReset: () => {
        const now = new Date();
        // Next reset = 1st of next month at 00:00 local
        const nextReset = new Date(
          now.getFullYear(),
          now.getMonth() + 1, // JS Date auto-rolls Dec→Jan of next year
          1,
          0,
          0,
          0,
          0
        );
        const msPerDay = 24 * 60 * 60 * 1000;
        const diffMs = nextReset.getTime() - now.getTime();
        // Ceiling so user sees "1 day" until tomorrow's reset, not "0.4 days"
        return Math.max(0, Math.ceil(diffMs / msPerDay));
      },

      // ===== API Keys =====
      apiKeys: {
        zhipuKey: '',
        openaiKey: '',
        claudeKey: '',
        googleAiKey: '',
        elevenLabsKey: '',
        googleTtsKey: '',
      },

      setApiKey: (key, value) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [key]: value },
        })),

      setApiKeys: (keys) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, ...keys },
        })),

      clearApiKeys: () =>
        set({
          apiKeys: { zhipuKey: '', openaiKey: '', claudeKey: '', googleAiKey: '', elevenLabsKey: '', googleTtsKey: '' },
        }),

      // ===== Custom Reading Exercises =====
      customReadingExercises: [],

      addCustomReadingExercise: (exercise) =>
        set((state) => ({
          customReadingExercises: [...state.customReadingExercises, exercise],
        })),

      deleteCustomReadingExercise: (id) =>
        set((state) => ({
          customReadingExercises: state.customReadingExercises.filter((e) => e.id !== id),
        })),

      // ===== Custom Word Lists =====
      customWordLists: [],

      addCustomWordList: (list) =>
        set((state) => ({
          customWordLists: [...state.customWordLists, list],
        })),

      deleteCustomWordList: (id) =>
        set((state) => ({
          customWordLists: state.customWordLists.filter((l) => l.id !== id),
        })),

      updateCustomWordList: (id, updates) =>
        set((state) => ({
          customWordLists: state.customWordLists.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),

      // ===== Vorstellung (B1 Exam Self-Introduction) =====
      vorstellungText: '',
      vorstellungChunks: [],

      setVorstellungText: (text) => {
        const chunks = text.trim()
          ? splitVorstellungIntoChunks(text.trim())
          : [];
        set({ vorstellungText: text, vorstellungChunks: chunks });
      },

      // ===== Target Language =====
      targetLanguage: 'tr' as TargetLanguage,

      setTargetLanguage: (lang) => set({ targetLanguage: lang }),

      clearAllData: () =>
        set({
          selectedCategories: [],
          cardProgress: {},
          totalPracticed: 0,
          correctAnswers: 0,
          streak: 0,
          lastPracticeDate: null,
          exerciseResults: {},
          exerciseHistory: [],
          todayReviewed: 0,
          lastReviewDate: null,
          speechUsage: {
            month: getCurrentMonth(),
            count: 0,
            monthlyLimit: DEFAULT_SPEECH_MONTHLY_LIMIT,
          },
          // NOTE: apiKeys and customWordLists are NOT cleared
        }),
    }),
    {
      name: "deutsch-memo-storage",
      version: 8,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === 1) {
          const oldCategory = persistedState.selectedCategory;
          return {
            ...persistedState,
            selectedCategories: oldCategory ? [oldCategory] : [],
            exerciseHistory: persistedState.exerciseHistory || [],
          };
        }
        if (version === 2) {
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          return {
            ...persistedState,
            speechUsage: {
              month: currentMonth,
              count: 0,
              monthlyLimit: 300,
            },
          };
        }
        if (version === 3) {
          return {
            ...persistedState,
            apiKeys: { zhipuKey: '', elevenLabsKey: '', googleTtsKey: '' },
          };
        }
        if (version === 4) {
          return {
            ...persistedState,
            customWordLists: persistedState.customWordLists || [],
            targetLanguage: persistedState.targetLanguage || 'tr',
            customReadingExercises: persistedState.customReadingExercises || [],
          };
        }
        if (version === 5) {
          return {
            ...persistedState,
            customReadingExercises: persistedState.customReadingExercises || [],
          };
        }
        if (version === 6) {
          return {
            ...persistedState,
            apiKeys: {
              zhipuKey: persistedState.apiKeys?.zhipuKey || '',
              openaiKey: '',
              claudeKey: '',
              googleAiKey: persistedState.apiKeys?.googleAiKey || '',
              elevenLabsKey: persistedState.apiKeys?.elevenLabsKey || '',
              googleTtsKey: persistedState.apiKeys?.googleTtsKey || '',
            },
          };
        }
        if (version === 7) {
          return {
            ...persistedState,
            vorstellungText: persistedState.vorstellungText || '',
            vorstellungChunks: persistedState.vorstellungChunks || [],
          };
        }
        return persistedState;
      },
    }
  )
);
