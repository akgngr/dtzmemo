'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Puzzle, CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { grammarQuestions, GrammarQuestion } from '@/lib/exam-data';
import { useAppStore } from '@/lib/store';

export function ExamGrammarModule() {
  const saveExerciseResult = useAppStore((s) => s.saveExerciseResult);
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const questions = useMemo(() => {
    return [...grammarQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
  }, []);

  const current = questions[currentIdx];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === current.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      const finalCorrect = selected === current.correctIndex ? correctCount : correctCount;
      saveExerciseResult('exam-grammar', finalCorrect, questions.length);
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const reset = () => {
    setStarted(false);
    setCurrentIdx(0);
    setSelected(null);
    setAnswered(false);
    setCorrectCount(0);
    setFinished(false);
  };

  if (!started) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 p-5 border border-violet-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <Puzzle className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-violet-900">Sprachbausteine</h2>
              <p className="text-xs text-violet-500">Dil Yapıları - B1 Sınavı</p>
            </div>
          </div>
          <p className="text-sm text-violet-700 leading-relaxed">
            B1 sınavının dil yapıları bölümünde boşluk doldurma, doğru seçenek, cümle tamamlama
            gibi sorularla karşılaşırsınız. 10 soruluk bir test ile pratik yapın.
          </p>
        </div>
        <button
          onClick={() => setStarted(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
        >
          <Puzzle className="h-4 w-4" /> Teste Başla
        </button>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-white border border-violet-200 p-6 text-center"
        >
          <div className="flex justify-center mb-3">
            <div className={
              `flex h-16 w-16 items-center justify-center rounded-full ${
                pct >= 70 ? 'bg-emerald-100' : 'bg-amber-100'
              }`
            }>
              <Trophy className={`h-8 w-8 ${pct >= 70 ? 'text-emerald-600' : 'text-amber-600'}`} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{pct >= 70 ? 'Harika!' : 'Devam Et!'}</h3>
          <p className="text-3xl font-bold text-violet-600 mb-1">{pct}%</p>
          <p className="text-sm text-gray-500">{correctCount}/{questions.length} doğru cevap</p>
        </motion.div>
        <button
          onClick={reset}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
        >
          <RotateCcw className="h-4 w-4" /> Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Soru {currentIdx + 1}/{questions.length}</span>
        <span className="font-medium text-violet-600">{current.grammarTopicTr}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-violet-500"
          animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500 mb-1">{current.grammarTopic}</p>
        <p className="text-base font-medium text-gray-900 leading-relaxed mb-1">
          {current.sentence.replace('___', '____________')}
        </p>
        <p className="text-xs text-gray-400">{current.sentenceTr}</p>
      </div>

      {/* Options */}
      <div className="grid gap-2">
        {current.options.map((opt, i) => {
          let btnClass = 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50';
          if (answered) {
            if (i === current.correctIndex) btnClass = 'border-emerald-300 bg-emerald-50';
            else if (i === selected) btnClass = 'border-red-300 bg-red-50';
            else btnClass = 'border-gray-100 bg-gray-50 opacity-50';
          }
          return (
            <motion.button
              key={i}
              whileTap={!answered ? { scale: 0.98 } : undefined}
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 ${btnClass}`}
            >
              <span className={
                `flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  answered && i === current.correctIndex
                    ? 'bg-emerald-500 text-white'
                    : answered && i === selected
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`
              }>
                {answered && i === current.correctIndex ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : answered && i === selected ? (
                  <XCircle className="h-3.5 w-3.5" />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              <span className="text-sm font-medium text-gray-800">{opt}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Next */}
      <AnimatePresence>
        {answered && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={handleNext}
            className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            {currentIdx + 1 >= questions.length ? 'Bitir' : 'Sonraki Soru'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
