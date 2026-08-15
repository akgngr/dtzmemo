'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, CheckCircle, XCircle, RotateCcw, Trophy, Volume2,
  Search, BookOpen, ChevronDown, ChevronUp, X, Hash, ListFilter,
} from 'lucide-react';
import { examVocab, examVocabTopics, VocabItem } from '@/lib/exam-data';
import { useAppStore } from '@/lib/store';
import { useTTS } from '@/hooks/use-tts';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 30;
type Mode = 'explore' | 'quiz';

type SortBy = 'default' | 'alpha-de' | 'alpha-tr' | 'has-example';

export function ExamVocabModule() {
  const saveExerciseResult = useAppStore((s) => s.saveExerciseResult);
  const tts = useTTS();

  // Debug: verify word count
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[ExamVocab] examVocab.length:', examVocab.length, 'topics:', examVocabTopics.length);
  }

  const [mode, setMode] = useState<Mode>('explore');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('default');
  const [showSearch, setShowSearch] = useState(false);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Quiz state
  const [quizItems, setQuizItems] = useState<VocabItem[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [dontKnowIds, setDontKnowIds] = useState<Set<string>>(new Set());
  const [quizFinished, setQuizFinished] = useState(false);

  // Topics with counts
  const topics = useMemo(() => examVocabTopics, []);

  // Filtered & sorted vocab
  const filteredVocab = useMemo(() => {
    let items = examVocab;
    if (selectedTopic) items = items.filter(v => v.topic === selectedTopic);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(v =>
        v.german.toLowerCase().includes(q) ||
        v.turkish.toLowerCase().includes(q) ||
        (v.article && v.article.toLowerCase().includes(q))
      );
    }
    switch (sortBy) {
      case 'alpha-de': items = [...items].sort((a, b) => a.german.localeCompare(b.german, 'de')); break;
      case 'alpha-tr': items = [...items].sort((a, b) => a.turkish.localeCompare(b.turkish, 'tr')); break;
      case 'has-example': items = [...items].sort((a, b) => (b.example ? 1 : 0) - (a.example ? 1 : 0)); break;
    }
    return items;
  }, [selectedTopic, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredVocab.length / PAGE_SIZE);
  const pagedVocab = filteredVocab.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page on filter change
  const handleTopicChange = useCallback((t: string | null) => {
    setSelectedTopic(t);
    setPage(0);
    setExpandedId(null);
  }, []);
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setPage(0);
  }, []);

  // Quiz
  const startQuiz = useCallback(() => {
    const pool = selectedTopic ? filteredVocab : examVocab;
    const items = [...pool].sort(() => Math.random() - 0.5).slice(0, 15);
    if (items.length === 0) return;
    setQuizItems(items);
    setQuizIdx(0);
    setShowAnswer(false);
    setKnownCount(0);
    setDontKnowIds(new Set());
    setQuizFinished(false);
    setMode('quiz');
  }, [selectedTopic, filteredVocab]);

  const handleKnow = () => {
    setKnownCount(c => c + 1);
    advance();
  };
  const handleDontKnow = () => {
    if (quizItems[quizIdx]) setDontKnowIds(prev => new Set([...prev, quizItems[quizIdx].id]));
    advance();
  };
  const advance = () => {
    if (quizIdx + 1 >= quizItems.length) {
      const finalKnown = knownCount + 1;
      saveExerciseResult('exam-vocab', finalKnown, quizItems.length);
      setQuizFinished(true);
    } else {
      setQuizIdx(i => i + 1);
      setShowAnswer(false);
    }
  };
  const resetQuiz = () => {
    setMode('explore');
    setQuizItems([]); setQuizIdx(0); setShowAnswer(false);
    setKnownCount(0); setDontKnowIds(new Set()); setQuizFinished(false);
  };
  const currentQuizItem = quizItems[quizIdx];

  /* ══════════ QUIZ FINISHED ══════════ */
  if (quizFinished) {
    const pct = Math.round((knownCount / quizItems.length) * 100);
    return (
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-white border border-violet-200 p-6 text-center"
        >
          <div className="flex justify-center mb-3">
            <div className={cn('flex h-16 w-16 items-center justify-center rounded-full', pct >= 70 ? 'bg-emerald-100' : 'bg-amber-100')}>
              <Trophy className={cn('h-8 w-8', pct >= 70 ? 'text-emerald-600' : 'text-amber-600')} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{pct >= 70 ? 'Harika!' : 'Tekrar Gerek!'}</h3>
          <p className="text-3xl font-bold text-violet-600 mb-1">{pct}%</p>
          <p className="text-sm text-gray-500">{knownCount}/{quizItems.length} kelime biliniyor</p>
        </motion.div>
        {/* Wrong words review */}
        {dontKnowIds.size > 0 && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold text-red-700 mb-2">Bilinmeyen Kelimeler ({dontKnowIds.size})</p>
            <div className="space-y-1">
              {quizItems.filter(qi => dontKnowIds.has(qi.id)).map(qi => (
                <div key={qi.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-red-100">
                  <div>
                    <span className="font-bold text-gray-900">{qi.german}</span>
                    <span className="text-red-500 ml-2">{qi.turkish}</span>
                  </div>
                  <button onClick={() => tts.speak(qi.german)} className="text-violet-500 hover:text-violet-700">
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={resetQuiz} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200">
            <RotateCcw className="h-4 w-4" /> Geri
          </button>
          <button onClick={startQuiz} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700">
            <GraduationCap className="h-4 w-4" /> Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  /* ══════════ QUIZ MODE ══════════ */
  if (mode === 'quiz' && currentQuizItem) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Kart {quizIdx + 1}/{quizItems.length}</span>
          <span className="text-violet-600 font-medium">{currentQuizItem.topicTr}</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <motion.div className="h-full rounded-full bg-violet-500"
            animate={{ width: `${((quizIdx + 1) / quizItems.length) * 100}%` }} />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-xs text-gray-400 mb-1">Bu kelimeyi biliyor musunuz?</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{currentQuizItem.german}</p>
          {currentQuizItem.article && (
            <p className="text-xs text-gray-400 mb-2">{currentQuizItem.article} · {currentQuizItem.plural || '—'}</p>
          )}
          <button onClick={() => tts.speak(currentQuizItem.german)}
            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline mb-3">
            <Volume2 className="h-3.5 w-3.5" /> Dinle
          </button>
          <AnimatePresence>
            {showAnswer && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-2">
                <p className="text-lg font-semibold text-violet-600">{currentQuizItem.turkish}</p>
                {currentQuizItem.example && (
                  <p className="text-xs text-gray-500 italic">{currentQuizItem.example}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex gap-2">
          {!showAnswer ? (
            <button onClick={() => setShowAnswer(true)} className="flex-1 rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white hover:bg-violet-700">
              Cevabı Göster
            </button>
          ) : (
            <>
              <button onClick={handleDontKnow} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 hover:bg-red-100">
                <XCircle className="h-4 w-4" /> Bilmiyorum
              </button>
              <button onClick={handleKnow} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 py-3 text-sm font-semibold text-emerald-600 hover:bg-emerald-100">
                <CheckCircle className="h-4 w-4" /> Biliyorum
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ══════════ EXPLORE MODE ══════════ */
  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'default', label: 'Varsayılan' },
    { value: 'alpha-de', label: 'Almanca A-Z' },
    { value: 'alpha-tr', label: 'Türkçe A-Z' },
    { value: 'has-example', label: 'Örnekli' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 p-5 border border-violet-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <GraduationCap className="h-5 w-5 text-violet-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-violet-900">Prüfungswortschatz</h2>
            <p className="text-xs text-violet-500">B1 Sınav Kelimeleri</p>
          </div>
        </div>
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="rounded-lg bg-white/70 border border-violet-100 px-3 py-2 text-center">
            <p className="text-lg font-bold text-violet-700">{examVocab.length}</p>
            <p className="text-[10px] text-violet-400">Toplam Kelime</p>
          </div>
          <div className="rounded-lg bg-white/70 border border-violet-100 px-3 py-2 text-center">
            <p className="text-lg font-bold text-violet-700">{topics.length}</p>
            <p className="text-[10px] text-violet-400">Konu</p>
          </div>
          <div className="rounded-lg bg-white/70 border border-violet-100 px-3 py-2 text-center">
            <p className="text-lg font-bold text-violet-700">{examVocab.filter(v => v.example).length}</p>
            <p className="text-[10px] text-violet-400">Örnek Cümle</p>
          </div>
        </div>
      </div>

      {/* Search + Sort bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <AnimatePresence>
            {showSearch && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: '100%', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                className="absolute inset-0 z-10"
              >
                <div className="flex items-center gap-2 h-10 rounded-xl border border-violet-300 bg-white px-3">
                  <Search className="h-4 w-4 text-gray-400 shrink-0" />
                  <input
                    type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)}
                    placeholder="Kelime ara (DE/TR)..." autoFocus
                    className="flex-1 text-sm bg-transparent outline-none"
                    dir="auto"
                  />
                  {searchQuery && (
                    <button onClick={() => handleSearch('')} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => setShowSearch(v => !v)}
          className={cn('h-10 w-10 flex items-center justify-center rounded-xl border transition-colors shrink-0',
            showSearch ? 'border-violet-300 bg-violet-50 text-violet-600' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50')
          }
        >
          <Search className="h-4 w-4" />
        </button>
        <div className="relative">
          <button onClick={() => {
            const next = sortOptions[(sortOptions.findIndex(s => s.value === sortBy) + 1) % sortOptions.length];
            setSortBy(next.value);
          }}
            className="h-10 flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 shrink-0"
          >
            <ListFilter className="h-4 w-4" /> {sortOptions.find(s => s.value === sortBy)?.label}
          </button>
        </div>
      </div>

      {/* Topic filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => handleTopicChange(null)}
          className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            !selectedTopic ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
        }>
          Tümü ({examVocab.length})
        </button>
        {topics.map(t => (
          <button key={t.de} onClick={() => handleTopicChange(t.de)}
            className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              selectedTopic === t.de ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
          }>
            {t.tr} ({t.count})
          </button>
        ))}
      </div>

      {/* Quiz button */}
      <button onClick={startQuiz}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
      >
        <GraduationCap className="h-4 w-4" /> Quiz Başla ({filteredVocab.length} kelime)
      </button>

      {/* Result count + page info */}
      {filteredVocab.length !== examVocab.length && (
        <p className="text-xs text-gray-400 text-center">
          {filteredVocab.length} kelime bulundu
          {searchQuery && ` — "${searchQuery}"`}
        </p>
      )}

      {/* Vocab list */}
      <div className="space-y-1.5">
        {pagedVocab.map((item, i) => {
          const isExpanded = expandedId === item.id;
          return (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
              >
                {/* Word info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.german}</p>
                    {item.article && (
                      <span className="shrink-0 text-[10px] rounded bg-violet-50 text-violet-600 px-1.5 py-0.5 font-medium">{item.article}</span>
                    )}
                    {item.example && (
                      <BookOpen className="h-3 w-3 text-amber-400 shrink-0" title="Örnek cümle var" />
                    )}
                  </div>
                  <p className="text-xs text-violet-600 font-medium truncate mt-0.5">{item.turkish}</p>
                </div>
                {/* Topic + expand */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] rounded-full bg-gray-100 px-2 py-0.5 text-gray-500 whitespace-nowrap">{item.topicTr}</span>
                  <button onClick={e => { e.stopPropagation(); tts.speak(item.german); }}
                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-violet-50 text-violet-400 hover:text-violet-600"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </button>
              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden border-t border-gray-100"
                  >
                    <div className="px-3 py-2.5 bg-gray-50/50 space-y-1.5">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {item.article && <span><span className="font-medium">Artikel:</span> {item.article}</span>}
                        {item.plural && <span><span className="font-medium">Plural:</span> {item.plural}</span>}
                      </div>
                      {item.example && (
                        <div className="text-xs text-gray-600 italic bg-white rounded-lg px-2.5 py-2 border border-gray-100">
                          <p>{item.example}</p>
                          {item.exampleTr && <p className="text-gray-400 mt-1 not-italic">{item.exampleTr}</p>}
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <button onClick={() => tts.speak(item.german)}
                          className="flex items-center gap-1 rounded-lg bg-violet-100 px-2 py-1 text-[11px] text-violet-700 hover:bg-violet-200"
                        >
                          <Volume2 className="h-3 w-3" /> Almanca dinle
                        </button>
                        <button onClick={() => tts.speak(item.turkish)}
                          className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-200"
                        >
                          <Volume2 className="h-3 w-3" /> Türkçe dinle
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 text-xs"
          >
            <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
          </button>
          <span className="text-xs text-gray-500 tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 text-xs"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-4" />
    </div>
  );
}
