'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lightbulb, Trophy, ArrowRight, RotateCcw, Target, PenLine } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { wordPairs, type WordPair } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { SpeakButton } from '@/components/shared/SpeakButton';
import { PronunciationCheck } from '@/components/shared/PronunciationCheck';

function getInitialFillPool(cats: string[]) {
  const words = cats.length > 0 ? wordPairs.filter((w) => cats.includes(w.category)) : wordPairs;
  return [...words].sort(() => Math.random() - 0.5).slice(0, 10);
}

export function FillBlankModule() {
  const { selectedCategories, incrementPracticed, saveExerciseResult } = useAppStore();
  const [pool, setPool] = useState<WordPair[]>(() => getInitialFillPool(selectedCategories));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const initPool = useCallback(() => {
    const words = selectedCategories.length > 0
      ? wordPairs.filter((w) => selectedCategories.includes(w.category))
      : wordPairs;
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 10);
    setPool(shuffled);
    setCurrentIndex(0);
    setUserInput('');
    setShowHint(false);
    setResult(null);
    setScore({ correct: 0, total: 0 });
  }, [selectedCategories]);

  const currentWord = pool[currentIndex];

  const blankData = useMemo(() => {
    if (!currentWord) return { display: '', answer: '', hint: '' };
    const words = currentWord.german.split(' ');
    const longWords = words.filter((w) => w.length > 3);
    const targetWord = longWords.length > 0
      ? longWords[Math.floor(Math.random() * longWords.length)]
      : words[Math.floor(Math.random() * words.length)];
    const display = currentWord.german.replace(targetWord, '___');
    return {
      display,
      answer: targetWord.replace(/[.,!?;:]/g, ''),
      hint: targetWord[0] + '_'.repeat(targetWord.length - 1),
    };
  }, [currentWord]);

  const handleProceed = useCallback(() => {
    if (currentIndex < pool.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserInput('');
      setShowHint(false);
      setResult(null);
    } else {
      saveExerciseResult('fill-blank', score.correct, score.total, selectedCategories);
    }
  }, [currentIndex, pool.length, score, saveExerciseResult, selectedCategories]);

  const handleSubmit = useCallback(() => {
    if (!currentWord) return;
    const isCorrect = userInput.trim().toLowerCase() === blankData.answer.toLowerCase();
    setResult(isCorrect ? 'correct' : 'wrong');
    const newScore = {
      correct: score.correct + (isCorrect ? 1 : 0),
      total: score.total + 1,
    };
    setScore(newScore);
    incrementPracticed(isCorrect);
  }, [currentWord, userInput, blankData, score, incrementPracticed]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && result === null) handleSubmit();
    },
    [result, handleSubmit]
  );

  if (pool.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PenLine className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Lütfen bir kategori seçin</p>
      </div>
    );
  }

  const isFinished = currentIndex >= pool.length - 1 && result !== null;

  return (
    <div className="space-y-6">
      <CategoryFilter />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-600" />
          <span className="font-medium">{score.correct} / {score.total}</span>
        </div>
        <Badge variant="outline">Soru {currentIndex + 1} / {pool.length}</Badge>
      </div>

      {!isFinished ? (
        <motion.div key={currentIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  💡 Türkçe: <strong>{currentWord?.turkish}</strong>
                </p>
                <SpeakButton text={currentWord?.german || ''} size="sm" color="amber" label="Dinle" />
              </div>
              <p className="mb-6 text-center text-lg font-medium leading-relaxed md:text-xl">
                {blankData.display}
              </p>
              <div className="flex gap-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Eksik kelimeyi yazın..."
                  disabled={result !== null}
                  className={`text-center text-lg ${
                    result === 'correct'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : result === 'wrong'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : ''
                  }`}
                  dir="auto"
                />
                <Button onClick={handleSubmit} disabled={result !== null || userInput.trim() === ''} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setShowHint(true)} disabled={showHint || result !== null}>
                  <Lightbulb className="mr-1 h-4 w-4 text-amber-500" />
                  İpucu
                </Button>
                {showHint && (
                  <span className="text-sm text-amber-600">
                    İpucu: <strong>{blankData.hint}</strong>
                  </span>
                )}
              </div>
              <AnimatePresence>
                {result && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-4 space-y-3">
                    <div className={`rounded-lg p-3 text-center font-medium ${
                      result === 'correct' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {result === 'correct' ? (
                        <span>✅ Doğru!</span>
                      ) : (
                        <span>❌ Yanlış! Doğru cevap: <strong>{blankData.answer}</strong></span>
                      )}
                    </div>
                    <PronunciationCheck
                      target={currentWord?.german || ''}
                      subtitle="Cümleyi Almanca olarak seslendirin"
                      color="emerald"
                      variant="compact"
                    />
                    <Button onClick={handleProceed} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      {currentIndex < pool.length - 1 ? 'İlerle' : 'Sonuçları Gör'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-amber-500" />
              <h3 className="text-xl font-bold">Alıştırma Tamamlandı!</h3>
              <p className="mt-2 text-muted-foreground">Doğru: {score.correct} / {score.total}</p>
              <Progress value={(score.correct / score.total) * 100} className="mt-4 h-3" />
              <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={initPool}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Tekrar Dene
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={initPool}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Yeni Sorular
        </Button>
      </div>
    </div>
  );
}
