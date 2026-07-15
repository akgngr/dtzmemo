'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lightbulb, Trophy, ArrowRight, RotateCcw, Brain } from 'lucide-react';
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

function getInitialCompletionPool(cats: string[]) {
  const words = cats.length > 0 ? wordPairs.filter((w) => cats.includes(w.category)) : wordPairs;
  return [...words].sort(() => Math.random() - 0.5).slice(0, 8);
}

export function WordCompletionModule() {
  const { selectedCategories, incrementPracticed, saveExerciseResult } = useAppStore();
  const [pool, setPool] = useState<WordPair[]>(() => getInitialCompletionPool(selectedCategories));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const initPool = useCallback(() => {
    const words = selectedCategories.length > 0
      ? wordPairs.filter((w) => selectedCategories.includes(w.category))
      : wordPairs;
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 8);
    setPool(shuffled);
    setCurrentIndex(0);
    setUserInput('');
    setHintLevel(0);
    setResult(null);
    setScore({ correct: 0, total: 0 });
  }, [selectedCategories]);

  const currentWord = pool[currentIndex];

  const maskedSentence = useMemo(() => {
    if (!currentWord) return '';
    const words = currentWord.german.split(' ');
    return words.map((word) => {
      if (word.length <= 2) return word;
      const chars = word.split('');
      const maskCount = Math.max(1, Math.floor(chars.length * 0.4));
      const indices = chars.map((_, i) => i).filter((i) => /[a-zA-ZäöüÄÖÜß]/.test(chars[i]));
      const toMask = indices.sort(() => Math.random() - 0.5).slice(0, maskCount);
      return chars.map((c, i) => (toMask.includes(i) ? '_' : c)).join('');
    }).join(' ');
  }, [currentWord]);

  const revealedHint = useMemo(() => {
    if (!currentWord || hintLevel === 0) return maskedSentence;
    const original = currentWord.german;
    const chars = original.split('');
    const masked = maskedSentence.split('');
    const underlinedIndices = masked.map((c, i) => (c === '_' ? i : -1)).filter((i) => i !== -1);
    const toReveal = underlinedIndices.slice(0, hintLevel * 2);
    return masked.map((c, i) => (toReveal.includes(i) ? chars[i] : c)).join('');
  }, [currentWord, maskedSentence, hintLevel]);

  const handleProceed = useCallback(() => {
    if (currentIndex < pool.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserInput('');
      setHintLevel(0);
      setResult(null);
    } else {
      saveExerciseResult('word-completion', score.correct, score.total, selectedCategories);
    }
  }, [currentIndex, pool.length, score, saveExerciseResult, selectedCategories]);

  const handleSubmit = useCallback(() => {
    if (!currentWord) return;
    const isCorrect =
      userInput.trim().toLowerCase() === currentWord.german.toLowerCase().replace(/[.,!?;:]/g, '').trim() ||
      userInput.trim().toLowerCase() === currentWord.german.toLowerCase().trim();
    setResult(isCorrect ? 'correct' : 'wrong');
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    incrementPracticed(isCorrect);
  }, [currentWord, userInput, incrementPracticed]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && result === null) handleSubmit();
    },
    [result, handleSubmit]
  );

  if (pool.length === 0) return null;

  const isFinished = currentIndex >= pool.length - 1 && result !== null;

  return (
    <div className="space-y-6">
      <CategoryFilter />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-emerald-600" />
          <span className="font-medium">{score.correct} / {score.total}</span>
        </div>
        <Badge variant="outline">Soru {currentIndex + 1} / {pool.length}</Badge>
      </div>

      {!isFinished ? (
        <motion.div key={currentIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  💡 Türkçe: <strong>{currentWord?.turkish}</strong>
                </p>
                <SpeakButton text={currentWord?.german || ''} size="sm" color="amber" label="Dinle" />
              </div>
              <p className="mb-6 text-center text-lg font-mono font-medium tracking-wide leading-relaxed md:text-xl">
                {revealedHint}
              </p>
              <div className="flex gap-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tam cümleyi yazın..."
                  disabled={result !== null}
                  className={`text-center ${
                    result === 'correct' ? 'border-emerald-500 bg-emerald-50' : result === 'wrong' ? 'border-red-500 bg-red-50' : ''
                  }`}
                  dir="auto"
                />
                <Button onClick={handleSubmit} disabled={result !== null || userInput.trim() === ''} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setHintLevel((prev) => prev + 1)} disabled={result !== null}>
                  <Lightbulb className="mr-1 h-4 w-4 text-amber-500" />
                  İpucu (Seviye {hintLevel})
                </Button>
                {hintLevel > 0 && (
                  <Badge variant="secondary" className="text-xs">{hintLevel} harf açıldı</Badge>
                )}
              </div>
              <AnimatePresence>
                {result && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 space-y-3">
                    <div className={`rounded-lg p-3 text-center font-medium ${
                      result === 'correct' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {result === 'correct' ? (
                        <span>✅ Doğru!</span>
                      ) : (
                        <span>❌ Yanlış! Doğru cevap: <strong>{currentWord?.german}</strong></span>
                      )}
                    </div>
                    <PronunciationCheck
                      target={currentWord?.german || ''}
                      subtitle="Cümleyi Almanca olarak seslendirin"
                      color="emerald"
                      variant="full"
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
