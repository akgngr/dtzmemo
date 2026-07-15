'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

type RecognitionStatus = 'idle' | 'listening' | 'processing' | 'done' | 'error' | 'unsupported';

interface UseSpeechRecognitionOptions {
  /** Language code — defaults to German */
  lang?: string;
  /** Auto-stop after this many seconds of silence */
  maxDurationMs?: number;
}

interface UseSpeechRecognitionReturn {
  startListening: () => Promise<void>;
  stopListening: () => void;
  status: RecognitionStatus;
  transcript: string | null;
  score: number | null;
  isListening: boolean;
  error: string | null;
  reset: () => void;
  checkPronunciation: (target: string) => PronunciationResult;
}

interface PronunciationResult {
  score: number;
  transcript: string;
  target: string;
  matchedWords: string[];
  missedWords: string[];
  extraWords: string[];
  isCorrect: boolean;
}

// ============================================================
// Text normalization & similarity (pure helpers)
// ============================================================
function normalizeGerman(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:()"„""'`]/g, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function calculateSimilarity(target: string, spoken: string): {
  score: number;
  matchedWords: string[];
  missedWords: string[];
  extraWords: string[];
} {
  const targetWords = normalizeGerman(target).split(' ').filter(Boolean);
  const spokenWords = normalizeGerman(spoken).split(' ').filter(Boolean);

  if (targetWords.length === 0) {
    return { score: 0, matchedWords: [], missedWords: [], extraWords: spokenWords };
  }

  const matched: string[] = [];
  const missed: string[] = [];
  const extra: string[] = [];
  const usedSpokenIndices = new Set<number>();
  let totalWordScores = 0;

  for (const targetWord of targetWords) {
    let bestScore = 0;
    let bestIdx = -1;
    for (let i = 0; i < spokenWords.length; i++) {
      if (usedSpokenIndices.has(i)) continue;
      const spokenWord = spokenWords[i];
      if (targetWord === spokenWord) {
        bestScore = 100;
        bestIdx = i;
        break;
      }
      const maxLen = Math.max(targetWord.length, spokenWord.length);
      if (maxLen === 0) continue;
      const dist = levenshtein(targetWord, spokenWord);
      const similarity = ((maxLen - dist) / maxLen) * 100;
      if (similarity > bestScore && similarity >= 70) {
        bestScore = similarity;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      matched.push(targetWord);
      usedSpokenIndices.add(bestIdx);
      totalWordScores += bestScore;
    } else {
      missed.push(targetWord);
    }
  }

  for (let i = 0; i < spokenWords.length; i++) {
    if (!usedSpokenIndices.has(i)) extra.push(spokenWords[i]);
  }

  const avgWordScore = totalWordScores / targetWords.length;
  const coverage = (matched.length / targetWords.length) * 100;
  const extraPenalty = Math.min(20, extra.length * 5);
  const finalScore = Math.max(0, Math.round(avgWordScore * 0.7 + coverage * 0.3 - extraPenalty));

  return {
    score: finalScore,
    matchedWords: matched,
    missedWords: missed,
    extraWords: extra,
  };
}

// ============================================================
// Minimal Web Speech API typings
// ============================================================
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
  resultIndex: number;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function useSpeechRecognition(opts: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const { lang = 'de-DE', maxDurationMs = 8000 } = opts;

  // Check support lazily on first render so we don't call setState in useEffect.
  const [status, setStatus] = useState<RecognitionStatus>(() => {
    if (typeof window === 'undefined') return 'idle';
    const w = window as any;
    return w.SpeechRecognition || w.webkitSpeechRecognition ? 'idle' : 'unsupported';
  });
  const [transcript, setTranscript] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    return w.SpeechRecognition || w.webkitSpeechRecognition
      ? null
      : 'Tarayıcı ses tanımayı desteklemiyor. Chrome veya Edge kullanın.';
  });

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualStopRef = useRef(false);
  // Guards against rapid double-start race conditions and stale callbacks.
  const isStartingRef = useRef(false);
  const instanceIdRef = useRef(0);

  const getRecognitionCtor = useCallback((): SpeechRecognitionCtor | null => {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    return (w.SpeechRecognition || w.webkitSpeechRecognition) as SpeechRecognitionCtor | undefined ?? null;
  }, []);

  const startListening = useCallback(async () => {
    const ctor = getRecognitionCtor();
    if (!ctor) {
      setStatus('unsupported');
      setError('Tarayıcı ses tanımayı desteklemiyor. Chrome veya Edge kullanın.');
      return;
    }

    // Guard against rapid double-start — Chrome throws an empty error event
    // when start() is called while a previous instance is still shutting down.
    if (isStartingRef.current) {
      return;
    }
    isStartingRef.current = true;

    // Reset
    finalTranscriptRef.current = '';
    setTranscript(null);
    setScore(null);
    setError(null);
    manualStopRef.current = false;

    // Stop any existing instance — bump instance id so stale handlers no-op.
    if (recognitionRef.current) {
      instanceIdRef.current += 1;
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    const myInstanceId = ++instanceIdRef.current;
    const recognition = new ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (instanceIdRef.current !== myInstanceId) return;
      isStartingRef.current = false;
      setStatus('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      if (instanceIdRef.current !== myInstanceId) return;
      let interim = '';
      let final = finalTranscriptRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const txt = result[0].transcript;
        if (result.isFinal) {
          final += txt + ' ';
        } else {
          interim += txt;
        }
      }
      finalTranscriptRef.current = final;
      setTranscript((final + interim).trim());
    };

    recognition.onerror = (e: any) => {
      // Ignore stale instances — their errors belong to an aborted session.
      if (instanceIdRef.current !== myInstanceId) return;

      // Chrome fires onerror with e.error === 'aborted' or an empty event
      // object in many benign situations (rapid toggling, stop+start, etc).
      // These are NOT real failures — treat as no-ops. Status will be
      // normalized by onend, which always fires after onerror.
      const errType = e?.error ?? '';
      if (
        errType === 'aborted' ||
        errType === '' ||
        errType === 'unknown' ||
        !errType
      ) {
        return;
      }

      console.error('[SpeechRecognition] error:', e);
      isStartingRef.current = false;
      if (errType === 'not-allowed' || errType === 'service-not-allowed') {
        setError('Mikrofon izni reddedildi. Tarayıcı ayarlarından izin verin.');
        setStatus('error');
      } else if (errType === 'no-speech') {
        if (!finalTranscriptRef.current.trim()) {
          setError('Ses algılanamadı. Tekrar deneyin.');
          setStatus('error');
        }
      } else if (errType === 'network') {
        setError('Ağ hatası. İnternet bağlantınızı kontrol edin.');
        setStatus('error');
      } else if (errType === 'audio-capture') {
        setError('Mikrofon bulunamadı. Cihazınızda bir mikrofon bağlı olduğundan emin olun.');
        setStatus('error');
      } else {
        setError(`Tanıma hatası: ${errType}`);
        setStatus('error');
      }
    };

    recognition.onend = () => {
      // Ignore stale instances.
      if (instanceIdRef.current !== myInstanceId) return;
      isStartingRef.current = false;
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }
      // Clear recognitionRef so stopListening's safety net doesn't fire
      // spuriously, and so a new startListening won't try to abort an
      // already-ended instance.
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      // If user manually stopped or we have transcript, mark as done
      if (manualStopRef.current || finalTranscriptRef.current.trim()) {
        setStatus('done');
      } else {
        // Don't override an error status set by onerror.
        setStatus((prev) => (prev === 'error' ? prev : 'idle'));
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      maxDurationTimerRef.current = setTimeout(() => {
        manualStopRef.current = true;
        try { recognition.stop(); } catch {}
      }, maxDurationMs);
    } catch (err) {
      console.error('[SpeechRecognition] start failed:', err);
      isStartingRef.current = false;
      setStatus('error');
      setError('Dinleme başlatılamadı');
    }
    // NOTE: `status` is intentionally NOT in deps — including it would
    // recreate this callback every status change and cause stale-closure
    // surprises. We use setStatus(prev => ...) for state checks.
  }, [getRecognitionCtor, lang, maxDurationMs]);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    isStartingRef.current = false;
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (recognitionRef.current) {
      // IMPORTANT: Do NOT bump instanceIdRef here. We WANT the onend
      // handler for this instance to fire — it's what sets status to
      // 'done'. Bumping the id would make onend a no-op and the UI
      // would get stuck in 'listening' forever.
      try { recognitionRef.current.stop(); } catch {}
      // Safety net: if the browser fails to fire onend within 400ms
      // (some Chrome versions are flaky), force the status.
      const instance = recognitionRef.current;
      setTimeout(() => {
        try {
          setStatus((prev) => {
            if (prev === 'listening') {
              return finalTranscriptRef.current.trim() ? 'done' : 'idle';
            }
            return prev;
          });
          if (instance) {
            try { (instance as any).abort?.(); } catch {}
          }
        } catch {}
      }, 400);
    } else {
      // No active instance — normalize the status.
      setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
    }
  }, []);

  // IMPORTANT: checkPronunciation must NOT call setScore. This function
  // is called from useEffect in PronunciationCheck — calling setScore
  // triggers a re-render of the hook → new returned object reference →
  // useEffect re-fires → infinite loop ("Maximum update depth exceeded").
  // The score is returned to the caller, which can use it directly.
  const checkPronunciation = useCallback((target: string): PronunciationResult => {
    const spoken = transcript || finalTranscriptRef.current || '';
    const result = calculateSimilarity(target, spoken);
    return {
      ...result,
      transcript: spoken,
      target,
      isCorrect: result.score >= 70,
    };
  }, [transcript]);

  const reset = useCallback(() => {
    finalTranscriptRef.current = '';
    isStartingRef.current = false;
    if (recognitionRef.current) {
      instanceIdRef.current += 1;
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    setTranscript(null);
    setScore(null);
    setError(null);
    setStatus('idle');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      instanceIdRef.current += 1;
      isStartingRef.current = false;
      if (maxDurationTimerRef.current) clearTimeout(maxDurationTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    startListening,
    stopListening,
    status,
    transcript,
    score,
    isListening: status === 'listening',
    error,
    reset,
    checkPronunciation,
  };
}
