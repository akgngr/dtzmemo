'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, RotateCcw, Brain, ArrowRight, Check, X, Trophy, Mic } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { memorizationWords, type MemorizationWord } from '@/lib/memorization-data';
import { categories } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { getCategoryColor } from '@/lib/constants';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { SpeakButton } from '@/components/shared/SpeakButton';
import { PronunciationCheck } from '@/components/shared/PronunciationCheck';

type Mode = 'flashcard' | 'quiz-de-tr' | 'quiz-tr-de';

export function WordMemorizationModule() {
  const { selectedCategories, cardProgress, updateCardProgress, incrementPracticed, saveExerciseResult } = useAppStore();
  const [mode, setMode] = useState<Mode>('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [quizPool, setQuizPool] = useState<MemorizationWord[]>([]);

  // Reset when category filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setUserInput('');
    setResult(null);
  }, [selectedCategories]);

  // Build filtered word list using spaced-repetition scheduling
  const filteredWords = useMemo(() => {
    const base = selectedCategories.length > 0
      ? memorizationWords.filter((w) => selectedCategories.includes(w.category))
      : memorizationWords;

    if (selectedCategories.length > 0) {
      return base;
    }

    // Spaced repetition: due cards first, then new, then not-due
    const now = Date.now();
    const due = base.filter((w) => !cardProgress[`memo-${w.id}`] || cardProgress[`memo-${w.id}`].nextReview <= now);
    const notDue = base.filter((w) => cardProgress[`memo-${w.id}`] && cardProgress[`memo-${w.id}`].nextReview > now);
    return [...due, ...notDue];
  }, [selectedCategories, cardProgress]);

  const currentWord = mode === 'flashcard' ? filteredWords[currentIndex] : quizPool[currentIndex];
  const totalWords = mode === 'flashcard' ? filteredWords.length : quizPool.length;

  const initQuiz = useCallback((quizMode: Mode) => {
    const pool = [...filteredWords].sort(() => Math.random() - 0.5).slice(0, 15);
    setQuizPool(pool);
    setCurrentIndex(0);
    setUserInput('');
    setResult(null);
    setScore({ correct: 0, total: 0 });
    setMode(quizMode);
  }, [filteredWords]);

  const handleRate = useCallback(
    (rating: 'easy' | 'medium' | 'hard') => {
      if (!currentWord) return;
      updateCardProgress(`memo-${currentWord.id}`, rating);
      incrementPracticed(rating !== 'hard');

      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredWords.length);
      }, 300);
    },
    [currentWord, filteredWords.length, updateCardProgress, incrementPracticed]
  );

  const handleSubmit = useCallback(() => {
    if (!currentWord) return;
    const correctAnswer = mode === 'quiz-de-tr' ? currentWord.turkish : currentWord.german;
    const isCorrect = userInput.trim().toLowerCase() === correctAnswer.toLowerCase();
    setResult(isCorrect ? 'correct' : 'wrong');
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    incrementPracticed(isCorrect);
  }, [currentWord, userInput, mode, incrementPracticed]);

  const handleProceed = useCallback(() => {
    if (currentIndex < totalWords - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserInput('');
      setResult(null);
    } else {
      saveExerciseResult('kelime-ezber', score.correct, score.total, selectedCategories);
      setMode('flashcard');
      setCurrentIndex(0);
      setQuizPool([]);
    }
  }, [currentIndex, totalWords, score, saveExerciseResult, selectedCategories]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && result === null && mode !== 'flashcard') handleSubmit();
    },
    [result, mode, handleSubmit]
  );

  const [showPronunciation, setShowPronunciation] = useState(false);

  if (filteredWords.length === 0) {
    return (
      <div className="space-y-6">
        <CategoryFilter />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Brain className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">Bu kategoride kelime bulunamadı</p>
        </div>
      </div>
    );
  }

  if (!currentWord) return null;

  const clr = getCategoryColor(currentWord.category);
  const cat = categories.find((c) => c.id === currentWord.category);
  const cardKey = `memo-${currentWord.id}`;
  const progress = cardProgress[cardKey];

  return (
    <div className="space-y-6">
      <CategoryFilter />

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={mode === 'flashcard' ? 'default' : 'outline'}
          className={`h-auto flex-col gap-1 py-3 ${mode === 'flashcard' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
          onClick={() => { setMode('flashcard'); setCurrentIndex(0); setIsFlipped(false); }}
        >
          <BookOpen className="h-4 w-4" />
          <span className="text-xs font-medium">Kartlar</span>
          <span className="text-[10px] opacity-70">Ezberleme</span>
        </Button>
        <Button
          variant={mode === 'quiz-de-tr' ? 'default' : 'outline'}
          className={`h-auto flex-col gap-1 py-3 ${mode === 'quiz-de-tr' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
          onClick={() => initQuiz('quiz-de-tr')}
        >
          <ArrowRight className="h-4 w-4" />
          <span className="text-xs font-medium">DE→TR</span>
          <span className="text-[10px] opacity-70">Almanca → Türkçe</span>
        </Button>
        <Button
          variant={mode === 'quiz-tr-de' ? 'default' : 'outline'}
          className={`h-auto flex-col gap-1 py-3 ${mode === 'quiz-tr-de' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
          onClick={() => initQuiz('quiz-tr-de')}
        >
          <RotateCcw className="h-4 w-4" />
          <span className="text-xs font-medium">TR→DE</span>
          <span className="text-[10px] opacity-70">Türkçe → Almanca</span>
        </Button>
      </div>

      {(mode === 'quiz-de-tr' || mode === 'quiz-tr-de') && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-600" />
            <span className="font-medium">{score.correct} / {score.total}</span>
          </div>
          <Badge variant="outline">{currentIndex + 1} / {totalWords}</Badge>
        </div>
      )}

      {mode === 'flashcard' && (
        <>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Kelime {currentIndex + 1} / {filteredWords.length}</span>
              {progress && (
                <span className="text-xs text-muted-foreground">
                  Doğru: {progress.correct} • Yanlış: {progress.wrong}
                </span>
              )}
            </div>
            <Progress value={((currentIndex + 1) / filteredWords.length) * 100} className="h-2" />
          </div>

          <div className="flex justify-center">
            <div className="perspective-1000 w-full max-w-lg">
              <motion.div
                className="relative h-72 w-full cursor-pointer md:h-80"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: 'preserve-3d' }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front: German */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-lg"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <Badge className={`mb-4 ${clr.bg} text-white border-0`}>
                    {cat?.nameTr || currentWord.category}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <p className="text-center text-3xl font-bold leading-relaxed text-gray-800 md:text-4xl">
                      {currentWord.german}
                    </p>
                    <SpeakButton text={currentWord.german} size="md" color="purple" label="Dinle" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Çevirmek için tıklayın ↻
                  </p>
                </div>

                {/* Back: Turkish */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 p-6 text-white shadow-lg"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <Badge className="mb-4 bg-white/20 text-white border-0 backdrop-blur">
                    Türkçe
                  </Badge>
                  <p className="text-center text-3xl font-bold leading-relaxed md:text-4xl">
                    {currentWord.turkish}
                  </p>
                  <p className="mt-4 text-sm opacity-80">
                    Zorluk derecesini seçin
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          <AnimatePresence>
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex justify-center gap-3">
                  <Button onClick={() => handleRate('hard')} className="bg-red-500 hover:bg-red-600 text-white px-6">
                    <X className="mr-1 h-4 w-4" />
                    Bilmiyorum
                  </Button>
                  <Button onClick={() => handleRate('medium')} className="bg-amber-500 hover:bg-amber-600 text-white px-6">
                    Orta 🤔
                  </Button>
                  <Button onClick={() => handleRate('easy')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6">
                    <Check className="mr-1 h-4 w-4" />
                    Biliyorum
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPronunciation((v) => !v)}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  <Mic className="mr-1 h-4 w-4" />
                  {showPronunciation ? 'Telefuz kontrolünü gizle' : 'Telefuzunu kontrol et'}
                </Button>
                {showPronunciation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full max-w-lg"
                  >
                    <PronunciationCheck
                      target={currentWord.german}
                      subtitle="Kelimeyi Almanca olarak seslendirin"
                      color="purple"
                      variant="compact"
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Baştan Başla
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsFlipped(false);
                setTimeout(() => {
                  setCurrentIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
                }, 200);
              }}
            >
              ← Önceki
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsFlipped(false);
                setTimeout(() => {
                  setCurrentIndex((prev) => (prev + 1) % filteredWords.length);
                }, 200);
              }}
            >
              Sonraki →
            </Button>
          </div>
        </>
      )}

      {(mode === 'quiz-de-tr' || mode === 'quiz-tr-de') && (
        <motion.div key={`${mode}-${currentIndex}`} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between rounded-lg bg-purple-50 p-3">
                <p className="text-sm text-purple-800">
                  {mode === 'quiz-de-tr' ? '🇩🇪 Almanca' : '🇹🇷 Türkçe'}: <strong className="text-lg">{mode === 'quiz-de-tr' ? currentWord.german : currentWord.turkish}</strong>
                </p>
                {mode === 'quiz-de-tr' && (
                  <SpeakButton text={currentWord.german} size="md" color="purple" label="Dinle" />
                )}
              </div>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                {mode === 'quiz-de-tr' ? 'Türkçe çevirisini yazın' : 'Almanca çevirisini yazın'}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={mode === 'quiz-de-tr' ? 'Türkçe çeviri...' : 'Almanca çeviri...'}
                  disabled={result !== null}
                  className={`flex h-10 w-full rounded-md border px-3 py-2 text-center text-lg ${
                    result === 'correct'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : result === 'wrong'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-input bg-background'
                  }`}
                  dir="auto"
                  autoFocus
                />
                <Button
                  onClick={handleSubmit}
                  disabled={result !== null || userInput.trim() === ''}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 space-y-3"
                  >
                    <div className={`rounded-lg p-3 text-center font-medium ${
                      result === 'correct' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {result === 'correct' ? (
                        <span>✅ Doğru!</span>
                      ) : (
                        <span>
                          ❌ Yanlış! Doğru cevap:{' '}
                          <strong>{mode === 'quiz-de-tr' ? currentWord.turkish : currentWord.german}</strong>
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={handleProceed}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      {currentIndex < totalWords - 1 ? 'İlerle' : 'Sonuçları Gör'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
