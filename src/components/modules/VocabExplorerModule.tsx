'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, Volume2, ArrowUpDown, Filter, Sparkles, ChevronDown,
  Star, Eye, X, Hash, GraduationCap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { categories, wordPairs, type WordPair } from '@/lib/german-data';
import { vocabulary, type VocabWord } from '@/lib/vocabulary-data';
import { useAppStore } from '@/lib/store';
import { getCategoryColor } from '@/lib/constants';
import { CategoryFilter } from '@/components/shared/CategoryFilter';
import { SpeakButton } from '@/components/shared/SpeakButton';
import { cn } from '@/lib/utils';

type SortBy = 'alpha-de' | 'alpha-tr' | 'frequency' | 'category' | 'length';

type ViewMode = 'list' | 'detail';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'alpha-de', label: 'Almanca A→Z' },
  { value: 'alpha-tr', label: 'Türkçe A→Z' },
  { value: 'frequency', label: 'Sıklık (çok→az)' },
  { value: 'category', label: 'Kategoriye göre' },
  { value: 'length', label: 'Uzunluk (kısa→uzun)' },
];

// Seeded random for "daily word" — changes once per day
function getDailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

export function VocabExplorerModule() {
  const { selectedCategories, cardProgress } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('alpha-de');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null);
  const [showOnlyUnpracticed, setShowOnlyUnpracticed] = useState(false);

  // Daily word
  const dailyWord = useMemo(() => {
    const rng = seededRandom(getDailySeed());
    const idx = Math.floor(rng() * vocabulary.length);
    return vocabulary[idx];
  }, []);

  // Filter + sort
  const filteredWords = useMemo(() => {
    let list = [...vocabulary];

    // Category filter
    if (selectedCategories.length > 0) {
      list = list.filter((v) => selectedCategories.includes(v.category));
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((v) =>
        v.german.toLowerCase().includes(q) ||
        v.turkish.toLowerCase().includes(q)
      );
    }

    // Unpracticed filter
    if (showOnlyUnpracticed) {
      list = list.filter((v) => {
        const p = cardProgress[v.id];
        return !p || (p.correct + p.wrong === 0);
      });
    }

    // Sort
    switch (sortBy) {
      case 'alpha-de':
        list.sort((a, b) => a.german.localeCompare(b.german, 'de'));
        break;
      case 'alpha-tr':
        list.sort((a, b) => a.turkish.localeCompare(b.turkish, 'tr'));
        break;
      case 'frequency':
        list.sort((a, b) => b.frequency - a.frequency);
        break;
      case 'category':
        list.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'length':
        list.sort((a, b) => a.german.length - b.german.length);
        break;
    }

    return list;
  }, [selectedCategories, searchQuery, sortBy, showOnlyUnpracticed, cardProgress]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredWords.length;
    const practiced = filteredWords.filter((v) => cardProgress[v.id] && (cardProgress[v.id].correct + cardProgress[v.id].wrong > 0)).length;
    const avgFreq = total > 0 ? Math.round(filteredWords.reduce((s, v) => s + v.frequency, 0) / total) : 0;
    return { total, practiced, unpracticed: total - practiced, avgFreq };
  }, [filteredWords, cardProgress]);

  // Close sort menu on outside click
  useEffect(() => {
    if (!showSortMenu) return;
    const handler = () => setShowSortMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showSortMenu]);

  const handleWordClick = useCallback((word: VocabWord) => {
    setSelectedWord(word);
    setViewMode('detail');
  }, []);

  // ── Detail View ──
  if (viewMode === 'detail' && selectedWord) {
    const catColor = getCategoryColor(selectedWord.category);
    const catName = categories.find((c) => c.id === selectedWord.category);
    const progress = cardProgress[selectedWord.id];
    // Find related sentences from wordPairs
    const relatedSentences = wordPairs.filter(
      (wp) => wp.category === selectedWord.category
    ).slice(0, 3);

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => { setViewMode('list'); setSelectedWord(null); }} className="text-muted-foreground hover:text-foreground">
          ← Kelime Listesine Dön
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className={cn('p-6 text-white', `bg-gradient-to-r ${catColor.bg}`)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-3xl font-bold" dir="auto">{selectedWord.german}</p>
                  <p className="text-xl mt-2 opacity-90">{selectedWord.turkish}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className="bg-white/20 text-white border-0">{catName?.nameTr || selectedWord.category}</Badge>
                    <Badge className="bg-white/20 text-white border-0">Sıklık: {selectedWord.frequency}x</Badge>
                  </div>
                </div>
                <SpeakButton text={selectedWord.german} size="lg" color={selectedWord.category === 'giris' ? 'emerald' : 'amber'} label="Dinle" className="text-white hover:bg-white/20" />
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              {/* Progress info */}
              {progress && (progress.correct + progress.wrong > 0) ? (
                <div className="rounded-lg bg-slate-50 p-3 space-y-2">
                  <p className="text-sm font-medium text-slate-700">Çalışma İlerlemen</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-emerald-600">{progress.correct} doğru</span>
                    <span className="text-red-600">{progress.wrong} yanlış</span>
                    <span className="text-slate-500">Toplam: {progress.correct + progress.wrong}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-sm text-blue-700">Bu kelimeyi henüz çalışmadın. Kartlar veya Telaffuz modüllerinde pratik yap!</p>
                </div>
              )}

              {/* Related sentences from the same category */}
              {relatedSentences.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Bu Kategorideki Örnek Cümleler</p>
                  <div className="space-y-2">
                    {relatedSentences.map((wp) => (
                      <div key={wp.id} className="rounded-lg bg-gray-50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-900" dir="auto">{wp.german}</p>
                          <SpeakButton text={wp.german} size="sm" color="emerald" label="" className="shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{wp.turkish}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation between words */}
              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => {
                  const idx = filteredWords.findIndex((w) => w.id === selectedWord.id);
                  if (idx > 0) { setSelectedWord(filteredWords[idx - 1]); }
                }} disabled={filteredWords.findIndex((w) => w.id === selectedWord.id) === 0}>
                  ← Önceki
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const idx = filteredWords.findIndex((w) => w.id === selectedWord.id);
                  if (idx < filteredWords.length - 1) { setSelectedWord(filteredWords[idx + 1]); }
                }} disabled={filteredWords.findIndex((w) => w.id === selectedWord.id) >= filteredWords.length - 1}>
                  Sonraki →
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="space-y-6">
      {/* Daily Word */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-4 text-white">
          <div className="flex items-center gap-2 text-purple-200">
            <Sparkles className="h-4 w-4" /><span className="text-xs font-medium">Günün Kelimesi</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-xl font-bold" dir="auto">{dailyWord.german}</p>
              <p className="text-purple-100 text-sm">{dailyWord.turkish}</p>
            </div>
            <SpeakButton text={dailyWord.german} size="md" color="emerald" label="Dinle" className="text-white hover:bg-white/20" />
          </div>
        </div>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">{categories.find((c) => c.id === dailyWord.category)?.nameTr || ''}</Badge>
              <Badge variant="outline" className="text-[10px]">{dailyWord.frequency}x kullanım</Badge>
            </div>
            <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs" onClick={() => handleWordClick(dailyWord)}>
              Detay <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search + Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Almanca veya Türkçe ara..."
                className="pl-9 h-10"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); }} className="gap-1 text-xs">
                  <ArrowUpDown className="h-3 w-3" />
                  {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                      {SORT_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={(e) => { e.stopPropagation(); setSortBy(opt.value); setShowSortMenu(false); }} className={cn('w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors', sortBy === opt.value ? 'text-emerald-700 font-medium bg-emerald-50' : 'text-gray-700')}>
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button variant={showOnlyUnpracticed ? 'default' : 'outline'} size="sm" onClick={() => setShowOnlyUnpracticed(!showOnlyUnpracticed)} className={cn('gap-1 text-xs', showOnlyUnpracticed ? 'bg-violet-600 hover:bg-violet-700 text-white' : '')}>
                <Filter className="h-3 w-3" />
                Çalışılmamış
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">{stats.total} kelime</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-emerald-50 p-3 text-center">
          <GraduationCap className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
          <p className="text-lg font-bold text-emerald-700">{stats.practiced}</p>
          <p className="text-[10px] text-emerald-600">Çalışıldı</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-center">
          <Hash className="h-5 w-5 mx-auto text-amber-600 mb-1" />
          <p className="text-lg font-bold text-amber-700">{stats.avgFreq}x</p>
          <p className="text-[10px] text-amber-600">Ort. Sıklık</p>
        </div>
        <div className="rounded-xl bg-violet-50 p-3 text-center">
          <BookOpen className="h-5 w-5 mx-auto text-violet-600 mb-1" />
          <p className="text-lg font-bold text-violet-700">{stats.unpracticed}</p>
          <p className="text-[10px] text-violet-600">Bekliyor</p>
        </div>
      </div>

      <CategoryFilter />

      {/* Word List */}
      <div className="space-y-1">
        <AnimatePresence>
          {filteredWords.slice(0, 100).map((word, idx) => {
            const clr = getCategoryColor(word.category);
            const catName = categories.find((c) => c.id === word.category)?.nameTr || '';
            const progress = cardProgress[word.id];
            const isPracticed = progress && (progress.correct + progress.wrong > 0);

            return (
              <motion.button
                key={word.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.015, 0.5) }}
                onClick={() => handleWordClick(word)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 group"
              >
                <div className={cn('h-2 w-2 rounded-full shrink-0', clr.bg)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate text-sm" dir="auto">{word.german}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-gray-200 text-gray-400 shrink-0">{word.frequency}x</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{word.turkish}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-muted-foreground hidden sm:block">{catName}</span>
                  {isPracticed && <Eye className="h-3 w-3 text-emerald-500" />}
                  <SpeakButton text={word.german} size="sm" color="emerald" label="" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7" />
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {filteredWords.length > 100 && (
          <p className="text-center text-xs text-muted-foreground py-3">
            İlk 100 kelime gösteriliyor. Arama veya filtre ile daraltın. (Toplam: {filteredWords.length})
          </p>
        )}
        {filteredWords.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <Search className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Kelime bulunamadı</p>
            <p className="text-xs text-muted-foreground mt-1">Farklı bir arama terimi deneyin veya filtreleri temizleyin</p>
          </div>
        )}
      </div>
    </div>
  );
}
