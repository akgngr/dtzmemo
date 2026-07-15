'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, RotateCcw, Volume2, Mic } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { categories, wordPairs } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { getCategoryColor } from '@/lib/constants';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { ConfettiOverlay } from '@/components/shared/ConfettiOverlay';
import { SpeakButton } from '@/components/shared/SpeakButton';
import { PronunciationCheck } from '@/components/shared/PronunciationCheck';

export function FlashcardModule() {
  const { selectedCategories, cardProgress, updateCardProgress, incrementPracticed, incrementTodayReviewed } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedCategories]);

  const filteredWords = useMemo(() => {
    if (selectedCategories.length > 0) {
      return wordPairs.filter((w) => selectedCategories.includes(w.category));
    }
    const now = Date.now();
    const dueCards = wordPairs.filter(
      (w) => !cardProgress[w.id] || cardProgress[w.id].nextReview <= now
    );
    const notDue = wordPairs.filter(
      (w) => cardProgress[w.id] && cardProgress[w.id].nextReview > now
    );
    return [...dueCards, ...notDue];
  }, [selectedCategories, cardProgress]);

  const currentWord = filteredWords[currentIndex];

  const handleRate = useCallback(
    (rating: 'easy' | 'medium' | 'hard') => {
      if (!currentWord) return;
      updateCardProgress(currentWord.id, rating);
      incrementPracticed(rating !== 'hard');
      incrementTodayReviewed();

      if (rating === 'easy') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }

      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredWords.length);
      }, 300);
    },
    [currentWord, filteredWords.length, updateCardProgress, incrementPracticed, incrementTodayReviewed]
  );

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  if (!currentWord) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Bu kategoride kelime bulunamadı</p>
      </div>
    );
  }

  const clr = getCategoryColor(currentWord.category);
  const cat = categories.find((c) => c.id === currentWord.category);
  const reviewedToday = useAppStore.getState().todayReviewed;

  return (
    <div className="space-y-6">
      <ConfettiOverlay show={showConfetti} />
      <CategoryFilter />

      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span>Kart {currentIndex + 1} / {filteredWords.length}</span>
          <span className="text-muted-foreground">Bugün: {reviewedToday} kart</span>
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
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-lg"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <Badge className={`mb-4 ${clr.bg} text-white border-0`}>
                {cat?.nameTr || ''}
              </Badge>
              <div className="flex items-center gap-2">
                <p className="text-center text-xl font-semibold leading-relaxed text-gray-800 md:text-2xl">
                  {currentWord.german}
                </p>
                <SpeakButton text={currentWord.german} size="md" color="emerald" label="Dinle" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Çevirmek için tıklayın ↻
              </p>
            </div>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <Badge className="mb-4 bg-white/20 text-white border-0 backdrop-blur">
                Türkçe
              </Badge>
              <p className="text-center text-xl font-semibold leading-relaxed md:text-2xl">
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
                Zor 😰
              </Button>
              <Button onClick={() => handleRate('medium')} className="bg-amber-500 hover:bg-amber-600 text-white px-6">
                Orta 🤔
              </Button>
              <Button onClick={() => handleRate('easy')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6">
                Kolay 😊
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPronunciation((v) => !v)}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
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
                  subtitle="Cümleyi Almanca olarak seslendirin"
                  color="emerald"
                  variant="compact"
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={handleRestart}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Baştan Başla
        </Button>
      </div>
    </div>
  );
}
