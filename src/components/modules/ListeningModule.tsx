'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headphones,
  ArrowLeft,
  RotateCcw,
  Target,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Trophy,
  Volume2,
  Clock,
  ListChecks,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { SpeakButton } from '@/components/shared/SpeakButton';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { wordPairs, type WordPair, categories } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { getCategoryColor } from '@/lib/constants';
import { cn } from '@/lib/utils';

type Screen = 'topics' | 'play' | 'summary';
type DifficultyMode = 'easy' | 'medium' | 'hard';

interface SessionResult {
  wordId: string;
  german: string;
  turkish: string;
  isCorrect: boolean;
  responseTime: number; // ms
}

const SESSION_SIZE = 15;
const ADVANCE_DELAY = 1500; // ms

const MODE_CONFIG: Record<
  DifficultyMode,
  { label: string; desc: string; badge: string; badgeColor: string; icon: React.ElementType; color: string }
> = {
  easy: {
    label: 'Kolay Dinleme',
    desc: 'Kategori aynı, 4 seçenek',
    badge: 'Başlangıç',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    icon: Volume2,
    color: 'from-green-500 to-emerald-500',
  },
  medium: {
    label: 'Orta Dinleme',
    desc: 'Farklı kategoriler, 4 seçenek',
    badge: 'Orta Seviye',
    badgeColor: 'bg-amber-100 text-amber-700',
    icon: Headphones,
    color: 'from-amber-500 to-orange-500',
  },
  hard: {
    label: 'Zor Dinleme',
    desc: 'Cümle dinle, seçenekler benzer',
    badge: 'İleri Seviye',
    badgeColor: 'bg-red-100 text-red-700',
    icon: Target,
    color: 'from-red-500 to-rose-500',
  },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

// Jaccard similarity on Turkish tokens, with a small length-similarity bonus.
function similarity(a: WordPair, b: WordPair): number {
  const ta = new Set(tokenize(a.turkish));
  const tb = new Set(tokenize(b.turkish));
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  ta.forEach((t) => {
    if (tb.has(t)) shared += 1;
  });
  const jaccard = shared / (ta.size + tb.size - shared);
  const lengthPenalty = Math.abs(a.turkish.length - b.turkish.length) / 100;
  return jaccard - lengthPenalty;
}

function buildPool(selectedCategories: string[]): WordPair[] {
  let pool = [...wordPairs];
  if (selectedCategories.length > 0) {
    pool = pool.filter((w) => selectedCategories.includes(w.category));
  }
  return shuffle(pool).slice(0, SESSION_SIZE);
}

function generateOptions(correct: WordPair, mode: DifficultyMode): WordPair[] {
  const pool = wordPairs.filter((w) => w.id !== correct.id && w.turkish !== correct.turkish);
  let candidates: WordPair[] = [];

  if (mode === 'easy') {
    // Same category as correct
    candidates = pool.filter((w) => w.category === correct.category);
    // Fallback to random others if same category has fewer than 3
    if (candidates.length < 3) {
      const others = shuffle(pool.filter((w) => w.category !== correct.category));
      candidates = [...candidates, ...others];
    }
  } else if (mode === 'medium') {
    // Different categories than correct
    candidates = pool.filter((w) => w.category !== correct.category);
  } else {
    // Hard: pick most similar (shared Turkish words + similar length)
    const scored = pool.map((w) => ({ w, score: similarity(correct, w) }));
    scored.sort((a, b) => b.score - a.score);
    candidates = scored.slice(0, Math.min(10, scored.length)).map((s) => s.w);
  }

  // Pick 3 unique-by-Turkish distractors
  const distractors: WordPair[] = [];
  const seen = new Set<string>();
  for (const w of shuffle(candidates)) {
    if (!seen.has(w.turkish)) {
      distractors.push(w);
      seen.add(w.turkish);
      if (distractors.length >= 3) break;
    }
  }

  return shuffle([correct, ...distractors]);
}

export function ListeningModule() {
  const { selectedCategories, incrementPracticed, saveExerciseResult } = useAppStore();
  const [screen, setScreen] = useState<Screen>('topics');
  const [mode, setMode] = useState<DifficultyMode>('easy');
  const [pool, setPool] = useState<WordPair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<WordPair[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasListened, setHasListened] = useState(false);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);

  const startTimeRef = useRef<number>(Date.now());
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentWord = pool[currentIndex];
  const totalCorrect = sessionResults.filter((r) => r.isCorrect).length;
  const totalAttempted = sessionResults.length;
  const avgResponseTime =
    totalAttempted > 0
      ? Math.round(sessionResults.reduce((s, r) => s + r.responseTime, 0) / totalAttempted / 100) / 10
      : 0;

  // Cleanup auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const startSession = useCallback(
    (difficultyMode: DifficultyMode) => {
      const newPool = buildPool(selectedCategories);
      if (newPool.length === 0) return;
      setMode(difficultyMode);
      setPool(newPool);
      setCurrentIndex(0);
      setSessionResults([]);
      const firstWord = newPool[0];
      setOptions(generateOptions(firstWord, difficultyMode));
      setSelectedId(null);
      setHasListened(false);
      startTimeRef.current = Date.now();
      setScreen('play');
    },
    [selectedCategories]
  );

  const goToNext = useCallback(
    (wasCorrect: boolean) => {
      const nextIndex = currentIndex + 1;
      const newCorrect = totalCorrect + (wasCorrect ? 1 : 0);
      const newAttempted = totalAttempted + 1;
      if (nextIndex >= pool.length) {
        saveExerciseResult('listening', newCorrect, newAttempted, selectedCategories);
        setScreen('summary');
      } else {
        const nextWord = pool[nextIndex];
        setCurrentIndex(nextIndex);
        setOptions(generateOptions(nextWord, mode));
        setSelectedId(null);
        setHasListened(false);
        startTimeRef.current = Date.now();
      }
    },
    [currentIndex, pool, mode, totalCorrect, totalAttempted, saveExerciseResult, selectedCategories]
  );

  const handleSelect = useCallback(
    (option: WordPair) => {
      if (!currentWord || selectedId !== null) return; // Already answered
      const isCorrect = option.id === currentWord.id;
      const responseTime = Date.now() - startTimeRef.current;
      setSelectedId(option.id);
      incrementPracticed(isCorrect);
      setSessionResults((prev) => [
        ...prev,
        {
          wordId: currentWord.id,
          german: currentWord.german,
          turkish: currentWord.turkish,
          isCorrect,
          responseTime,
        },
      ]);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        goToNext(isCorrect);
      }, ADVANCE_DELAY);
    },
    [currentWord, selectedId, incrementPracticed, goToNext]
  );

  const handleBack = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    setScreen('topics');
  }, []);

  // ── Topics Screen ───────────────────────────────────────────────
  if (screen === 'topics') {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-white shadow-lg md:p-8"
        >
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-rose-200">
              <Headphones className="h-5 w-5" />
              <span className="text-sm font-medium">Dinleme Anlama</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">Dinleme Anlama</h2>
            <p className="mt-2 max-w-2xl text-rose-100">
              Almanca cümleyi dinle, doğru Türkçe çeviriyi 4 seçenek arasından bul. İşitme becerini
              geliştir, kelime dağarcığını pekiştir.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="border-0 bg-white/20 text-white backdrop-blur">
                <Headphones className="mr-1 h-3 w-3" /> Sesli dinleme
              </Badge>
              <Badge className="border-0 bg-white/20 text-white backdrop-blur">
                <ListChecks className="mr-1 h-3 w-3" /> 4 seçenek
              </Badge>
              <Badge className="border-0 bg-white/20 text-white backdrop-blur">
                <Target className="mr-1 h-3 w-3" /> 3 zorluk seviyesi
              </Badge>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.entries(MODE_CONFIG) as [DifficultyMode, (typeof MODE_CONFIG)[DifficultyMode]][]).map(
            ([key, cfg], idx) => (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => startSession(key)}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
              >
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                    cfg.color
                  )}
                >
                  <cfg.icon className="h-6 w-6" />
                </div>
                <div className="mt-3">
                  <h4 className="font-semibold text-gray-900">{cfg.label}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{cfg.desc}</p>
                </div>
                <Badge className={cn('mt-3 text-[10px]', cfg.badgeColor)}>{cfg.badge}</Badge>
              </motion.button>
            )
          )}
        </div>

        <Card className="border-0 bg-rose-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div className="text-sm text-rose-900">
                <p className="mb-1 font-semibold">İpuçları</p>
                <ul className="space-y-1 text-xs opacity-90 list-disc list-inside">
                  <li>Önce "Dinle" butonuna bas ve Almanca cümleyi dikkatlice dinle</li>
                  <li>Seçenekler dinledikten sonra görünecek — acele etme</li>
                  <li>Emin değilsen tekrar dinleyebilirsin</li>
                  <li>Her oturumda 15 soru vardır; ortalama yanıt süren takip edilir</li>
                  <li>Kolay modda seçenekler aynı kategoriden, zor modda benzer cümlelerden gelir</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-rose-600" />
              <h3 className="text-sm font-semibold">Kategori Filtresi</h3>
            </div>
            <CategoryFilter />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Play Screen ─────────────────────────────────────────────────
  if (screen === 'play' && currentWord) {
    const catColor = getCategoryColor(currentWord.category);
    const catName =
      categories.find((c) => c.id === currentWord.category)?.nameTr || currentWord.category;
    const answered = selectedId !== null;
    const isCorrectAnswer = answered && selectedId === currentWord.id;

    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Geri Dön
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-rose-600" />
            <span className="text-sm font-medium">{MODE_CONFIG[mode].label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {currentIndex + 1} / {pool.length}
            </Badge>
            <Badge
              variant="outline"
              className={totalCorrect > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''}
            >
              {totalCorrect} doğru
            </Badge>
          </div>
        </div>

        <Progress
          value={((currentIndex + 1) / pool.length) * 100}
          className="h-2 [&>div]:bg-rose-500"
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="overflow-hidden border-0 shadow-sm">
              {/* Header with hidden/revealed German text */}
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-center text-white">
                <div className="mb-3 flex items-center justify-center gap-2 text-xs text-rose-200">
                  <Volume2 className="h-4 w-4" />
                  <span>Dinle ve doğru çeviriyi seç</span>
                </div>
                <div className="flex min-h-[96px] items-center justify-center px-2">
                  {answered ? (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-lg font-bold leading-snug sm:text-xl"
                      dir="auto"
                    >
                      {currentWord.german}
                    </motion.p>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-5xl font-bold tracking-widest text-white/60">?</div>
                      <p className="text-xs text-rose-200">Almanca cümle gizli</p>
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="space-y-5 p-6">
                {/* Large Play button */}
                <div className="flex flex-col items-center gap-2">
                  {/* onClickCapture fires during the capture phase — before
                      SpeakButton's internal stopPropagation — so we can
                      detect the click and reveal the options. */}
                  <div
                    onClickCapture={() => setHasListened(true)}
                    className="relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg transition-transform hover:scale-105"
                  >
                    <div className="absolute inset-2 rounded-full border-2 border-white/20" />
                    <span className="pointer-events-none absolute inset-0 rounded-full bg-white/0 transition-colors group-hover:bg-white/10" />
                    <SpeakButton
                      text={currentWord.german}
                      size="lg"
                      color="emerald"
                      label="Dinle"
                      className="relative z-10 text-white hover:bg-white/20"
                    />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">Dinle</p>
                  <p className="text-xs text-muted-foreground">
                    {hasListened
                      ? 'Tekrar dinleyebilir veya çeviriyi seçebilirsin'
                      : 'Önce dinle, sonra seçenekler görünecek'}
                  </p>
                </div>

                {/* Category badge */}
                <div className="flex justify-center">
                  <Badge
                    variant="outline"
                    className={cn('gap-1', catColor.light, catColor.text, catColor.border)}
                  >
                    {catName}
                  </Badge>
                </div>

                <Separator />

                {/* Options — only after listening */}
                <AnimatePresence>
                  {hasListened ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                    >
                      {options.map((opt) => {
                        const isCorrectOpt = opt.id === currentWord.id;
                        const isSelected = opt.id === selectedId;
                        let stateClass =
                          'border-gray-200 hover:border-rose-300 hover:bg-rose-50';
                        if (answered) {
                          if (isCorrectOpt) {
                            stateClass = 'border-emerald-400 bg-emerald-50 text-emerald-900';
                          } else if (isSelected) {
                            stateClass = 'border-red-400 bg-red-50 text-red-900';
                          } else {
                            stateClass = 'border-gray-200 opacity-60';
                          }
                        }
                        return (
                          <Button
                            key={opt.id}
                            variant="outline"
                            disabled={answered}
                            onClick={() => handleSelect(opt)}
                            className={cn(
                              'h-auto justify-start whitespace-normal px-4 py-3 text-left leading-snug',
                              stateClass
                            )}
                          >
                            <span className="flex w-full items-center gap-2">
                              <span className="flex-1" dir="auto">
                                {opt.turkish}
                              </span>
                              {answered && isCorrectOpt && (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                              )}
                              {answered && isSelected && !isCorrectOpt && (
                                <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                              )}
                            </span>
                          </Button>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border-2 border-dashed border-rose-200 p-6 text-center text-rose-500"
                    >
                      <Headphones className="mx-auto mb-2 h-6 w-6" />
                      <p className="text-sm">
                        Yukarıdaki "Dinle" butonuna basarak cümleyi dinle
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Result message */}
                <AnimatePresence>
                  {answered && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'rounded-lg p-3 text-center',
                        isCorrectAnswer ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                      )}
                    >
                      {isCorrectAnswer ? (
                        <p className="flex items-center justify-center gap-1 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" /> Doğru! Sonraki soruya geçiliyor...
                        </p>
                      ) : (
                        <p className="flex flex-col items-center justify-center gap-0.5 text-sm font-medium">
                          <span className="flex items-center gap-1">
                            <XCircle className="h-4 w-4" /> Yanlış.
                          </span>
                          <span className="text-xs font-normal">
                            Doğru çeviri:{' '}
                            <span className="font-semibold" dir="auto">
                              {currentWord.turkish}
                            </span>
                          </span>
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Skip-wait button */}
                {answered && (
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (advanceTimerRef.current) {
                          clearTimeout(advanceTimerRef.current);
                          advanceTimerRef.current = null;
                        }
                        goToNext(isCorrectAnswer);
                      }}
                      className="text-muted-foreground"
                    >
                      Şimdi geç <ArrowLeft className="ml-1 h-3 w-3 rotate-180" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Summary Screen ──────────────────────────────────────────────
  if (screen === 'summary') {
    const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
    const wrong = totalAttempted - totalCorrect;
    const headerGradient =
      accuracy >= 80
        ? 'from-emerald-500 to-teal-600'
        : accuracy >= 50
          ? 'from-rose-500 to-pink-600'
          : 'from-red-500 to-rose-600';
    const accentClass =
      accuracy >= 80 ? 'text-emerald-600' : accuracy >= 50 ? 'text-amber-600' : 'text-red-600';
    const accentBg =
      accuracy >= 80
        ? '[&>div]:bg-emerald-500'
        : accuracy >= 50
          ? '[&>div]:bg-amber-500'
          : '[&>div]:bg-red-500';
    const praiseText =
      accuracy >= 80 ? 'Harika dinleme!' : accuracy >= 50 ? 'İyi gidiyorsun!' : 'Çalışmaya devam et!';
    const weakWords = sessionResults.filter((r) => !r.isCorrect);

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
        <Card className="overflow-hidden border-0 shadow-sm">
          <div className={cn('bg-gradient-to-br p-6 text-center text-white', headerGradient)}>
            <Trophy className="mx-auto mb-3 h-12 w-12" />
            <h2 className="text-2xl font-bold">Dinleme Pratiği Tamamlandı!</h2>
            <p className="mt-1 text-sm text-white/90">{MODE_CONFIG[mode].label} modu</p>
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="text-center">
              <p className={cn('text-5xl font-bold', accentClass)}>{accuracy}%</p>
              <p className={cn('text-sm font-semibold', accentClass)}>{praiseText}</p>
            </div>

            <Progress value={accuracy} className={cn('h-2', accentBg)} />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-emerald-50 p-3 text-center">
                <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
                <div className="text-xl font-bold text-emerald-700">{totalCorrect}</div>
                <div className="text-xs text-emerald-600">Doğru</div>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <XCircle className="mx-auto mb-1 h-5 w-5 text-red-600" />
                <div className="text-xl font-bold text-red-700">{wrong}</div>
                <div className="text-xs text-red-600">Yanlış</div>
              </div>
              <div className="rounded-lg bg-rose-50 p-3 text-center">
                <Target className="mx-auto mb-1 h-5 w-5 text-rose-600" />
                <div className="text-xl font-bold text-rose-700">{accuracy}%</div>
                <div className="text-xs text-rose-600">Başarı</div>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-center">
                <Clock className="mx-auto mb-1 h-5 w-5 text-amber-600" />
                <div className="text-xl font-bold text-amber-700">{avgResponseTime}s</div>
                <div className="text-xs text-amber-600">Ort. Süre</div>
              </div>
            </div>

            {weakWords.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-red-700">
                    Tekrar Çalışman Gerekenler ({weakWords.length})
                  </h4>
                  <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
                    {weakWords.map((w) => (
                      <div
                        key={w.wordId}
                        className="flex items-center justify-between rounded-md bg-red-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900" dir="auto">
                            {w.german}
                          </p>
                          <p className="truncate text-xs text-muted-foreground" dir="auto">
                            {w.turkish}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 border-red-200 bg-red-50 text-red-700"
                        >
                          {(w.responseTime / 1000).toFixed(1)}s
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => startSession(mode)}
                className="flex-1 bg-rose-600 text-white hover:bg-rose-700"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Tekrar Dene
              </Button>
              <Button onClick={() => setScreen('topics')} variant="outline" className="flex-1">
                Ana Menüye Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return null;
}
