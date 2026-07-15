'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ArrowRight, RotateCcw, Target, Lightbulb, Check, Mic } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { categories } from '@/lib/german-data';
import { vocabulary, type VocabWord } from '@/lib/vocabulary-data';
import { useAppStore } from '@/lib/store';
import { getCategoryColor } from '@/lib/constants';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { SpeakButton } from '@/components/shared/SpeakButton';
import { PronunciationCheck } from '@/components/shared/PronunciationCheck';

export function VocabModule() {
  const { selectedCategories, incrementPracticed, saveExerciseResult } = useAppStore();
  const [mode, setMode] = useState<'browse' | 'quiz' | 'reverse-quiz'>('browse');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showTranslation, setShowTranslation] = useState(false);
  const [quizPool, setQuizPool] = useState<VocabWord[]>([]);
  const [showPronunciation, setShowPronunciation] = useState(false);

  const filteredVocab = useMemo(() => {
    return vocabulary.filter((v) => {
      if (!v.turkish) return false;
      if (selectedCategories.length > 0) {
        return selectedCategories.includes(v.category);
      }
      return true;
    });
  }, [selectedCategories]);

  const initQuiz = useCallback((quizMode: 'quiz' | 'reverse-quiz') => {
    const pool = [...filteredVocab].filter((v) => v.turkish).sort(() => Math.random() - 0.5).slice(0, 15);
    setQuizPool(pool);
    setCurrentIndex(0);
    setUserInput('');
    setResult(null);
    setScore({ correct: 0, total: 0 });
    setShowTranslation(false);
    setMode(quizMode);
  }, [filteredVocab]);

  const currentWord = mode === 'browse' ? filteredVocab[currentIndex] : quizPool[currentIndex];
  const totalWords = mode === 'browse' ? filteredVocab.length : quizPool.length;

  const handleSubmit = useCallback(() => {
    if (!currentWord || !currentWord.turkish) return;
    const correctAnswer = mode === 'quiz' ? currentWord.turkish : currentWord.german;
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
      setShowTranslation(false);
    } else {
      saveExerciseResult('vocab', score.correct, score.total, selectedCategories);
      setMode('browse');
      setCurrentIndex(0);
    }
  }, [currentIndex, totalWords, score, saveExerciseResult, selectedCategories]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && result === null && mode !== 'browse') handleSubmit();
    },
    [result, mode, handleSubmit]
  );

  if (filteredVocab.length === 0) {
    return (
      <div className="space-y-6">
        <CategoryFilter />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">Bu kategoride kelime bulunamadı</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CategoryFilter />

      <div className="grid grid-cols-3 gap-2">
        {[
          { key: 'browse' as const, label: 'Gözat', icon: BookOpen, desc: 'Kelime listesi' },
          { key: 'quiz' as const, label: 'DE→TR', icon: ArrowRight, desc: 'Almanca yaz' },
          { key: 'reverse-quiz' as const, label: 'TR→DE', icon: RotateCcw, desc: 'Türkçe yaz' },
        ].map((m) => (
          <Button
            key={m.key}
            variant={mode === m.key ? 'default' : 'outline'}
            className={`h-auto flex-col gap-1 py-3 ${mode === m.key ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            onClick={() => {
              if (m.key === 'browse') {
                setMode('browse');
                setCurrentIndex(0);
                setShowTranslation(false);
              } else {
                initQuiz(m.key);
              }
            }}
          >
            <m.icon className="h-4 w-4" />
            <span className="text-xs font-medium">{m.label}</span>
            <span className="text-[10px] opacity-70">{m.desc}</span>
          </Button>
        ))}
      </div>

      {(mode === 'quiz' || mode === 'reverse-quiz') && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            <span className="font-medium">{score.correct} / {score.total}</span>
          </div>
          <Badge variant="outline">{currentIndex + 1} / {totalWords}</Badge>
        </div>
      )}

      {mode === 'browse' && currentWord && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{currentIndex + 1} / {filteredVocab.length} kelime</span>
            <Badge variant="secondary" className="text-xs">Sıklık: {currentWord.frequency}x</Badge>
          </div>
          <Progress value={((currentIndex + 1) / filteredVocab.length) * 100} className="h-2" />

          <motion.div key={currentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold text-center">{currentWord.german}</p>
                  <SpeakButton text={currentWord.german} size="md" color="slate" label="Dinle" className="text-white hover:bg-white/20" />
                </div>
                <p className="text-center text-emerald-100 text-sm mt-1">
                  {categories.find((c) => c.id === currentWord.category)?.nameTr || currentWord.category}
                </p>
              </div>
              <CardContent className="p-6">
                {showTranslation ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
                    <p className="text-xl font-semibold text-amber-700">{currentWord.turkish}</p>
                    {currentWord.frequency > 1 && (
                      <p className="text-xs text-muted-foreground">
                        Bu kelime {currentWord.frequency} farklı cümlede geçiyor
                      </p>
                    )}
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
                      >
                        <PronunciationCheck
                          target={currentWord.german}
                          subtitle="Kelimeyi Almanca olarak seslendirin"
                          color="emerald"
                          variant="compact"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setShowTranslation(true)}
                    className="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-center text-muted-foreground hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                  >
                    <Lightbulb className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-sm">Çeviriyi görmek için tıklayın</span>
                  </button>
                )}
                <div className="flex justify-between mt-4">
                  <Button variant="outline" size="sm" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
                    ← Önceki
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentIndex(Math.min(filteredVocab.length - 1, currentIndex + 1))} disabled={currentIndex === filteredVocab.length - 1}>
                    Sonraki →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kelime Listesi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 overflow-y-auto">
                <div className="space-y-1">
                  {filteredVocab.slice(0, 50).map((v, idx) => {
                    const clr = getCategoryColor(v.category);
                    return (
                      <button
                        key={v.id}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                          idx === currentIndex ? 'bg-emerald-50 ring-1 ring-emerald-300' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => { setCurrentIndex(idx); setShowTranslation(false); }}
                      >
                        <div className={`h-2 w-2 rounded-full shrink-0 ${clr.bg}`} />
                        <span className="font-medium truncate">{v.german}</span>
                        <span className="text-muted-foreground truncate text-xs">{v.turkish}</span>
                      </button>
                    );
                  })}
                  {filteredVocab.length > 50 && (
                    <p className="text-center text-xs text-muted-foreground py-2">
                      ve {filteredVocab.length - 50} kelime daha...
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(mode === 'quiz' || mode === 'reverse-quiz') && currentWord && (
        <motion.div key={`${mode}-${currentIndex}`} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  {mode === 'quiz' ? '🇩🇪 Almanca' : '🇹🇷 Türkçe'}: <strong>{mode === 'quiz' ? currentWord.german : currentWord.turkish}</strong>
                </p>
                {mode === 'quiz' && (
                  <SpeakButton text={currentWord.german} size="sm" color="amber" label="Dinle" />
                )}
              </div>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                {mode === 'quiz' ? 'Türkçe çevirisini yazın' : 'Almanca çevirisini yazın'}
              </p>
              <div className="flex gap-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={mode === 'quiz' ? 'Türkçe çeviri...' : 'Almanca çeviri...'}
                  disabled={result !== null}
                  className={`text-center text-lg ${
                    result === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : result === 'wrong' ? 'border-red-500 bg-red-50 text-red-700' : ''
                  }`}
                  dir="auto"
                />
                <Button onClick={handleSubmit} disabled={result !== null || userInput.trim() === ''} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="h-4 w-4" />
                </Button>
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
                        <span>❌ Yanlış! Doğru cevap: <strong>{mode === 'quiz' ? currentWord.turkish : currentWord.german}</strong></span>
                      )}
                    </div>
                    <Button onClick={handleProceed} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      {currentIndex < totalWords - 1 ? 'İlerle' : 'Bitir'}
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
