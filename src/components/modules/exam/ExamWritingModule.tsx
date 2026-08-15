'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, Lightbulb, ChevronRight, RotateCcw, CheckCircle, FileText } from 'lucide-react';
import { writingPrompts, WritingPrompt } from '@/lib/exam-data';

export function ExamWritingModule() {
  const [currentPrompt, setCurrentPrompt] = useState<WritingPrompt | null>(null);
  const [text, setText] = useState('');
  const [showTips, setShowTips] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const shuffled = useMemo(() => {
    return [...writingPrompts].sort(() => Math.random() - 0.5);
  }, []);

  const startExercise = (prompt: WritingPrompt) => {
    setCurrentPrompt(prompt);
    setText('');
    setSubmitted(false);
    setShowTips(false);
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const reset = () => {
    setCurrentPrompt(null);
    setText('');
    setSubmitted(false);
  };

  if (!currentPrompt) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 p-5 border border-violet-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <PenLine className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-violet-900">Schriftlicher Ausdruck</h2>
              <p className="text-xs text-violet-500">Yazma - B1 Sınavı</p>
            </div>
          </div>
          <p className="text-sm text-violet-700 leading-relaxed">
            B1 sınavının yazma bölümünde kısa mesajlar, e-postalar, mektuplar veya forum gönderileri yazmanız istenir.
            Bir konu seçerek pratik yapabilirsiniz.
          </p>
        </div>

        <div className="grid gap-3">
          {shuffled.map((prompt, i) => (
            <motion.button
              key={prompt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => startExercise(prompt)}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-violet-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{prompt.title}</p>
                <p className="text-xs text-gray-500 truncate">{prompt.titleTr}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Prompt Card */}
      <div className="rounded-2xl border border-violet-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-violet-900">{currentPrompt.title}</h3>
          <span className="text-xs text-gray-400">{currentPrompt.minWords}–{currentPrompt.maxWords} kelime</span>
        </div>
        <p className="text-sm font-medium text-gray-800 mb-2 leading-relaxed">{currentPrompt.description}</p>
        <p className="text-sm text-gray-500 leading-relaxed">{currentPrompt.descriptionTr}</p>

        <button
          onClick={() => setShowTips(!showTips)}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          {showTips ? 'İpuçlarını Gizle' : 'İpuçlarını Göster'}
        </button>

        <AnimatePresence>
          {showTips && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <ul className="mt-2 space-y-1">
                {currentPrompt.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-violet-600 flex items-start gap-1.5">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Text Area */}
      {!submitted ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Schreiben Sie hier Ihren Text..."
            className="w-full h-48 rounded-xl border border-gray-200 p-4 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${wordCount < currentPrompt.minWords ? 'text-red-500' : wordCount > currentPrompt.maxWords ? 'text-amber-500' : 'text-emerald-600'}`}>
              {wordCount} / {currentPrompt.minWords}–{currentPrompt.maxWords} kelime
            </span>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Geri
              </button>
              <button
                onClick={handleSubmit}
                disabled={wordCount < 10}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Tamamla
              </button>
            </div>
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-900">Metnin Tamamlandı!</h3>
          </div>
          <div className="rounded-lg bg-white p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-3">
            {text}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{wordCount} kelime yazıldı</span>
            <button onClick={reset} className="text-violet-600 font-medium hover:underline">
              Başka bir konu seç
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
