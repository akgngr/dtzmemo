'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Check, ArrowRight, Trophy, RotateCcw, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { wordPairs, type WordPair } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { SortableWordChip } from '@/components/shared/SortableWordChip';
import { SpeakButton } from '@/components/shared/SpeakButton';
import { PronunciationCheck } from '@/components/shared/PronunciationCheck';

interface SortableWordItem {
  id: string;
  word: string;
}

function getInitialDragPool(cats: string[]): { pool: WordPair[]; wordOrder: SortableWordItem[] } {
  const words = cats.length > 0 ? wordPairs.filter((w) => cats.includes(w.category)) : wordPairs;
  const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 6);
  const initialOrder = shuffled.length > 0
    ? [...shuffled[0].german.split(' ')].sort(() => Math.random() - 0.5).map((w, i) => ({ id: `word-${i}-${w}`, word: w }))
    : [];
  return { pool: shuffled, wordOrder: initialOrder };
}

export function DragDropModule() {
  const { selectedCategories, incrementPracticed, saveExerciseResult } = useAppStore();
  const [initialDragState] = useState(() => getInitialDragPool(selectedCategories));
  const [pool, setPool] = useState<WordPair[]>(() => initialDragState.pool);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wordOrder, setWordOrder] = useState<SortableWordItem[]>(() => initialDragState.wordOrder);
  const [checked, setChecked] = useState(false);
  const [correctPositions, setCorrectPositions] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const buildWordOrder = (sentence: string): SortableWordItem[] => {
    return [...sentence.split(' ')].sort(() => Math.random() - 0.5).map((w, i) => ({ id: `word-${i}-${w}`, word: w }));
  };

  const initPool = useCallback(() => {
    const words = selectedCategories.length > 0
      ? wordPairs.filter((w) => selectedCategories.includes(w.category))
      : wordPairs;
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 6);
    setPool(shuffled);
    setCurrentIndex(0);
    setChecked(false);
    setCorrectPositions({});
    setScore({ correct: 0, total: 0 });
    if (shuffled.length > 0) setWordOrder(buildWordOrder(shuffled[0].german));
  }, [selectedCategories]);

  const currentWord = pool[currentIndex];

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWordOrder((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const handleCheck = useCallback(() => {
    if (!currentWord) return;
    const correctWords = currentWord.german.split(' ');
    const positions: Record<string, boolean> = {};
    let allCorrect = true;
    wordOrder.forEach((item, i) => {
      const isCorrectPos = item.word === correctWords[i];
      positions[item.id] = isCorrectPos;
      if (!isCorrectPos) allCorrect = false;
    });
    setCorrectPositions(positions);
    setChecked(true);
    setScore((prev) => ({
      correct: prev.correct + (allCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    incrementPracticed(allCorrect);
  }, [currentWord, wordOrder, incrementPracticed]);

  const handleNext = useCallback(() => {
    if (currentIndex < pool.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setWordOrder(buildWordOrder(pool[nextIdx].german));
      setChecked(false);
      setCorrectPositions({});
    } else {
      saveExerciseResult('drag-drop', score.correct, score.total, selectedCategories);
    }
  }, [currentIndex, pool, score, saveExerciseResult, selectedCategories]);

  const isFinished = currentIndex >= pool.length - 1 && checked;

  if (pool.length === 0) return null;

  return (
    <div className="space-y-6">
      <CategoryFilter />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-600" />
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
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Kelimeleri doğru sıraya dizin:
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={wordOrder.map((w) => w.id)} strategy={horizontalListSortingStrategy}>
                  <div className="flex flex-wrap justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-4 min-h-[60px]">
                    {wordOrder.map((item) => (
                      <SortableWordChip key={item.id} id={item.id} word={item.word} isCorrect={checked ? correctPositions[item.id] : null} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {checked && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-lg bg-emerald-50 p-3 text-center">
                  <p className="text-sm text-emerald-700">
                    Doğru sıra: <strong>{currentWord?.german}</strong>
                  </p>
                </motion.div>
              )}
              {checked && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                  <PronunciationCheck
                    target={currentWord?.german || ''}
                    subtitle="Cümleyi seslendirin"
                    color="emerald"
                    variant="compact"
                  />
                </motion.div>
              )}
              <div className="mt-4 flex justify-center gap-3">
                {!checked ? (
                  <Button onClick={handleCheck} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Check className="mr-2 h-4 w-4" /> Kontrol Et
                  </Button>
                ) : (
                  <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <ArrowRight className="mr-2 h-4 w-4" /> Sonraki
                  </Button>
                )}
              </div>
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
              <RotateCcw className="mr-2 h-4 w-4" /> Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={initPool}>
          <RotateCcw className="mr-2 h-4 w-4" /> Yeni Sorular
        </Button>
      </div>
    </div>
  );
}
