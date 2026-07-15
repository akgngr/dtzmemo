'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Trophy, RotateCcw, Clock, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { wordPairs, type WordPair } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { SpeakButton } from '@/components/shared/SpeakButton';

export function CompetitionModule() {
  const { incrementPracticed, saveExerciseResult } = useAppStore();
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [pool, setPool] = useState<WordPair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [questionType, setQuestionType] = useState<'fill-blank' | 'word-completion'>('fill-blank');

  const startGame = useCallback(() => {
    const shuffled = [...wordPairs].sort(() => Math.random() - 0.5).slice(0, 20);
    setPool(shuffled);
    setCurrentIndex(0);
    setUserInput('');
    setResult(null);
    setScore({ correct: 0, total: 0 });
    setTimer(0);
    setGameState('playing');
    setQuestionType(Math.random() > 0.5 ? 'fill-blank' : 'word-completion');
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => { setTimer((prev) => prev + 1); }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState]);

  const currentWord = pool[currentIndex];

  const blankData = useMemo(() => {
    if (!currentWord || questionType !== 'fill-blank') return { display: '', answer: '', hint: '' };
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
  }, [currentWord, questionType]);

  const maskedSentence = useMemo(() => {
    if (!currentWord || questionType !== 'word-completion') return '';
    const words = currentWord.german.split(' ');
    return words.map((word) => {
      if (word.length <= 2) return word;
      const chars = word.split('');
      const maskCount = Math.max(1, Math.floor(chars.length * 0.4));
      const indices = chars.map((_, i) => i).filter((i) => /[a-zA-ZäöüÄÖÜß]/.test(chars[i]));
      const toMask = indices.sort(() => Math.random() - 0.5).slice(0, maskCount);
      return chars.map((c, i) => (toMask.includes(i) ? '_' : c)).join('');
    }).join(' ');
  }, [currentWord, questionType]);

  const handleSubmit = useCallback(() => {
    if (!currentWord) return;
    let isCorrect = false;
    if (questionType === 'fill-blank') {
      isCorrect = userInput.trim().toLowerCase() === blankData.answer.toLowerCase();
    } else {
      isCorrect = userInput.trim().toLowerCase() === currentWord.german.toLowerCase().replace(/[.,!?;:]/g, '').trim() ||
                  userInput.trim().toLowerCase() === currentWord.german.toLowerCase().trim();
    }
    setResult(isCorrect ? 'correct' : 'wrong');
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    incrementPracticed(isCorrect);
  }, [currentWord, userInput, questionType, blankData, incrementPracticed]);

  const handleProceed = useCallback(() => {
    if (currentIndex < pool.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setUserInput('');
      setResult(null);
      setQuestionType(Math.random() > 0.5 ? 'fill-blank' : 'word-completion');
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      saveExerciseResult('competition', score.correct, score.total, []);
      setGameState('finished');
    }
  }, [currentIndex, pool.length, score, saveExerciseResult]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && result === null) handleSubmit();
    },
    [result, handleSubmit]
  );

  const handleEndGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    saveExerciseResult('competition', score.correct, score.total, []);
    setGameState('finished');
  }, [score, saveExerciseResult]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (gameState === 'ready') {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 p-6 text-white shadow-lg md:p-8"
        >
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-violet-200">
              <Timer className="h-5 w-5" />
              <span className="text-sm font-medium">Zamanlı Yarışma</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">Zamana Karşı!</h2>
            <p className="mt-2 text-violet-100">
              Tüm kategorilerden 20 soru. Ne kadar hızlı çözebilirsin?
            </p>
          </div>
        </motion.div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-violet-50 p-3">
                <div className="text-2xl font-bold text-violet-700">20</div>
                <div className="text-xs text-violet-600">Soru</div>
              </div>
              <div className="rounded-lg bg-amber-50 p-3">
                <div className="text-2xl font-bold text-amber-700"><Clock className="h-6 w-6 mx-auto" /></div>
                <div className="text-xs text-amber-600">Süre sayacı</div>
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Nasıl oynanır?</p>
              <ul className="space-y-1 text-xs">
                <li>• Tüm kategorilerden rastgele 20 soru gelir</li>
                <li>• Boşluk doldurma ve kelime tamamlama türleri karışık olur</li>
                <li>• Cevabınızı yazıp kontrol ettikten sonra &quot;İlerle&quot; butonuyla geçin</li>
                <li>• En kısa sürede en yüksek puanı almaya çalışın</li>
              </ul>
            </div>
            <Button onClick={startGame} className="w-full bg-violet-600 hover:bg-violet-700 text-white text-lg py-6">
              <Timer className="mr-2 h-5 w-5" />
              Yarışmayı Başlat
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === 'finished') {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    const avgTime = score.total > 0 ? Math.round(timer / score.total) : 0;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className={`p-6 text-center text-white ${
            pct >= 80 ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
            pct >= 50 ? 'bg-gradient-to-br from-amber-500 to-amber-700' :
            'bg-gradient-to-br from-red-500 to-red-700'
          }`}>
            <Trophy className="mx-auto mb-3 h-12 w-12" />
            <h2 className="text-2xl font-bold">Yarışma Tamamlandı!</h2>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-2xl font-bold text-emerald-600">{score.correct}</div>
                <div className="text-xs text-muted-foreground">Doğru</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-2xl font-bold text-red-600">{score.total - score.correct}</div>
                <div className="text-xs text-muted-foreground">Yanlış</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-2xl font-bold text-violet-600">{formatTime(timer)}</div>
                <div className="text-xs text-muted-foreground">Süre</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Doğruluk</span>
                <span className="font-bold">{pct}%</span>
              </div>
              <Progress value={pct} className="h-3" />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Ortalama soru başına süre: {avgTime} sn
            </div>
            <Button onClick={startGame} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
              <RotateCcw className="mr-2 h-4 w-4" /> Tekrar Oyna
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!currentWord) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={`${timer > 300 ? 'bg-red-500' : timer > 180 ? 'bg-amber-500' : 'bg-violet-500'} text-white border-0`}>
            <Clock className="mr-1 h-3 w-3" />
            {formatTime(timer)}
          </Badge>
          <Badge variant="outline">
            {questionType === 'fill-blank' ? 'Boşluk Doldurma' : 'Kelime Tamamlama'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{score.correct}/{score.total}</span>
          <Badge variant="secondary">{currentIndex + 1}/{pool.length}</Badge>
        </div>
      </div>

      <Progress value={((currentIndex + 1) / pool.length) * 100} className="h-2" />

      <div className="flex justify-center mt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEndGame}
          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          Yarışmayı Bitir
        </Button>
      </div>

      <motion.div key={currentIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                💡 Türkçe: <strong>{currentWord.turkish}</strong>
              </p>
              <SpeakButton text={currentWord.german} size="sm" color="amber" label="Dinle" />
            </div>
            {questionType === 'fill-blank' ? (
              <p className="mb-6 text-center text-lg font-medium leading-relaxed md:text-xl">
                {blankData.display}
              </p>
            ) : (
              <p className="mb-6 text-center text-lg font-mono font-medium tracking-wide leading-relaxed md:text-xl">
                {maskedSentence}
              </p>
            )}
            <div className="flex gap-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={questionType === 'fill-blank' ? 'Eksik kelimeyi yazın...' : 'Tam cümleyi yazın...'}
                disabled={result !== null}
                className={`text-center ${
                  result === 'correct' ? 'border-emerald-500 bg-emerald-50' : result === 'wrong' ? 'border-red-500 bg-red-50' : ''
                }`}
                dir="auto"
              />
              <Button onClick={handleSubmit} disabled={result !== null || userInput.trim() === ''} className="bg-violet-600 hover:bg-violet-700 text-white">
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
                      <span>❌ Yanlış! Doğru cevap: <strong>{questionType === 'fill-blank' ? blankData.answer : currentWord.german}</strong></span>
                    )}
                  </div>
                  <Button onClick={handleProceed} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    {currentIndex < pool.length - 1 ? 'İlerle' : 'Sonuçları Gör'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
