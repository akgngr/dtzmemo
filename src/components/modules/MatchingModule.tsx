'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, RotateCcw, Target, Trophy, Clock, ArrowRight, Flag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { wordPairs, type WordPair } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { SpeakButton } from '@/components/shared/SpeakButton';

export function MatchingModule() {
  const { selectedCategories, incrementPracticed, saveExerciseResult } = useAppStore();
  const [pairs, setPairs] = useState<WordPair[]>([]);
  const [selectedGerman, setSelectedGerman] = useState<string | null>(null);
  const [selectedTurkish, setSelectedTurkish] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<string | null>(null);
  const [roundScore, setRoundScore] = useState({ correct: 0, total: 0 });
  const [totalScore, setTotalScore] = useState({ correct: 0, total: 0 });
  const [round, setRound] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getFilteredWords = useCallback(() => {
    return selectedCategories.length > 0
      ? wordPairs.filter((w) => selectedCategories.includes(w.category))
      : wordPairs;
  }, [selectedCategories]);

  const initPairs = useCallback(() => {
    const words = getFilteredWords();
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 5);
    setPairs(shuffled);
    setMatched(new Set());
    setSelectedGerman(null);
    setSelectedTurkish(null);
    setWrongPair(null);
    setRoundScore({ correct: 0, total: 0 });
    setIsActive(true);
  }, [getFilteredWords]);

  const startFresh = useCallback(() => {
    setRound(1);
    setTotalScore({ correct: 0, total: 0 });
    setTimer(0);
    setIsFinished(false);
    const words = getFilteredWords();
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 5);
    setPairs(shuffled);
    setMatched(new Set());
    setSelectedGerman(null);
    setSelectedTurkish(null);
    setWrongPair(null);
    setRoundScore({ correct: 0, total: 0 });
    setIsActive(true);
  }, [getFilteredWords]);

  useEffect(() => { startFresh(); }, [selectedCategories]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => { setTimer((prev) => prev + 1); }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  const handleNextRound = useCallback(() => {
    setRound((prev) => prev + 1);
    initPairs();
  }, [initPairs]);

  const handleFinish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setIsFinished(true);
    saveExerciseResult('matching', totalScore.correct, totalScore.total, selectedCategories);
  }, [totalScore, saveExerciseResult, selectedCategories]);

  const shuffledTurkish = useMemo(() => [...pairs].sort(() => Math.random() - 0.5), [pairs]);

  const handleMatch = useCallback(
    (germanId: string, turkishId: string) => {
      const germanPair = pairs.find((p) => p.id === germanId);
      const turkishPair = pairs.find((p) => p.id === turkishId);
      if (germanPair && turkishPair && germanPair.id === turkishPair.id) {
        const newMatched = new Set([...matched, germanId, turkishId]);
        setMatched(newMatched);
        const newRoundScore = { correct: roundScore.correct + 1, total: roundScore.total + 1 };
        setRoundScore(newRoundScore);
        const newTotalScore = { correct: totalScore.correct + 1, total: totalScore.total + 1 };
        setTotalScore(newTotalScore);
        incrementPracticed(true);
        setSelectedGerman(null);
        setSelectedTurkish(null);
        if (newMatched.size >= pairs.length * 2) {
          setIsActive(false);
        }
      } else {
        setWrongPair(germanId);
        setRoundScore((prev) => ({ ...prev, total: prev.total + 1 }));
        setTotalScore((prev) => ({ ...prev, total: prev.total + 1 }));
        incrementPracticed(false);
        setTimeout(() => { setSelectedGerman(null); setSelectedTurkish(null); setWrongPair(null); }, 800);
      }
    },
    [matched, pairs, roundScore, totalScore, incrementPracticed]
  );

  const handleSelectGerman = useCallback(
    (id: string) => {
      if (matched.has(id)) return;
      setSelectedGerman(id);
      setWrongPair(null);
      if (selectedTurkish) {
        handleMatch(id, selectedTurkish);
      }
    },
    [matched, selectedTurkish, handleMatch]
  );

  const handleSelectTurkish = useCallback(
    (id: string) => {
      if (matched.has(id)) return;
      setSelectedTurkish(id);
      setWrongPair(null);
      if (selectedGerman) {
        handleMatch(selectedGerman, id);
      }
    },
    [matched, selectedGerman, handleMatch]
  );

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const allMatched = matched.size >= pairs.length * 2 && pairs.length > 0;

  // Final results screen
  if (isFinished) {
    const pct = totalScore.total > 0 ? Math.round((totalScore.correct / totalScore.total) * 100) : 0;
    return (
      <div className="space-y-6">
        <CategoryFilter />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className={`p-6 text-center text-white ${
              pct >= 80 ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
              pct >= 50 ? 'bg-gradient-to-br from-amber-500 to-amber-700' :
              'bg-gradient-to-br from-red-500 to-red-700'
            }`}>
              <Trophy className="mx-auto mb-3 h-12 w-12" />
              <h2 className="text-2xl font-bold">Eşleştirme Tamamlandı!</h2>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-2xl font-bold text-emerald-600">{totalScore.correct}</div>
                  <div className="text-xs text-muted-foreground">Doğru</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-2xl font-bold text-red-600">{totalScore.total - totalScore.correct}</div>
                  <div className="text-xs text-muted-foreground">Yanlış</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-2xl font-bold text-violet-600">{round - 1}</div>
                  <div className="text-xs text-muted-foreground">Tur</div>
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
                Toplam süre: {formatTime(timer)}
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={startFresh}>
                <RotateCcw className="mr-2 h-4 w-4" /> Tekrar Oyna
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CategoryFilter />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            <span className="font-medium">{roundScore.correct} / {pairs.length}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatTime(timer)}
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          Tur {round} | Toplam: {totalScore.correct}/{totalScore.total}
        </Badge>
      </div>

      {allMatched ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-amber-500" />
              <h3 className="text-xl font-bold">Tebrikler! Tüm eşleştirmeleri buldunuz!</h3>
              <p className="mt-2 text-muted-foreground">
                Bu tur: {roundScore.correct} / {roundScore.total} | Süre: {formatTime(timer)}
              </p>
              <div className="mt-6 space-y-3">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleNextRound}>
                  <ArrowRight className="mr-2 h-4 w-4" /> İlerle
                </Button>
                <Button variant="outline" className="w-full" onClick={handleFinish}>
                  <Flag className="mr-2 h-4 w-4" /> Sonuçları Gör
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Almanca ve Türkçe kelimeleri eşleştirin
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="mb-2 text-center text-sm font-semibold text-emerald-700">🇩🇪 Almanca</h4>
                {pairs.map((p) => {
                  const isMatched = matched.has(p.id);
                  const isSelected = selectedGerman === p.id;
                  const isWrong = wrongPair === p.id;
                  return (
                    <motion.button
                      key={p.id + '-de'}
                      whileHover={!isMatched ? { scale: 1.02 } : {}}
                      whileTap={!isMatched ? { scale: 0.98 } : {}}
                      onClick={() => handleSelectGerman(p.id)}
                      disabled={isMatched}
                      className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                        isMatched ? 'border-emerald-300 bg-emerald-50 text-emerald-700 opacity-60'
                        : isSelected ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300'
                        : isWrong ? 'border-red-400 bg-red-50 animate-pulse'
                        : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="line-clamp-2">{p.german}</span>
                        {isMatched && (
                          <span
                            onClick={(e) => { e.stopPropagation(); }}
                            className="shrink-0"
                            aria-label="Dinle"
                          >
                            <SpeakButton text={p.german} size="sm" color="emerald" label="Dinle" showAiBadge={false} />
                          </span>
                        )}
                      </div>
                      {isMatched && <Check className="mt-1 h-4 w-4 text-emerald-600" />}
                    </motion.button>
                  );
                })}
              </div>
              <div className="space-y-2">
                <h4 className="mb-2 text-center text-sm font-semibold text-amber-700">🇹🇷 Türkçe</h4>
                {shuffledTurkish.map((p) => {
                  const isMatched = matched.has(p.id);
                  const isSelected = selectedTurkish === p.id;
                  const isWrong = wrongPair === p.id;
                  return (
                    <motion.button
                      key={p.id + '-tr'}
                      whileHover={!isMatched ? { scale: 1.02 } : {}}
                      whileTap={!isMatched ? { scale: 0.98 } : {}}
                      onClick={() => handleSelectTurkish(p.id)}
                      disabled={isMatched}
                      className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                        isMatched ? 'border-amber-300 bg-amber-50 text-amber-700 opacity-60'
                        : isSelected ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-300'
                        : isWrong ? 'border-red-400 bg-red-50 animate-pulse'
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      <span className="line-clamp-2">{p.turkish}</span>
                      {isMatched && <Check className="mt-1 h-4 w-4 text-amber-600" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-2">
        <Button variant="ghost" size="sm" onClick={startFresh}>
          <RotateCcw className="mr-2 h-4 w-4" /> Yeniden Başla
        </Button>
        {!allMatched && (
          <Button variant="ghost" size="sm" onClick={handleFinish} className="text-red-500 hover:text-red-700 hover:bg-red-50">
            <Flag className="mr-2 h-4 w-4" /> Bitir
          </Button>
        )}
      </div>
    </div>
  );
}
