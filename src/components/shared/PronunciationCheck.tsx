'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Square, CheckCircle2, XCircle, Volume2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useTTS } from '@/hooks/use-tts';
import { SpeakButton } from './SpeakButton';
import { cn } from '@/lib/utils';

interface PronunciationCheckProps {
  /** Target text the user should pronounce */
  target: string;
  /** Optional translation/subtitle shown above */
  subtitle?: string;
  /** Minimum score to pass (0–100). Default 70. */
  passingScore?: number;
  /** Visual variant */
  variant?: 'compact' | 'full';
  /** Color theme to match parent module */
  color?: 'emerald' | 'purple' | 'amber' | 'blue';
  /** Optional className */
  className?: string;
  /** Called when user passes the pronunciation check */
  onPass?: () => void;
  /** Called whenever a check completes (with the score) */
  onResult?: (score: number, isCorrect: boolean) => void;
}

const colorMap: Record<string, { ring: string; bg: string; text: string; btn: string }> = {
  emerald: { ring: 'ring-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  purple: { ring: 'ring-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700' },
  amber: { ring: 'ring-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700' },
  blue: { ring: 'ring-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700' },
};

interface CheckResult {
  score: number;
  isCorrect: boolean;
  matchedWords: string[];
  missedWords: string[];
  extraWords: string[];
  transcript: string;
}

export function PronunciationCheck({
  target,
  subtitle,
  passingScore = 70,
  variant = 'compact',
  color = 'emerald',
  className,
  onPass,
  onResult,
}: PronunciationCheckProps) {
  const recognition = useSpeechRecognition({ lang: 'de-DE', maxDurationMs: 10000 });
  const [result, setResult] = useState<CheckResult | null>(null);
  const colors = colorMap[color] || colorMap.emerald;

  // Refs for callback props and stable function access — the `recognition`
  // object returned by the hook changes identity every render (fresh object
  // literal), so we must NOT put it in any useEffect deps. Otherwise the
  // effect fires every render → reset() every render → live transcript
  // gets wiped during listening + spurious aborts.
  const onPassRef = useRef(onPass);
  const onResultRef = useRef(onResult);
  const resetRef = useRef(recognition.reset);
  const checkPronunciationRef = useRef(recognition.checkPronunciation);
  useEffect(() => {
    onPassRef.current = onPass;
    onResultRef.current = onResult;
    resetRef.current = recognition.reset;
    checkPronunciationRef.current = recognition.checkPronunciation;
  });

  // Track which transcript we've already scored, so we don't recompute on
  // every render and get stuck in an update loop.
  const lastScoredTranscriptRef = useRef<string | null>(null);

  // When recognition finishes, calculate the score (only once per transcript)
  useEffect(() => {
    if (recognition.status !== 'done') return;
    const spoken = recognition.transcript || '';
    if (!spoken) return;
    // Bail if we've already scored this exact transcript.
    if (lastScoredTranscriptRef.current === spoken) return;
    lastScoredTranscriptRef.current = spoken;

    const r = checkPronunciationRef.current(target);
    const newResult: CheckResult = {
      score: r.score,
      isCorrect: r.isCorrect,
      matchedWords: r.matchedWords,
      missedWords: r.missedWords,
      extraWords: r.extraWords,
      transcript: r.transcript,
    };
    setResult(newResult);
    onResultRef.current?.(r.score, r.isCorrect);
    if (r.isCorrect) onPassRef.current?.();
    // NOTE: deps are intentionally minimal — `recognition` (the whole object)
    // is NOT included because it changes identity every render and would
    // cause an infinite update loop. We only need status + transcript.
  }, [recognition.status, recognition.transcript, target]);

  // Reset result ONLY when target actually changes. Do NOT depend on
  // `recognition` — that would fire every render and wipe state mid-listen.
  const prevTargetRef = useRef(target);
  useEffect(() => {
    if (prevTargetRef.current === target) return;
    prevTargetRef.current = target;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(null);
    lastScoredTranscriptRef.current = null;
    resetRef.current();
  }, [target]);

  const handleMicToggle = useCallback(() => {
    if (recognition.isListening) {
      recognition.stopListening();
    } else {
      setResult(null);
      lastScoredTranscriptRef.current = null;
      recognition.startListening();
    }
  }, [recognition]);

  const scoreColor = result
    ? result.score >= passingScore
      ? 'text-emerald-600'
      : result.score >= 40
      ? 'text-amber-600'
      : 'text-red-600'
    : 'text-gray-400';

  const scoreBg = result
    ? result.score >= passingScore
      ? 'bg-emerald-50 ring-emerald-300'
      : result.score >= 40
      ? 'bg-amber-50 ring-amber-300'
      : 'bg-red-50 ring-red-300'
    : 'bg-gray-50 ring-gray-200';

  if (recognition.status === 'unsupported') {
    return (
      <div className={cn('rounded-lg border border-amber-200 bg-amber-50 p-3', className)}>
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-medium">Ses tanıma desteklenmiyor</p>
            <p className="mt-0.5 opacity-90">Telefuz kontrolü için Chrome veya Edge tarayıcısı kullanın.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className={cn('flex items-center justify-between px-4 py-2 border-b border-gray-100', colors.bg)}>
        <div className="flex items-center gap-2">
          <Mic className={cn('h-4 w-4', colors.text)} />
          <span className={cn('text-xs font-semibold uppercase tracking-wide', colors.text)}>
            Telefuz Kontrolü
          </span>
        </div>
        <SpeakButton
          text={target}
          size="sm"
          variant="subtle"
          color={color}
          label="Dinle"
        />
      </div>

      {/* Target text */}
      <div className="px-4 py-3">
        {subtitle && (
          <p className="text-xs text-muted-foreground mb-1">{subtitle}</p>
        )}
        <p className="text-base font-medium text-gray-900 leading-snug" dir="auto">
          {target}
        </p>
      </div>

      {/* Mic button + status */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleMicToggle}
            disabled={recognition.status === 'processing'}
            className={cn(
              'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition-all hover:scale-105 disabled:opacity-50',
              recognition.isListening ? 'bg-red-500 hover:bg-red-600' : colors.btn
            )}
            aria-label={recognition.isListening ? 'Dinlemeyi Durdur' : 'Söyle'}
          >
            {recognition.isListening ? (
              <Square className="h-5 w-5" fill="currentColor" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
            {recognition.isListening && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-white"
                initial={{ opacity: 0.7, scale: 1 }}
                animate={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
            {recognition.isListening && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-white"
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ opacity: 0, scale: 2 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              />
            )}
          </button>

          <div className="flex-1 min-w-0">
            {recognition.isListening ? (
              <div>
                <p className="text-sm font-medium text-red-600 flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  Dinleniyor...
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate" dir="auto">
                  {recognition.transcript || 'Lütfen cümleyi Almanca söyleyin...'}
                </p>
              </div>
            ) : recognition.error ? (
              <p className="text-sm text-red-600">{recognition.error}</p>
            ) : result ? (
              <div className="flex items-baseline gap-2">
                <span className={cn('text-2xl font-bold', scoreColor)}>{result.score}%</span>
                <span className={cn('text-sm font-medium', scoreColor)}>
                  {result.isCorrect ? '✓ Doğru!' : 'Tekar dene'}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Mikrofona basıp Almanca olarak okuyun
              </p>
            )}
          </div>
        </div>

        {/* Live transcript while listening */}
        <AnimatePresence>
          {recognition.isListening && recognition.transcript && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 rounded-md bg-gray-50 px-3 py-2"
            >
              <p className="text-xs text-muted-foreground mb-1">Duyulan:</p>
              <p className="text-sm text-gray-700" dir="auto">{recognition.transcript}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result breakdown */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn('mt-3 rounded-lg p-3 ring-1', scoreBg)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {result.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className={cn('h-5 w-5', result.score >= 40 ? 'text-amber-600' : 'text-red-600')} />
                  )}
                  <span className={cn('font-semibold', scoreColor)}>
                    {result.isCorrect ? 'Harika!' : result.score >= 40 ? 'Yaklaştın!' : 'Tekar deneyin'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setResult(null); recognition.reset(); }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Tekar dene
                </button>
              </div>

              {/* Score bar */}
              <div className="mb-2">
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <motion.div
                    className={cn(
                      'h-full rounded-full',
                      result.score >= passingScore ? 'bg-emerald-500' : result.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.score}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* You said: */}
              <div className="mb-2">
                <p className="text-xs text-muted-foreground">Sen söyledin:</p>
                <p className="text-sm font-medium text-gray-700" dir="auto">
                  {result.transcript || '—'}
                </p>
              </div>

              {/* Word-by-word breakdown (only in 'full' variant) */}
              {variant === 'full' && target.split(' ').length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {target.split(' ').map((word, i) => {
                    const normalized = word.toLowerCase().replace(/[.,!?;:]/g, '');
                    const isMatched = result.matchedWords.some(
                      (w) => w.toLowerCase().includes(normalized) || normalized.includes(w.toLowerCase())
                    );
                    const isMissed = result.missedWords.some(
                      (w) => w.toLowerCase().includes(normalized) || normalized.includes(w.toLowerCase())
                    );
                    return (
                      <span
                        key={i}
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs font-medium',
                          isMatched
                            ? 'bg-emerald-100 text-emerald-700'
                            : isMissed
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {word}
                      </span>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
