'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  motion,
  AnimatePresence,
} from 'framer-motion';
import {
  CircleHelp,
  Check,
  X,
  Flame,
  Trophy,
  Clock,
  Target,
  TrendingUp,
  Home,
  ArrowLeft,
  Timer,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { SpeakButton } from '@/components/shared/SpeakButton';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { wordPairs, type WordPair } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

type Screen = 'setup' | 'quiz' | 'summary';
type Direction = 'de-to-tr' | 'tr-to-de';

interface QuizQuestion {
  word: WordPair;
  options: string[];
  correctIndex: number;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateQuestions(
  pool: WordPair[],
  count: number,
  direction: Direction
): QuizQuestion[] {
  const shuffled = shuffleArray(pool);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((word) => {
    const otherWords = pool.filter((w) => w.id !== word.id);
    const field: 'turkish' | 'german' = direction === 'de-to-tr' ? 'turkish' : 'german';
    const correctValue = word[field];

    const usedValues = new Set<string>([correctValue]);
    const wrongOptions: string[] = [];
    const candidates = shuffleArray(otherWords);

    for (const candidate of candidates) {
      const val = candidate[field];
      if (!usedValues.has(val)) {
        wrongOptions.push(val);
        usedValues.add(val);
      }
      if (wrongOptions.length >= 3) break;
    }

    while (wrongOptions.length < 3 && pool.length > 1) {
      const rand = pool[Math.floor(Math.random() * pool.length)];
      const val = rand[field];
      if (val !== correctValue && !wrongOptions.includes(val)) {
        wrongOptions.push(val);
      }
    }

    const options = shuffleArray([correctValue, ...wrongOptions]);
    const correctIndex = options.indexOf(correctValue);

    return { word, options, correctIndex };
  });
}

export function QuizModule() {
  const { selectedCategories, incrementPracticed, saveExerciseResult } = useAppStore();

  const [screen, setScreen] = useState<Screen>('setup');
  const [questionCount, setQuestionCount] = useState(10);
  const [direction, setDirection] = useState<Direction>('de-to-tr');
  const [timerEnabled, setTimerEnabled] = useState(false);

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerTimes, setAnswerTimes] = useState<number[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [timerProgress, setTimerProgress] = useState(100);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleAnswerRef = useRef<((idx: number) => void) | null>(null);
  const answeredRef = useRef(false);

  const filteredPool = useMemo(() => {
    if (selectedCategories.length > 0) {
      return wordPairs.filter((w) => selectedCategories.includes(w.category));
    }
    return [...wordPairs];
  }, [selectedCategories]);

  const currentQuestion = questions[currentIndex];
  const isAnswered = selectedOption !== null;

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (selectedOption !== null || !currentQuestion) return;
      if (answeredRef.current) return;
      answeredRef.current = true;

      setSelectedOption(optionIndex);
      if (timerRef.current) clearInterval(timerRef.current);

      const timeTaken = (Date.now() - questionStartTime) / 1000;
      setAnswerTimes((prev) => [...prev, timeTaken]);

      const isCorrect = optionIndex === currentQuestion.correctIndex;

      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
        setStreak((prev) => {
          const newStreak = prev + 1;
          setBestStreak((best) => Math.max(best, newStreak));
          return newStreak;
        });
        incrementPracticed(true);
      } else {
        setStreak(0);
        incrementPracticed(false);
      }

      autoAdvanceRef.current = setTimeout(() => {
        if (currentIndex + 1 >= questions.length) {
          const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
          saveExerciseResult(
            'quiz',
            finalCorrect,
            questions.length,
            selectedCategories.length > 0 ? selectedCategories : undefined
          );
          setScreen('summary');
        } else {
          setCurrentIndex((prev) => prev + 1);
          setSelectedOption(null);
          setQuestionStartTime(Date.now());
          setTimerProgress(100);
          answeredRef.current = false;
        }
      }, 1200);
    },
    [selectedOption, currentQuestion, questionStartTime, currentIndex, questions.length, correctCount, incrementPracticed, saveExerciseResult, selectedCategories]
  );

  // Keep ref in sync
  useEffect(() => {
    handleAnswerRef.current = handleAnswer;
  });

  // Timer logic
  useEffect(() => {
    if (screen !== 'quiz' || !timerEnabled || isAnswered || !currentQuestion) return;

    timerRef.current = setInterval(() => {
      setTimerProgress((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Schedule auto-submit via setTimeout to avoid synchronous setState in effect
          setTimeout(() => {
            handleAnswerRef.current?.(-1);
          }, 0);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, timerEnabled, isAnswered, currentIndex, currentQuestion]);

  const handleStart = useCallback(() => {
    const qs = generateQuestions(filteredPool, questionCount, direction);
    if (qs.length === 0) return;
    setQuestions(qs);
    setCurrentIndex(0);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    setSelectedOption(null);
    setAnswerTimes([]);
    setQuestionStartTime(Date.now());
    setTimerProgress(100);
    answeredRef.current = false;
    setScreen('quiz');
  }, [filteredPool, questionCount, direction]);

  const handleRetry = useCallback(() => {
    setScreen('setup');
  }, []);

  const handleGoHome = useCallback(() => {
    useAppStore.getState().setActiveModule('dashboard');
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  // ======================== SETUP SCREEN ========================
  if (screen === 'setup') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CircleHelp className="h-7 w-7" />
            <h2 className="text-2xl font-bold">Kelime Quiz</h2>
          </div>
          <p className="text-white/80 text-sm">
            Coktan secmeli sorularla Almanca-Turkce kelime bilgini test et
          </p>
        </div>

        {/* Settings Card */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5 space-y-5">
            {/* Question Count */}
            <div className="space-y-2.5">
              <label className="text-sm font-medium text-muted-foreground">Soru Sayisi</label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 15, 20].map((count) => (
                  <Button
                    key={count}
                    variant={questionCount === count ? 'default' : 'outline'}
                    className={cn(
                      'rounded-xl h-11 text-sm font-semibold transition-all',
                      questionCount === count &&
                        'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-sm'
                    )}
                    onClick={() => setQuestionCount(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Direction Toggle */}
            <div className="space-y-2.5">
              <label className="text-sm font-medium text-muted-foreground">Soru Yonu</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={direction === 'de-to-tr' ? 'default' : 'outline'}
                  className={cn(
                    'rounded-xl h-11 text-sm font-semibold transition-all',
                    direction === 'de-to-tr' &&
                      'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-sm'
                  )}
                  onClick={() => setDirection('de-to-tr')}
                >
                  DE &rarr; TR
                </Button>
                <Button
                  variant={direction === 'tr-to-de' ? 'default' : 'outline'}
                  className={cn(
                    'rounded-xl h-11 text-sm font-semibold transition-all',
                    direction === 'tr-to-de' &&
                      'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-sm'
                  )}
                  onClick={() => setDirection('tr-to-de')}
                >
                  TR &rarr; DE
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {direction === 'de-to-tr'
                  ? 'Almanca kelime gosterilir, Turkce karsiligi secilir'
                  : 'Turkce kelime gosterilir, Almanca karsiligi secilir'}
              </p>
            </div>

            <Separator />

            {/* Timer Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Timer className="h-4.5 w-4.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Zamanlayici</p>
                  <p className="text-xs text-muted-foreground">
                    {timerEnabled ? 'Her soru icin 10 saniye' : 'Suresiz mod'}
                  </p>
                </div>
              </div>
              <Button
                variant={timerEnabled ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'rounded-lg transition-all',
                  timerEnabled &&
                    'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-sm'
                )}
                onClick={() => setTimerEnabled(!timerEnabled)}
              >
                {timerEnabled ? 'Acik' : 'Kapali'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button
          className={cn(
            'w-full h-13 rounded-2xl text-base font-bold shadow-sm border-0',
            'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
          )}
          onClick={handleStart}
          disabled={filteredPool.length < 4}
        >
          <CircleHelp className="mr-2 h-5 w-5" />
          Quizi Baslat
        </Button>

        {filteredPool.length < 4 && (
          <p className="text-center text-sm text-destructive">
            En az 4 kelime gereklidir. Lutfen kategori secin.
          </p>
        )}

        {/* Category Filter */}
        <CategoryFilter />
      </div>
    );
  }

  // ======================== QUIZ SCREEN ========================
  if (screen === 'quiz' && currentQuestion) {
    const isCorrectAnswer = selectedOption === currentQuestion.correctIndex;
    const promptText = direction === 'de-to-tr' ? currentQuestion.word.german : currentQuestion.word.turkish;
    const speakLang = direction === 'de-to-tr' ? 'de' : 'tr';

    return (
      <div className="space-y-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
              setScreen('setup');
            }}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Geri Don
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-semibold">
              {currentIndex + 1}/{questions.length}
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs font-semibold text-emerald-600 bg-emerald-50"
            >
              <Check className="mr-1 h-3 w-3" />
              {correctCount}
            </Badge>
            {streak >= 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <Badge className="text-xs font-semibold text-orange-600 bg-orange-50 border-orange-200">
                  <Flame className="mr-1 h-3 w-3" />
                  {streak}
                </Badge>
              </motion.div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2" />

        {/* Timer Bar */}
        {timerEnabled && (
          <div className="relative">
            <Progress
              value={timerProgress}
              className={cn(
                'h-1.5 transition-none',
                timerProgress <= 30 && !isAnswered
                  ? '[&>div]:bg-red-500'
                  : timerProgress <= 60 && !isAnswered
                    ? '[&>div]:bg-amber-500'
                    : '[&>div]:bg-indigo-500'
              )}
            />
            <div className="absolute right-0 top-0 -translate-y-5">
              <span className="text-xs text-muted-foreground font-mono">
                {Math.ceil(timerProgress / 10)}s
              </span>
            </div>
          </div>
        )}

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center">
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-2">
                  {direction === 'de-to-tr'
                    ? 'Bu kelimenin Turkcesi nedir?'
                    : 'Bu kelimenin Almancasi nedir?'}
                </p>
                <p className="text-white text-3xl font-bold tracking-tight">
                  {promptText}
                </p>
                <div className="mt-3 flex justify-center">
                  <SpeakButton
                    text={promptText}
                    lang={speakLang}
                    size="sm"
                    variant="subtle"
                  />
                </div>
              </div>

              <CardContent className="p-4 space-y-2.5">
                {currentQuestion.options.map((option, idx) => {
                  const isThisCorrect = idx === currentQuestion.correctIndex;
                  const isSelected = selectedOption === idx;

                  let optionClass = 'border-border hover:bg-accent/50 text-foreground';

                  if (isAnswered) {
                    if (isThisCorrect) {
                      optionClass =
                        'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-50';
                    } else if (isSelected) {
                      optionClass =
                        'border-red-300 bg-red-50 text-red-700 hover:bg-red-50';
                    } else {
                      optionClass = 'border-border/50 text-muted-foreground opacity-60';
                    }
                  }

                  return (
                    <Button
                      key={idx}
                      variant="outline"
                      disabled={isAnswered}
                      className={cn(
                        'w-full justify-start h-14 px-4 rounded-xl text-base font-medium transition-all',
                        optionClass
                      )}
                      onClick={() => handleAnswer(idx)}
                    >
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold mr-3 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 text-left">{option}</span>
                      {isAnswered && isThisCorrect && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          <Check className="h-5 w-5 text-emerald-600" />
                        </motion.div>
                      )}
                      {isAnswered && isSelected && !isThisCorrect && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          <X className="h-5 w-5 text-red-600" />
                        </motion.div>
                      )}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Streak Display */}
        {streak >= 3 && (
          <motion.div
            className="flex items-center justify-center gap-2 text-orange-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Flame className="h-5 w-5" />
            <span className="text-sm font-bold">{streak} seri dogru!</span>
          </motion.div>
        )}
      </div>
    );
  }

  // ======================== SUMMARY SCREEN ========================
  if (screen === 'summary') {
    const wrongCount = questions.length - correctCount;
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const avgTime =
      timerEnabled && answerTimes.length > 0
        ? (answerTimes.reduce((a, b) => a + b, 0) / answerTimes.length).toFixed(1)
        : null;

    const getFeedback = () => {
      if (accuracy >= 90) return { label: 'Muhtesem!', color: 'text-emerald-500' };
      if (accuracy >= 70) return { label: 'Cok iyi!', color: 'text-blue-500' };
      if (accuracy >= 50) return { label: 'Iyi calisma!', color: 'text-amber-500' };
      return { label: 'Tekrar dene!', color: 'text-red-500' };
    };

    const feedback = getFeedback();

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white text-center shadow-sm">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-300" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-1">Quiz Tamamlandi!</h2>
          <p className={cn('text-lg font-semibold', feedback.color)}>{feedback.label}</p>
        </div>

        {/* Stats Card */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4">
              {/* Correct */}
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600">Dogru</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">{correctCount}</p>
              </div>

              {/* Wrong */}
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-medium text-red-600">Yanlis</span>
                </div>
                <p className="text-2xl font-bold text-red-700">{wrongCount}</p>
              </div>

              {/* Accuracy */}
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Target className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-medium text-indigo-600">Dogruluk</span>
                </div>
                <p className="text-2xl font-bold text-indigo-700">%{accuracy}</p>
              </div>

              {/* Best Streak */}
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-medium text-orange-600">En Iyi Seri</span>
                </div>
                <p className="text-2xl font-bold text-orange-700">{bestStreak}</p>
              </div>
            </div>

            {/* Average Time (if timer was on) */}
            {avgTime && (
              <>
                <Separator className="my-4" />
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-medium text-purple-600">Ortalama Sure</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">{avgTime}s</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Score Bar Visualization */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Genel Performans
              </span>
              <span className="text-sm font-bold text-foreground">%{accuracy}</span>
            </div>
            <div className="relative h-4 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  accuracy >= 70
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                    : accuracy >= 50
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-gradient-to-r from-red-400 to-red-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${accuracy}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className={cn(
              'w-full h-12 rounded-2xl text-base font-bold shadow-sm border-0',
              'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
            )}
            onClick={handleRetry}
          >
            <TrendingUp className="mr-2 h-5 w-5" />
            Tekrar Dene
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 rounded-2xl text-base font-semibold"
            onClick={handleGoHome}
          >
            <Home className="mr-2 h-5 w-5" />
            Ana Menuye Don
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
