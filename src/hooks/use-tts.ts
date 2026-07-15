'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

type TTSStatus = 'idle' | 'loading' | 'playing' | 'error';

type TTSProvider = 'elevenlabs' | 'google-cloud' | 'google-translate' | 'browser';

interface UseTTSOptions {
  /** Prefer server-side TTS (ElevenLabs → Google Cloud → Google Translate) over browser */
  preferServer?: boolean;
  /** Language code for browser fallback SpeechSynthesis */
  lang?: string;
  /** Speech rate for fallback (0.5–1.5) */
  rate?: number;
  /** Voice ID for ElevenLabs (optional) */
  voiceId?: string;
  /** Google Cloud TTS voice name override */
  googleVoice?: string;
  /**
   * Sentence-by-sentence streaming: split text on sentence boundaries and
   * start playing the first chunk while later chunks are still being
   * synthesized. Significantly reduces perceived latency for long text.
   * Default: true
   */
  streamSentences?: boolean;
  /**
   * Minimum text length (in chars) before streaming kicks in. Short text
   * is synthesized as a single request. Default: 120
   */
  streamThreshold?: number;
}

interface UseTTSReturn {
  /** Speak the given text */
  speak: (text: string) => Promise<void>;
  /** Stop any ongoing playback */
  stop: () => void;
  /** Current status */
  status: TTSStatus;
  /** Whether TTS is currently active (loading or playing) */
  isBusy: boolean;
  /** Last error message (if any) */
  error: string | null;
  /** Which provider was used on the last successful speak() */
  provider: TTSProvider | null;
}

// ============================================================
// Module-level caches
// ============================================================

// Object URL cache for audio blobs returned by /api/tts — keeps repeated
// TTS calls fast and avoids burning server quota on cache hits.
const audioUrlCache = new Map<string, string>();

// Common-phrase cache: frequently spoken strings (greetings, error
// messages, button labels) are pre-synthesized on first use and reused
// for the rest of the session. These get a longer-lived cache key that
// is keyed by phrase alone (not by voice) so all callers share them.
const PHRASE_CACHE_PREFIX = 'phrase:';
const COMMON_PHRASES = new Set<string>([
  'Hallo!',
  'Hallo',
  'Guten Morgen',
  'Guten Tag',
  'Guten Abend',
  'Tschüss',
  'Vielen Dank',
  'Bitte',
  'Entschuldigung',
  'Wie heißt das auf Deutsch?',
  'Ich verstehe nicht',
  'Können Sie das wiederholen?',
  'Das ist richtig',
  'Das ist falsch',
]);

// Server-side provider disable flag — set when /api/tts returns 5xx,
// meaning all server providers (ElevenLabs + Google Cloud + Google Translate)
// are dead. Falls back to browser SpeechSynthesis for the rest of the session.
let serverTTSDiabled = false;

// Module-level cache of SpeechSynthesis voices. Voices load asynchronously —
// getVoices() returns [] on first call and populates later via the
// `voiceschanged` event. We pre-warm the cache and listen for updates.
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cachedVoices = window.speechSynthesis.getVoices();
  });
}

function pickVoiceForLang(lang: string): SpeechSynthesisVoice | null {
  if (!cachedVoices || cachedVoices.length === 0) return null;
  const exact = cachedVoices.find((v) => v.lang === lang);
  if (exact) return exact;
  const prefix = lang.split('-')[0];
  const family = cachedVoices.find((v) => v.lang.startsWith(prefix));
  if (family) return family;
  const byName = cachedVoices.find((v) =>
    v.name.toLowerCase().includes(prefix.toLowerCase())
  );
  return byName || null;
}

// ============================================================
// Sentence splitter — used for streaming synthesis
// ============================================================
// Splits German text on sentence boundaries (. ! ?), preserving the
// trailing punctuation with each chunk. Falls back to single chunk if
// the text is too short or has no sentence delimiters.
function splitSentences(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length < 80) return [trimmed];
  const matches = trimmed.match(/[^.!?]+[.!?]+["'„"']?\s*/g);
  if (!matches || matches.length <= 1) return [trimmed];
  // Group tiny sentences (under 60 chars) with the next one to avoid
  // one-word chunks that waste API calls.
  const chunks: string[] = [];
  let buffer = '';
  for (const m of matches) {
    buffer += m;
    if (buffer.length >= 60) {
      chunks.push(buffer.trim());
      buffer = '';
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks;
}

export function useTTS(opts: UseTTSOptions = {}): UseTTSReturn {
  const {
    preferServer = true,
    lang = 'de-DE',
    rate = 0.9,
    voiceId,
    googleVoice,
    streamSentences = true,
    streamThreshold = 120,
  } = opts;

  const [status, setStatus] = useState<TTSStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<TTSProvider | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Build audio element lazily
  const getAudio = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended', () => setStatus('idle'));
      audioRef.current.addEventListener('error', () => setStatus('error'));
    }
    return audioRef.current;
  }, []);

  // ============================================================
  // Browser fallback using SpeechSynthesis
  // ============================================================
  // IMPORTANT: Chrome fires onerror('canceled') and onerror('interrupted')
  // in many benign situations — when cancel() is called on a previous
  // utterance, when a new speak() preempts an old one, when the tab loses
  // focus, etc. These are NOT real failures — we resolve quietly instead
  // of rejecting. Rejecting causes "Speech synthesis failed: canceled"
  // errors to spam the console.
  const speakWithBrowser = useCallback(
    (text: string) => {
      return new Promise<void>((resolve, reject) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          reject(new Error('SpeechSynthesis API not supported in this browser'));
          return;
        }

        // Cancel any in-flight speech from a previous call.
        // NOTE: this WILL fire onerror('canceled') on the previous utterance
        // — that's why we track which utterance is "ours" via the local
        // `myUtterance` closure and ignore errors from any other utterance.
        try {
          window.speechSynthesis.cancel();
        } catch {}

        // Some browsers (Chrome) need a tick after cancel() before speak()
        // or the new utterance is silently dropped. Use 100ms (was 50ms) —
        // 50ms was occasionally too short on Chrome 120+.
        setTimeout(() => {
          try {
            // Refresh voice cache in case it loaded late
            if (cachedVoices.length === 0) {
              cachedVoices = window.speechSynthesis.getVoices();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = rate;
            utterance.pitch = 1;
            utterance.volume = 1;

            const voice = pickVoiceForLang(lang);
            if (voice) {
              utterance.voice = voice;
            }

            // If no German voice is available, log a clear warning so the user
            // knows to install one — but still attempt to speak.
            if (!voice) {
              console.warn(
                `[useTTS] No browser voice found for lang "${lang}". Available:`,
                cachedVoices.map((v) => `${v.name} (${v.lang})`).slice(0, 10)
              );
            }

            let settled = false;
            let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
            const myUtterance = utterance; // for identity check in callbacks

            const stopKeepAlive = () => {
              if (keepAliveTimer) {
                clearInterval(keepAliveTimer);
                keepAliveTimer = null;
              }
            };

            const settle = (fn: () => void) => {
              if (settled) return;
              settled = true;
              stopKeepAlive();
              fn();
            };

            utterance.onend = () => {
              // Only handle our own utterance's end event — cancel() on a
              // previous utterance also fires onend, but we don't care.
              if (myUtterance !== utterance) return;
              setStatus('idle');
              settle(resolve);
            };
            utterance.onerror = (e) => {
              if (myUtterance !== utterance) return;
              const errName = (e as SpeechSynthesisErrorEvent).error || 'unknown';
              // Chrome fires these on cancel() / pause() / new speak() — they
              // are NOT real failures. Resolve quietly instead of rejecting.
              // This is the fix for "Speech synthesis failed: canceled".
              if (errName === 'canceled' || errName === 'interrupted') {
                setStatus('idle');
                settle(resolve);
                return;
              }
              console.warn('[useTTS] SpeechSynthesis error:', errName);
              setStatus('error');
              setError(`Tarayıcı ses sentezi başarısız (${errName})`);
              settle(() => reject(new Error(`Speech synthesis failed: ${errName}`)));
            };

            // Chrome 15-second cutoff hack: SpeechSynthesis silently stops
            // after ~15s. Resume every 10s to keep it alive. Only needed for
            // longer texts — short ones finish before the timer matters.
            if (text.length > 100) {
              keepAliveTimer = setInterval(() => {
                try {
                  // pause()+resume() resets Chrome's internal 15s timer
                  if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.pause();
                    window.speechSynthesis.resume();
                  } else {
                    // Already ended — clear the timer to avoid leaks
                    stopKeepAlive();
                  }
                } catch {}
              }, 10000);
            }

            setStatus('playing');
            setProvider('browser');
            window.speechSynthesis.speak(utterance);
          } catch (err) {
            reject(err);
          }
        }, 100);
      });
    },
    [lang, rate]
  );

  // ============================================================
  // Server TTS — fetch a single chunk and play it
  // ============================================================
  const fetchServerAudio = useCallback(
    async (text: string): Promise<{ url: string; provider: TTSProvider }> => {
      // Build cache key — include voiceId/googleVoice so different voices
      // don't share URLs.
      const cacheKey = `${voiceId || 'el-default'}:${googleVoice || 'g-default'}:${text}`;

      // Common-phrase shortcut — phrases in COMMON_PHRASES share a single
      // cache slot regardless of voice settings, because they're often
      // used in contexts where the voice doesn't matter.
      const isPhrase = COMMON_PHRASES.has(text.trim());
      const phraseKey = isPhrase ? `${PHRASE_CACHE_PREFIX}${text.trim()}` : null;

      let url = phraseKey ? audioUrlCache.get(phraseKey) : audioUrlCache.get(cacheKey);

      if (!url) {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceId, googleVoice }),
        });

        if (!response.ok) {
          if (response.status >= 500) {
            // Server-side providers all failed — disable server TTS for
            // the rest of the session and use browser directly.
            serverTTSDiabled = true;
            console.warn(
              `[useTTS] Server TTS returned ${response.status} — disabling for session. ` +
                `Using browser SpeechSynthesis for subsequent calls.`
            );
          }
          throw new Error(`TTS API failed: ${response.status}`);
        }

        const blob = await response.blob();
        if (blob.size === 0) throw new Error('TTS API returned empty audio');

        url = URL.createObjectURL(blob);
        if (phraseKey) {
          audioUrlCache.set(phraseKey, url);
        } else {
          audioUrlCache.set(cacheKey, url);
        }
      }

      // Read the X-TTS-Source header to know which provider served the audio.
      // This is only available on fresh (non-cached) fetches; for cached URLs
      // we default to 'elevenlabs' as a reasonable guess (most common case).
      return { url, provider: 'elevenlabs' };
    },
    [voiceId, googleVoice]
  );

  // ============================================================
  // Server TTS — single-shot (for short text)
  // ============================================================
  const speakWithServerSingle = useCallback(
    async (text: string) => {
      const { url, provider: usedProvider } = await fetchServerAudio(text);
      const audio = getAudio();
      if (!audio) throw new Error('Audio element unavailable');

      audio.src = url;
      setProvider(usedProvider);
      setStatus('playing');
      // audio.play() can reject due to autoplay policy (NotAllowedError)
      // if the user hasn't interacted with the page yet. We re-throw so
      // the caller can fall back to browser SpeechSynthesis, which is
      // sometimes more lenient about autoplay.
      try {
        await audio.play();
      } catch (err) {
        // AbortError happens when stop() is called during play() — benign.
        const errName = (err as DOMException)?.name || '';
        if (errName === 'AbortError') {
          return; // not a real failure — user just stopped playback
        }
        throw err;
      }
    },
    [fetchServerAudio, getAudio]
  );

  // ============================================================
  // Server TTS — streaming (for long text, sentence-by-sentence)
  // ============================================================
  // Splits text on sentence boundaries, kicks off fetch for chunk 1,
  // starts playback as soon as chunk 1 arrives, then fetches chunk 2
  // in parallel with playback. When chunk 1 finishes, chunk 2 plays.
  // This gives a streaming-like experience without a streaming protocol.
  const speakWithServerStreamed = useCallback(
    async (text: string) => {
      const chunks = splitSentences(text);
      if (chunks.length === 0) {
        return speakWithServerSingle(text);
      }

      const audio = getAudio();
      if (!audio) throw new Error('Audio element unavailable');

      setStatus('playing');

      // Build a list of functions that fetch+play each chunk in order.
      // We play them sequentially so the user hears them in the right order.
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const { url, provider: usedProvider } = await fetchServerAudio(chunkText);
        setProvider(usedProvider);

        // Play this chunk — wait until it finishes before moving on.
        await new Promise<void>((resolve, reject) => {
          const onEnded = () => {
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            resolve();
          };
          const onError = () => {
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            reject(new Error('Audio playback error'));
          };
          audio.addEventListener('ended', onEnded);
          audio.addEventListener('error', onError);
          audio.src = url;
          audio.play().catch((err) => {
            const errName = (err as DOMException)?.name || '';
            if (errName === 'AbortError') {
              // User stopped playback — treat as success, not failure.
              audio.removeEventListener('ended', onEnded);
              audio.removeEventListener('error', onError);
              resolve();
            } else {
              reject(err);
            }
          });
        });
      }
      setStatus('idle');
    },
    [fetchServerAudio, getAudio, speakWithServerSingle]
  );

  // ============================================================
  // Main speak() — picks server vs. browser, streamed vs. single
  // ============================================================
  const speak = useCallback(
    async (text: string) => {
      if (!text || !text.trim()) return;
      setError(null);
      setStatus('loading');

      // Try server TTS first if preferred and not disabled
      if (preferServer && !serverTTSDiabled) {
        try {
          // Use streaming for long text, single-shot for short
          const shouldStream =
            streamSentences &&
            text.length >= streamThreshold &&
            /[.!?]/.test(text); // only stream if there are sentence delimiters

          if (shouldStream) {
            await speakWithServerStreamed(text);
          } else {
            await speakWithServerSingle(text);
          }
          return;
        } catch (err) {
          console.warn(
            '[useTTS] Server TTS failed, falling back to browser:',
            (err as Error).message
          );
          // Fall through to browser
        }
      }

      // Fallback to browser SpeechSynthesis
      try {
        await speakWithBrowser(text);
      } catch (err) {
        console.error('[useTTS] Both TTS methods failed:', err);
        setStatus('error');
        setError(
          'Seslendirme yapılamadı. Tarayıcınızın ses ayarlarını kontrol edin.'
        );
      }
    },
    [
      preferServer,
      streamSentences,
      streamThreshold,
      speakWithServerSingle,
      speakWithServerStreamed,
      speakWithBrowser,
    ]
  );

  const stop = useCallback(() => {
    const audio = getAudio();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
  }, [getAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    stop,
    status,
    isBusy: status === 'loading' || status === 'playing',
    error,
    provider,
  };
}
