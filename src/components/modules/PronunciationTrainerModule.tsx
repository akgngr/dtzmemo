'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Volume2, RotateCcw, Target, Star,
  CheckCircle2, XCircle, ArrowRight, Lightbulb, Trophy, Shuffle, Eye, EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { categories, wordPairs, type WordPair } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { getCategoryColor } from '@/lib/constants';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { SpeakButton } from '@/components/shared/SpeakButton';
import { PronunciationCheck } from '@/components/shared/PronunciationCheck';
import { cn } from '@/lib/utils';

type Screen = 'topics' | 'practice' | 'summary';
type PracticeMode = 'random' | 'flashcards' | 'weakness';

interface SessionResult {
  wordId: string;
  german: string;
  turkish: string;
  score: number;
  isCorrect: boolean;
}

const MODE_CONFIG: Record<PracticeMode, { label: string; desc: string; badge: string; badgeColor: string; icon: React.ElementType; color: string }> = {
  random: { label: 'Rastgele Cümleler', desc: 'Rastgele Almanca cümleleri sesli okuyup puanla', badge: 'Kolay → Zor', badgeColor: 'bg-amber-100 text-amber-700', icon: Shuffle, color: 'from-orange-500 to-amber-500' },
  flashcards: { label: 'Sesli Kartlar', desc: 'Kart formatında telaffuz et, çeviriyi sonra gör', badge: 'Görsel Öğrenme', badgeColor: 'bg-purple-100 text-purple-700', icon: Eye, color: 'from-purple-500 to-indigo-500' },
  weakness: { label: 'Zorluk Pratik', desc: 'Daha önce düşük puan alan kelimelerle çalış', badge: 'Zayıf Noktalar', badgeColor: 'bg-red-100 text-red-700', icon: Target, color: 'from-red-500 to-rose-500' },
};

function generatePool(mode: PracticeMode, selectedCategories: string[], cardProgress: Record<string, { correct: number; wrong: number }>): WordPair[] {
  let pool = [...wordPairs];
  if (selectedCategories.length > 0) {
    pool = pool.filter((w) => selectedCategories.includes(w.category));
  }
  if (mode === 'weakness') {
    pool = pool.filter((w) => {
      const p = cardProgress[w.id];
      return !p || p.wrong > p.correct || (p.correct + p.wrong < 3 && p.correct < 2);
    });
    if (pool.length < 5) pool = [...wordPairs].filter((w) => selectedCategories.length === 0 || selectedCategories.includes(w.category));
  }
  return pool.sort(() => Math.random() - 0.5).slice(0, 20);
}

export function PronunciationTrainerModule() {
  const { selectedCategories, incrementPracticed, saveExerciseResult, cardProgress } = useAppStore();
  const [screen, setScreen] = useState<Screen>('topics');
  const [mode, setMode] = useState<PracticeMode>('random');
  const [pool, setPool] = useState<WordPair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showMiniSummary, setShowMiniSummary] = useState(false);

  const startPractice = useCallback((practiceMode: PracticeMode) => {
    const newPool = generatePool(practiceMode, selectedCategories, cardProgress);
    if (newPool.length === 0) return;
    setMode(practiceMode);
    setPool(newPool);
    setCurrentIndex(0);
    setSessionResults([]);
    setShowTranslation(false);
    setShowMiniSummary(false);
    setScreen('practice');
  }, [selectedCategories, cardProgress]);

  const currentWord = pool[currentIndex];
  const totalCorrect = sessionResults.filter((r) => r.isCorrect).length;
  const totalAttempted = sessionResults.length;
  const avgScore = totalAttempted > 0 ? Math.round(sessionResults.reduce((s, r) => s + r.score, 0) / totalAttempted) : 0;

  const handleResult = useCallback((score: number, isCorrect: boolean) => {
    if (!currentWord) return;
    incrementPracticed(isCorrect);
    const result: SessionResult = { wordId: currentWord.id, german: currentWord.german, turkish: currentWord.turkish, score, isCorrect };
    setSessionResults((prev) => [...prev, result]);
    if (mode === 'flashcards') setShowTranslation(true);
  }, [currentWord, incrementPracticed, mode]);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= pool.length) {
      saveExerciseResult('pronunciation', totalCorrect, totalAttempted, selectedCategories);
      setScreen('summary');
    } else {
      if ((nextIndex + 1) % 10 === 0 && nextIndex > 0) {
        setShowMiniSummary(true);
      } else {
        setCurrentIndex(nextIndex);
        setShowTranslation(false);
      }
    }
  }, [currentIndex, pool.length, totalCorrect, totalAttempted, saveExerciseResult, selectedCategories]);

  const weakWords = useMemo(() => sessionResults.filter((r) => r.score < 70), [sessionResults]);

  // ── Topics Screen ──
  if (screen === 'topics') {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-6 text-white shadow-lg md:p-8">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-amber-200"><Mic className="h-5 w-5" /><span className="text-sm font-medium">Sesli Telaffuz</span></div>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">Almanca Telaffuz Pratiği!</h2>
            <p className="mt-2 text-amber-100 max-w-2xl">Mikrofona bas, Almanca cümleyi oku — yapay zeka telaffuzunu puanlar, zayıf noktalarını tespit eder.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white border-0 backdrop-blur">🎤 Mikrofonla oku</Badge>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur">📊 Anlık puanlama</Badge>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur">🔄 Zayıf nokta tespiti</Badge>
            </div>
          </div>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.entries(MODE_CONFIG) as [PracticeMode, typeof MODE_CONFIG[PracticeMode]][]).map(([key, cfg], idx) => (
            <motion.button key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} onClick={() => startPractice(key)} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5">
              <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl text-white shadow-sm bg-gradient-to-br', cfg.color)}>
                <cfg.icon className="h-6 w-6" />
              </div>
              <div className="mt-3"><h4 className="font-semibold text-gray-900">{cfg.label}</h4><p className="text-xs text-muted-foreground mt-1">{cfg.desc}</p></div>
              <Badge className={cn('mt-3 text-[10px]', cfg.badgeColor)}>{cfg.badge}</Badge>
            </motion.button>
          ))}
        </div>
        <Card className="border-0 shadow-sm bg-amber-50"><CardContent className="p-4"><div className="flex items-start gap-2"><Lightbulb className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" /><div className="text-sm text-amber-900"><p className="font-semibold mb-1">İpuçları</p><ul className="space-y-1 text-xs list-disc list-inside opacity-90"><li>Sessiz bir ortamda konuşman tanıma kalitesini artırır</li><li>Önce "Dinle" butonuyla doğru telaffuzu dinleyin</li><li>70% ve üzeri puan "geçti" sayılır</li><li>Zayıf noktalar otomatik tespit edilir ve tekrar çalışmanız önerilir</li><li>Chrome veya Edge tarayıcısı gerekli</li></ul></div></div></CardContent></Card>
      </div>
    );
  }

  // ── Practice Screen ──
  if (screen === 'practice' && currentWord) {
    const catColor = getCategoryColor(currentWord.category);
    const catName = categories.find((c) => c.id === currentWord.category)?.nameTr || currentWord.category;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Target className="h-5 w-5 text-amber-600" /><span className="font-medium text-sm">{MODE_CONFIG[mode].label}</span></div><div className="flex items-center gap-2"><Badge variant="outline">{currentIndex + 1} / {pool.length}</Badge><Badge variant="outline" className={totalCorrect > 0 ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : ''}>{totalCorrect} doğru</Badge></div></div>
        <Progress value={((currentIndex + 1) / pool.length) * 100} className="h-2 [&>div]:bg-amber-500" />
        <AnimatePresence mode="wait"><motion.div key={currentWord.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white"><div className="flex items-center justify-between"><p className="text-lg font-bold" dir="auto">{currentWord.german}</p><SpeakButton text={currentWord.german} size="md" color="amber" label="Dinle" className="text-white hover:bg-white/20" /></div><p className="text-amber-100 text-xs mt-1">{catName}</p></div>
            <CardContent className="p-5 space-y-4">
              {mode === 'flashcards' && !showTranslation ? (
                <div className="rounded-lg border-2 border-dashed border-amber-200 p-4 text-center text-amber-600"><EyeOff className="h-5 w-5 mx-auto mb-1" /><p className="text-sm">Önce telaffuzunu kontrol et, sonra çeviri gösterilecek</p></div>
              ) : (mode === 'flashcards' && showTranslation) || mode !== 'flashcards' ? (
                <div className="rounded-lg bg-amber-50 p-3"><p className="text-sm text-amber-800">{mode === 'flashcards' ? 'Çeviri:' : 'Türkçe:'}</p><p className="text-base font-medium text-amber-900 mt-0.5">{currentWord.turkish}</p></div>
              ) : null}
              <PronunciationCheck target={currentWord.german} subtitle="Almanca olarak seslendirin" variant="full" color="amber" passingScore={70} onResult={handleResult} />
              {sessionResults.length > 0 && sessionResults[sessionResults.length - 1].wordId === currentWord.id && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setShowTranslation(false); }} disabled={currentIndex === 0}><RotateCcw className="mr-1 h-3 w-3" />Tekrar Dene</Button></div>
                  <Button onClick={handleNext} className="bg-amber-600 hover:bg-amber-700 text-white"><ArrowRight className="mr-1 h-4 w-4" />{currentIndex < pool.length - 1 ? 'Sonraki' : 'Bitir'}</Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div></AnimatePresence>
        <AnimatePresence>{showMiniSummary && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setShowMiniSummary(false); setCurrentIndex(currentIndex + 1); setShowTranslation(false); }}><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"><h3 className="text-lg font-bold text-center mb-4">Ara Rapor</h3><div className="grid grid-cols-2 gap-3 mb-4"><div className="rounded-lg bg-emerald-50 p-3 text-center"><p className="text-2xl font-bold text-emerald-700">{totalCorrect}</p><p className="text-xs text-emerald-600">Doğru</p></div><div className="rounded-lg bg-amber-50 p-3 text-center"><p className="text-2xl font-bold text-amber-700">{avgScore}%</p><p className="text-xs text-amber-600">Ortalama Puan</p></div></div><Button onClick={() => { setShowMiniSummary(false); setCurrentIndex(currentIndex + 1); setShowTranslation(false); }} className="w-full bg-amber-600 hover:bg-amber-700 text-white">Devam Et</Button></motion.div></motion.div>)}</AnimatePresence>
      </div>
    );
  }

  // ── Summary Screen ──
  if (screen === 'summary') {
    const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
        <Card className="border-0 shadow-sm overflow-hidden"><div className="bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 p-6 text-center text-white"><Trophy className="mx-auto mb-3 h-12 w-12" /><h2 className="text-2xl font-bold">Telaffuz Pratiği Tamamlandı!</h2><p className="mt-1 text-amber-100 text-sm">{MODE_CONFIG[mode].label} modu</p></div><CardContent className="p-6 space-y-4">
          <div className="text-center"><p className={cn('text-5xl font-bold', accuracy >= 80 ? 'text-emerald-600' : accuracy >= 50 ? 'text-amber-600' : 'text-red-600')}>{accuracy}%</p><p className={cn('text-sm font-semibold', accuracy >= 80 ? 'text-emerald-600' : accuracy >= 50 ? 'text-amber-600' : 'text-red-600')}>{accuracy >= 80 ? 'Harika telaffuz!' : accuracy >= 50 ? 'İyi gidiyorsun!' : 'Çalışmaya devam et!'}</p></div>
          <Progress value={accuracy} className={cn('h-2', accuracy >= 80 ? '[&>div]:bg-emerald-500' : accuracy >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500')} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-emerald-50 p-3 text-center"><CheckCircle2 className="h-5 w-5 mx-auto text-emerald-600 mb-1" /><div className="text-xl font-bold text-emerald-700">{totalCorrect}</div><div className="text-xs text-emerald-600">Doğru</div></div>
            <div className="rounded-lg bg-red-50 p-3 text-center"><XCircle className="h-5 w-5 mx-auto text-red-600 mb-1" /><div className="text-xl font-bold text-red-700">{totalAttempted - totalCorrect}</div><div className="text-xs text-red-600">Yanlış</div></div>
            <div className="rounded-lg bg-amber-50 p-3 text-center"><Star className="h-5 w-5 mx-auto text-amber-600 mb-1" /><div className="text-xl font-bold text-amber-700">{avgScore}%</div><div className="text-xs text-amber-600">Ort. Puan</div></div>
          </div>
          {weakWords.length > 0 && (<><Separator /><div><h4 className="text-sm font-semibold text-red-700 mb-2">Tekrar Çalışman Gerekenler ({weakWords.length})</h4><div className="max-h-48 overflow-y-auto space-y-1">{weakWords.map((w) => (<div key={w.wordId} className="flex items-center justify-between rounded-md bg-red-50 px-3 py-2"><div className="min-w-0"><p className="text-sm font-medium text-gray-900 truncate" dir="auto">{w.german}</p><p className="text-xs text-muted-foreground truncate">{w.turkish}</p></div><Badge variant="outline" className={cn('shrink-0', w.score < 40 ? 'border-red-200 text-red-700 bg-red-50' : 'border-amber-200 text-amber-700 bg-amber-50')}>{w.score}%</Badge></div>))}</div></div></>)}
          <div className="flex flex-col sm:flex-row gap-2"><Button onClick={() => startPractice(mode)} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"><RotateCcw className="mr-2 h-4 w-4" />Tekrar Dene</Button><Button onClick={() => setScreen('topics')} variant="outline" className="flex-1">Ana Menüye Dön</Button></div>
        </CardContent></Card>
      </motion.div>
    );
  }
  return null;
}
