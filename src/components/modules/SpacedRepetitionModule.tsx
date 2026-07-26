'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  Clock,
  Sparkles,
  CheckCircle2,
  Leaf,
  Eye,
  ArrowLeft,
  Trophy,
  Home,
  ThumbsUp,
  Minus,
  ThumbsDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { SpeakButton } from '@/components/shared/SpeakButton';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { getCategoryColor } from '@/lib/constants';
import { categories, wordPairs, type WordPair } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

type Screen = 'overview' | 'review' | 'summary';
type Rating = 'easy' | 'medium' | 'hard';

const MAX_SESSION = 30;

/** Fisher-Yates shuffle (returns a new array). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SpacedRepetitionModule() {
  const {
    selectedCategories,
    cardProgress,
    updateCardProgress,
    incrementPracticed,
    saveExerciseResult,
    incrementTodayReviewed,
    setActiveModule,
  } = useAppStore();

  const [screen, setScreen] = useState<Screen>('overview');
  const [sessionDeck, setSessionDeck] = useState<WordPair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [results, setResults] = useState<{ easy: number; medium: number; hard: number }>({
    easy: 0,
    medium: 0,
    hard: 0,
  });
  const [advancing, setAdvancing] = useState(false);

  // Tracks the pending auto-advance timeout so we can cancel it when leaving
  // the review screen mid-rating (prevents stale state updates).
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Compute due / new / mastered cards from the current store state. */
  const { dueCards, newCards, masteredCount } = useMemo(() => {
    const now = Date.now();
    const base =
      selectedCategories.length > 0
        ? wordPairs.filter((w) => selectedCategories.includes(w.category))
        : wordPairs;

    const due: WordPair[] = [];
    const fresh: WordPair[] = [];
    let mastered = 0;

    for (const w of base) {
      const p = cardProgress[w.id];
      if (!p) {
        // Card has never been reviewed → both new AND due
        fresh.push(w);
        due.push(w);
      } else if (p.nextReview <= now) {
        // Scheduled card whose review time has arrived
        due.push(w);
      }
      if (p && p.correct >= 5) mastered++;
    }

    return { dueCards: due, newCards: fresh, masteredCount: mastered };
  }, [selectedCategories, cardProgress]);

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  /** Start a fresh review session: shuffle due cards, cap at MAX_SESSION. */
  const startSession = useCallback(() => {
    if (dueCards.length === 0) return;
    clearAdvanceTimer();
    const deck = shuffle(dueCards).slice(0, MAX_SESSION);
    setSessionDeck(deck);
    setCurrentIndex(0);
    setIsRevealed(false);
    setResults({ easy: 0, medium: 0, hard: 0 });
    setAdvancing(false);
    setScreen('review');
  }, [dueCards, clearAdvanceTimer]);

  /** Reveal the Turkish translation for the current card. */
  const handleReveal = useCallback(() => setIsRevealed(true), []);

  /**
   * Rate the current card. Calls SM-2 update in the store, records the
   * outcome, then auto-advances to the next card after 1s (or summary).
   */
  const handleRate = useCallback(
    (rating: Rating) => {
      if (advancing) return;
      const card = sessionDeck[currentIndex];
      if (!card) return;

      // SM-2 update + global stats
      updateCardProgress(card.id, rating);
      incrementPracticed(rating !== 'hard');
      incrementTodayReviewed();

      // Compute the final tally synchronously (state update is async, but
      // we need the correct values when transitioning to summary inside the
      // setTimeout callback).
      const finalResults = {
        easy: results.easy + (rating === 'easy' ? 1 : 0),
        medium: results.medium + (rating === 'medium' ? 1 : 0),
        hard: results.hard + (rating === 'hard' ? 1 : 0),
      };
      setResults(finalResults);
      setAdvancing(true);

      clearAdvanceTimer();
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        if (currentIndex < sessionDeck.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setIsRevealed(false);
          setAdvancing(false);
        } else {
          // Session complete — persist to history & show summary
          const correct = finalResults.easy + finalResults.medium;
          saveExerciseResult('flashcards', correct, sessionDeck.length, selectedCategories);
          setAdvancing(false);
          setScreen('summary');
        }
      }, 1000);
    },
    [
      advancing,
      sessionDeck,
      currentIndex,
      updateCardProgress,
      incrementPracticed,
      incrementTodayReviewed,
      results,
      saveExerciseResult,
      selectedCategories,
      clearAdvanceTimer,
    ]
  );

  /** Leave the review screen early — returns to overview. */
  const handleBackToOverview = useCallback(() => {
    clearAdvanceTimer();
    setAdvancing(false);
    setIsRevealed(false);
    setScreen('overview');
  }, [clearAdvanceTimer]);

  /** From summary → overview (lets user see updated SM-2 stats). */
  const handleRetry = useCallback(() => {
    clearAdvanceTimer();
    setScreen('overview');
  }, [clearAdvanceTimer]);

  /** From summary → dashboard. */
  const handleBackToMenu = useCallback(() => {
    clearAdvanceTimer();
    setActiveModule('dashboard');
  }, [setActiveModule, clearAdvanceTimer]);

  // ============================================================
  //  OVERVIEW SCREEN
  // ============================================================
  if (screen === 'overview') {
    return (
      <div className="space-y-6">
        <CategoryFilter />

        {/* Gradient header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
              <RotateCcw className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Aralıklı Tekrar</h1>
              <p className="mt-1 text-sm leading-relaxed text-white/90">
                SM-2 algoritması ile kalıcı öğrenme. Kartları düzenli aralıklarla
                tekrar ederek öğrendiklerinizi uzun süreli belleğe taşıyın.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-xl bg-blue-50 p-3">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold tabular-nums">{dueCards.length}</div>
                  <div className="text-xs text-muted-foreground">Bugün Tekrar Bekleyen</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-xl bg-cyan-50 p-3">
                  <Sparkles className="h-6 w-6 text-cyan-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold tabular-nums">{newCards.length}</div>
                  <div className="text-xs text-muted-foreground">Yeni Kartlar</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold tabular-nums">{masteredCount}</div>
                  <div className="text-xs text-muted-foreground">Ustalaşan</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* CTA or empty state */}
        <AnimatePresence mode="wait">
          {dueCards.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                  <div className="rounded-full bg-emerald-50 p-4">
                    <Leaf className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Harika iş çıkardın!</h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Şu an tekrar bekleyen kart yok. Farklı bir kategori seçerek yeni
                    kartlar keşfedebilir ya da daha sonra geri dönüp bilgilerini
                    tazeleyebilirsin.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="cta"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              {/* Start CTA */}
              <Card className="overflow-hidden border-0 shadow-sm">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-center text-white">
                  <h2 className="text-xl font-bold">Tekrar Zamanı</h2>
                  <p className="mt-1 text-sm text-white/90">
                    {Math.min(dueCards.length, MAX_SESSION)} kart hazır. Hadi başlayalım.
                  </p>
                  <Button
                    onClick={startSession}
                    size="lg"
                    className="mt-4 bg-white text-blue-600 hover:bg-blue-50"
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Tekrarı Başlat
                  </Button>
                </div>
              </Card>

              {/* Due cards preview (up to 5) */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Tekrar Bekleyen Kartlar</h3>
                    <Badge variant="outline" className="text-xs">
                      {dueCards.length} kart
                    </Badge>
                  </div>
                  <Separator className="mb-3" />
                  <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                    {dueCards.slice(0, 5).map((card) => {
                      const clr = getCategoryColor(card.category);
                      const p = cardProgress[card.id];
                      return (
                        <div
                          key={card.id}
                          className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                        >
                          <div className={cn('h-2 w-2 shrink-0 rounded-full', clr.bg)} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{card.german}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {card.turkish}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {p ? `${p.correct}/${p.correct + p.wrong}` : 'Yeni'}
                          </Badge>
                        </div>
                      );
                    })}
                    {dueCards.length > 5 && (
                      <p className="pt-1 text-center text-xs text-muted-foreground">
                        ve {dueCards.length - 5} kart daha...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ============================================================
  //  REVIEW SCREEN
  // ============================================================
  if (screen === 'review') {
    const card = sessionDeck[currentIndex];

    // Defensive fallback — should never happen, but keeps TS happy
    if (!card) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">Kart bulunamadı.</p>
          <Button onClick={handleBackToOverview} className="mt-4" variant="outline">
            Geri Dön
          </Button>
        </div>
      );
    }

    const cat = categories.find((c) => c.id === card.category);
    const progressPct = ((currentIndex + 1) / sessionDeck.length) * 100;
    const correctSoFar = results.easy + results.medium;

    return (
      <div className="space-y-4">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={handleBackToOverview}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Geri Dön
        </Button>

        {/* Progress bar + counters */}
        <div className="space-y-2">
          <Progress value={progressPct} className="h-2" />
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs tabular-nums">
              {currentIndex + 1} / {sessionDeck.length}
            </Badge>
            <Badge className="border-0 bg-emerald-100 text-emerald-700 text-xs tabular-nums">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {correctSoFar} doğru
            </Badge>
          </div>
        </div>

        {/* Flashcard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-0 shadow-sm">
              {/* German side — gradient header */}
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white">
                <div className="mb-3 flex items-center justify-between">
                  <Badge className="border-0 bg-white/20 text-xs text-white backdrop-blur">
                    {cat?.nameTr || 'Kelime'}
                  </Badge>
                  <Badge className="border-0 bg-white/20 text-xs text-white backdrop-blur">
                    Almanca
                  </Badge>
                </div>
                <div className="flex items-center justify-center gap-3 py-4">
                  <p className="text-center text-2xl font-semibold leading-relaxed md:text-3xl">
                    {card.german}
                  </p>
                  <SpeakButton
                    text={card.german}
                    size="md"
                    color="blue"
                    label="Dinle"
                  />
                </div>
              </div>

              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  {isRevealed ? (
                    <motion.div
                      key="revealed"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <Separator />

                      {/* Turkish translation */}
                      <div className="rounded-xl bg-amber-50 p-4 text-center">
                        <Badge className="border-0 bg-amber-200 text-xs text-amber-800">
                          Türkçe
                        </Badge>
                        <p className="mt-2 text-xl font-semibold text-amber-900 md:text-2xl">
                          {card.turkish}
                        </p>
                      </div>

                      {/* Rating buttons */}
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          onClick={() => handleRate('hard')}
                          disabled={advancing}
                          className="bg-red-500 text-white hover:bg-red-600"
                        >
                          <ThumbsDown className="mr-1 h-4 w-4" />
                          Zor
                        </Button>
                        <Button
                          onClick={() => handleRate('medium')}
                          disabled={advancing}
                          className="bg-amber-500 text-white hover:bg-amber-600"
                        >
                          <Minus className="mr-1 h-4 w-4" />
                          Orta
                        </Button>
                        <Button
                          onClick={() => handleRate('easy')}
                          disabled={advancing}
                          className="bg-emerald-500 text-white hover:bg-emerald-600"
                        >
                          <ThumbsUp className="mr-1 h-4 w-4" />
                          Güzel
                        </Button>
                      </div>
                      <p className="text-center text-xs text-muted-foreground">
                        {advancing
                          ? 'Bir sonraki karta geçiliyor...'
                          : 'Kendini nasıl değerlendiriyorsun?'}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3 py-2"
                    >
                      <Button
                        onClick={handleReveal}
                        size="lg"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Eye className="mr-2 h-5 w-5" />
                        Cevabı Gör
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Önce Türkçe çevirisini düşün, ardından cevabı göster
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ============================================================
  //  SUMMARY SCREEN
  // ============================================================
  const totalCards = sessionDeck.length || 1;
  const correctTotal = results.easy + results.medium;
  const accuracy = Math.round((correctTotal / totalCards) * 100);

  const headerGradient =
    accuracy >= 80
      ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
      : accuracy >= 50
      ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
      : 'bg-gradient-to-br from-amber-500 to-amber-700';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-xl"
    >
      <Card className="overflow-hidden border-0 shadow-sm">
        {/* Trophy header */}
        <div className={cn('p-6 text-center text-white', headerGradient)}>
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="mx-auto mb-3 w-fit"
          >
            <Trophy className="h-14 w-14" />
          </motion.div>
          <h2 className="text-2xl font-bold">Tekrar Tamamlandı!</h2>
          <p className="mt-1 text-sm text-white/90">
            {sessionDeck.length} kartı tamamladın
          </p>
        </div>

        <CardContent className="space-y-4 p-6">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-emerald-50 p-3">
              <ThumbsUp className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
              <div className="text-2xl font-bold text-emerald-600 tabular-nums">
                {results.easy}
              </div>
              <div className="text-xs text-muted-foreground">Güzel</div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <Minus className="mx-auto mb-1 h-5 w-5 text-amber-600" />
              <div className="text-2xl font-bold text-amber-600 tabular-nums">
                {results.medium}
              </div>
              <div className="text-xs text-muted-foreground">Orta</div>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <ThumbsDown className="mx-auto mb-1 h-5 w-5 text-red-600" />
              <div className="text-2xl font-bold text-red-600 tabular-nums">
                {results.hard}
              </div>
              <div className="text-xs text-muted-foreground">Zor</div>
            </div>
          </div>

          <Separator />

          {/* Accuracy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Doğruluk Oranı</span>
              <span className="font-bold tabular-nums">{accuracy}%</span>
            </div>
            <Progress value={accuracy} className="h-3" />
            <p className="text-center text-xs text-muted-foreground">
              {correctTotal} / {sessionDeck.length} kart doğru
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              onClick={handleRetry}
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Tekrar Dene
            </Button>
            <Button
              onClick={handleBackToMenu}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Home className="mr-2 h-4 w-4" />
              Ana Menüye Dön
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
