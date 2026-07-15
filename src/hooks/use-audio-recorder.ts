'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

type RecorderStatus = 'idle' | 'recording' | 'stopping' | 'error';

interface UseAudioRecorderOptions {
  /** Auto-stop after this many milliseconds. Default 30 seconds. */
  maxDurationMs?: number;
  /** MIME type preference list (first supported will be used) */
  mimeTypes?: string[];
}

interface UseAudioRecorderReturn {
  /** Start recording */
  startRecording: () => Promise<void>;
  /** Stop recording and return the recorded blob */
  stopRecording: () => Promise<Blob | null>;
  /** Cancel recording (discards audio) */
  cancelRecording: () => void;
  /** Current status */
  status: RecorderStatus;
  /** Whether we are currently recording */
  isRecording: boolean;
  /** Recording duration in seconds */
  duration: number;
  /** Last error message */
  error: string | null;
  /** Whether the browser supports audio recording */
  isSupported: boolean;
  /** Audio level (0–100) for visual feedback — updated via AudioAnalyser */
  audioLevel: number;
}

function pickSupportedMimeType(preferred: string[]): string | null {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return null;
  for (const type of preferred) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return null;
}

const DEFAULT_MIME_TYPES = [
  'audio/webm;codecs=opus',  // Chrome/Firefox — best compression
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',               // Safari fallback
];

export function useAudioRecorder(opts: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const { maxDurationMs = 30_000, mimeTypes = DEFAULT_MIME_TYPES } = opts;

  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyserRef = useRef<{ raf: number | null; analyser: AnalyserNode | null; ctx: AudioContext | null }>({
    raf: null,
    analyser: null,
    ctx: null,
  });

  const isSupported = typeof window !== 'undefined'
    && typeof MediaRecorder !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia;

  const cleanupStream = useCallback(() => {
    if (analyserRef.current.raf) {
      cancelAnimationFrame(analyserRef.current.raf);
      analyserRef.current.raf = null;
    }
    if (analyserRef.current.analyser) {
      try { analyserRef.current.analyser.disconnect(); } catch {}
      analyserRef.current.analyser = null;
    }
    if (analyserRef.current.ctx) {
      try { analyserRef.current.ctx.close(); } catch {}
      analyserRef.current.ctx = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  const stopAnalyserLoop = useCallback(() => {
    if (analyserRef.current.raf) {
      cancelAnimationFrame(analyserRef.current.raf);
      analyserRef.current.raf = null;
    }
  }, []);

  const startAnalyserLoop = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);

      analyserRef.current.ctx = ctx;
      analyserRef.current.analyser = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current.analyser) return;
        analyserRef.current.analyser.getByteTimeDomainData(dataArray);
        // Compute RMS amplitude
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const level = Math.min(100, Math.round(rms * 200));
        setAudioLevel(level);
        analyserRef.current.raf = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      console.warn('[useAudioRecorder] Analyser setup failed:', err);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setStatus('error');
      setError('Tarayıcı ses kaydını desteklemiyor. Chrome veya Edge kullanın.');
      return;
    }
    setError(null);
    setDuration(0);
    setAudioLevel(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = pickSupportedMimeType(mimeTypes) || '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Set up analyser for visual feedback
      startAnalyserLoop(stream);

      mediaRecorderRef.current = recorder;
      recorder.start(250); // collect data in 250ms chunks
      startTimeRef.current = Date.now();
      setStatus('recording');

      // Duration timer — update every 100ms for smooth UI
      durationTimerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 250);

      // Max duration auto-stop
      maxTimerRef.current = setTimeout(() => {
        // We can't await inside setTimeout; just trigger the recorder stop
        // and the consumer can read the blob from the returned promise
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, maxDurationMs);
    } catch (err: any) {
      console.error('[useAudioRecorder] start failed:', err);
      setStatus('error');
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setError('Mikrofon izni reddedildi. Tarayıcı ayarlarından izin verin.');
      } else if (err?.name === 'NotFoundError') {
        setError('Mikrofon bulunamadı. Cihazınızın mikrofonu olduğundan emin olun.');
      } else {
        setError('Kayıt başlatılamadı: ' + (err?.message || String(err)));
      }
      cleanupStream();
    }
  }, [isSupported, mimeTypes, maxDurationMs, startAnalyserLoop, cleanupStream]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state !== 'recording') {
        resolve(null);
        return;
      }

      setStatus('stopping');

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        cleanupStream();
        stopAnalyserLoop();
        setAudioLevel(0);
        setStatus('idle');
        resolve(blob);
      };

      try {
        recorder.stop();
      } catch (err) {
        console.error('[useAudioRecorder] stop failed:', err);
        cleanupStream();
        setStatus('error');
        resolve(null);
      }
    });
  }, [cleanupStream, stopAnalyserLoop]);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      try { recorder.stop(); } catch {}
    }
    chunksRef.current = [];
    cleanupStream();
    setAudioLevel(0);
    setDuration(0);
    setStatus('idle');
  }, [cleanupStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state === 'recording') {
        try { recorder.stop(); } catch {}
      }
      cleanupStream();
    };
  }, [cleanupStream]);

  return {
    startRecording,
    stopRecording,
    cancelRecording,
    status,
    isRecording: status === 'recording',
    duration,
    error,
    isSupported,
    audioLevel,
  };
}
