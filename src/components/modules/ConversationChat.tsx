'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Square, Send, Volume2, Lightbulb, X,
  Loader2, MessageCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type ConversationTopic } from '@/lib/conversation-topics';
import { useTTS } from '@/hooks/use-tts';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

type Sender = 'user' | 'ai';

interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  tip?: string;
  isEnding?: boolean;
  timestamp: number;
}

interface ConversationChatProps {
  topic: ConversationTopic;
  onExit: (summary: ConversationSummary) => void;
}

export interface ConversationSummary {
  topicId: string;
  topicTitleDe: string;
  topicTitleTr: string;
  messageCount: number;
  userMessageCount: number;
  tipsCount: number;
  durationSec: number;
  messages: ChatMessage[];
}

type Phase = 'chatting' | 'listening' | 'loading-ai' | 'ended';

const MAX_TURNS = 10;

// Minimal typings for the Web Speech API (Google's free STT in Chrome)
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

export function ConversationChat({ topic, onExit }: ConversationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'opener',
      sender: 'ai',
      text: topic.opener,
      timestamp: Date.now(),
    },
  ]);
  const [phase, setPhase] = useState<Phase>('chatting');
  const [textInput, setTextInput] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [showVocab, setShowVocab] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [browserSupported, setBrowserSupported] = useState<boolean>(true);

  // ===== Google Web Speech API quota tracking =====
  const speechUsage = useAppStore((s) => s.speechUsage);
  const incrementSpeechUsage = useAppStore((s) => s.incrementSpeechUsage);
  const hasSpeechQuota = useAppStore((s) => s.hasSpeechQuota);
  const remainingSpeechQuota = useAppStore((s) => s.remainingSpeechQuota);
  const daysUntilSpeechReset = useAppStore((s) => s.daysUntilSpeechReset);

  // Recompute remaining on every render — store getters read fresh state
  const quotaRemaining = remainingSpeechQuota();
  const quotaExhausted = !hasSpeechQuota();
  const daysUntilReset = daysUntilSpeechReset();

  const tts = useTTS({ lang: 'de-DE' });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const autoPlayRef = useRef<boolean>(true);
  const lastAiMessageRef = useRef<ChatMessage | null>(null);

  // SpeechRecognition refs
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const manualStopRef = useRef<boolean>(false);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lazy-init the SpeechRecognition constructor (browser only)
  const getRecognitionCtor = useCallback((): SpeechRecognitionCtor | null => {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    return ((w.SpeechRecognition || w.webkitSpeechRecognition) as
      | SpeechRecognitionCtor
      | undefined) ?? null;
  }, []);

  // Check support on mount
  useEffect(() => {
    const ctor = getRecognitionCtor();
    if (!ctor) {
      setBrowserSupported(false);
    }
  }, [getRecognitionCtor]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, phase, liveTranscript]);

  // Auto-play AI messages via browser TTS (Google's free voices in Chrome)
  useEffect(() => {
    if (!autoPlayRef.current) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.sender !== 'ai') return;
    if (lastMsg === lastAiMessageRef.current) return;
    lastAiMessageRef.current = lastMsg;

    // Browser-only TTS (SpeechSynthesis — Google's free Web Speech API)
    tts.speak(lastMsg.text).catch((e) =>
      console.warn('Browser TTS failed:', e)
    );
  }, [messages, tts]);

  const fetchAiReply = useCallback(async (history: ChatMessage[]) => {
    setPhase('loading-ai');
    setError(null);
    try {
      const apiMessages = history
        .filter((m) => m.id !== 'opener')
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));
      apiMessages.unshift({ role: 'assistant', content: topic.opener });

      const userTurnIndex = history.filter((m) => m.sender === 'user').length;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt:
            topic.systemPrompt +
            `\n\nBu konuşma ${MAX_TURNS} turdan oluşacak. ${
              userTurnIndex >= MAX_TURNS - 1
                ? 'Bu son tur — vedalaşarak bitir.'
                : ''
            }`,
          messages: apiMessages,
          temperature: 0.7,
          maxTokens: 400,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.detail || `HTTP ${response.status}`);
      }
      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: (data.reply || '').trim() || '...',
        tip: data.tip || '',
        isEnding: Boolean(data.isEnding) || userTurnIndex >= MAX_TURNS - 1,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (aiMsg.isEnding) {
        setTimeout(() => setPhase('ended'), 1500);
      } else {
        setPhase('chatting');
      }
    } catch (err) {
      console.error('[ConversationChat] AI reply failed:', err);
      setError('Yanıt alınamadı: ' + (err as Error).message);
      setPhase('chatting');
    }
  }, [topic]);

  // ===== Browser SpeechRecognition (Google's free STT) =====
  const startListening = useCallback(async () => {
    const ctor = getRecognitionCtor();
    if (!ctor) {
      setBrowserSupported(false);
      setError('Tarayıcı ses tanımayı desteklemiyor. Chrome veya Edge kullanın. Yazarak cevap verebilirsiniz.');
      return;
    }

    // Quota check — if exhausted, refuse to start and tell user when it resets
    if (!hasSpeechQuota()) {
      setError(
        `Bu ayki ücretsiz Google Web Speech API kotan doldu (${speechUsage.monthlyLimit} tanıma). ` +
        `Kota her ayın 1'inde otomatik yenilenir. ${daysUntilReset} gün sonra tekrar kullanabilirsin. ` +
        `Bu süre içinde yazarak cevap vermeye devam edebilirsin.`
      );
      return;
    }

    // Stop any playing audio before recording
    tts.stop();
    setError(null);
    setLiveTranscript('');
    finalTranscriptRef.current = '';
    manualStopRef.current = false;

    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const recognition = new ctor();
    recognition.lang = 'de-DE';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setPhase('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
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
      setLiveTranscript((final + interim).trim());
    };

    recognition.onerror = (e: any) => {
      console.error('[ConversationChat] SpeechRecognition error:', e);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('Mikrofon izni reddedildi. Tarayıcı ayarlarından izin verin.');
      } else if (e.error === 'no-speech') {
        if (!finalTranscriptRef.current.trim()) {
          setError('Ses algılanamadı. Tekrar deneyin veya yazarak cevap verin.');
        }
      } else if (e.error === 'network') {
        setError('Ağ hatası. İnternet bağlantınızı kontrol edin (Web Speech API internet gerektirir).');
      } else if (e.error === 'aborted') {
        // Manual abort — not an error
        return;
      } else {
        setError(`Tanıma hatası: ${e.error}`);
      }
      setPhase('chatting');
    };

    recognition.onend = () => {
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        // Successful STT call — increment monthly counter
        incrementSpeechUsage();

        // Add it as user message and fetch AI reply
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: finalText,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setLiveTranscript('');
        // Trigger AI reply with the updated history
        fetchAiReply([...messages, userMsg]);
      } else if (manualStopRef.current) {
        // User stopped but no transcript — don't count this against quota
        setPhase('chatting');
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      // Auto-stop after 30 seconds to avoid runaway listening
      maxDurationTimerRef.current = setTimeout(() => {
        manualStopRef.current = true;
        try { recognition.stop(); } catch {}
      }, 30_000);
    } catch (err) {
      console.error('[ConversationChat] start failed:', err);
      setError('Dinleme başlatılamadı. Yazarak cevap verebilirsiniz.');
      setPhase('chatting');
    }
  }, [getRecognitionCtor, messages, tts, fetchAiReply, hasSpeechQuota, speechUsage.monthlyLimit, daysUntilReset, incrementSpeechUsage]);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  }, []);

  // Mic toggle
  const handleMicToggle = useCallback(async () => {
    if (phase === 'listening') {
      stopListening();
    } else if (phase === 'chatting') {
      await startListening();
    }
  }, [phase, startListening, stopListening]);

  const handleSendText = useCallback(async () => {
    const text = textInput.trim();
    if (!text || phase !== 'chatting') return;
    setTextInput('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    await fetchAiReply([...messages, userMsg]);
  }, [textInput, phase, messages, fetchAiReply]);

  const handleEndConversation = useCallback(() => {
    // Stop any active recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    tts.stop();
    setPhase('ended');
  }, [tts]);

  // Build and send the summary when phase becomes 'ended'
  useEffect(() => {
    if (phase !== 'ended') return;
    const userMessageCount = messages.filter((m) => m.sender === 'user').length;
    const tipsCount = messages.filter((m) => m.tip && m.tip.trim()).length;
    const summary: ConversationSummary = {
      topicId: topic.id,
      topicTitleDe: topic.titleDe,
      topicTitleTr: topic.titleTr,
      messageCount: messages.length,
      userMessageCount,
      tipsCount,
      durationSec: Math.round((Date.now() - startTimeRef.current) / 1000),
      messages,
    };
    onExit(summary);
  }, [phase, messages, topic, onExit]);

  // Replay an AI message via browser TTS
  const replayMessage = useCallback((msg: ChatMessage) => {
    tts.speak(msg.text);
  }, [tts]);

  const isBusy = phase === 'listening' || phase === 'loading-ai';

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)]">
      {/* Topic header */}
      <div className={cn('rounded-xl p-3 text-white shadow-sm', topic.color)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">{topic.icon}</span>
            <div className="min-w-0">
              <h2 className="text-base font-bold leading-tight truncate">{topic.titleDe}</h2>
              <p className="text-xs opacity-90 truncate">{topic.titleTr} · {topic.difficulty}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 px-2"
              onClick={() => setShowVocab((v) => !v)}
              aria-label="Kelime listesi"
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 px-2"
              onClick={() => setShowHints((v) => !v)}
              aria-label="Örnek cümleler"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 px-2"
              onClick={handleEndConversation}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Vocabulary drawer (collapsible) */}
      <AnimatePresence>
        {showVocab && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-0 shadow-sm mt-2">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Önemli Kelimeler</span>
                  <button onClick={() => setShowVocab(false)} className="text-xs text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {topic.vocabulary.map((v, i) => (
                    <div key={i} className="rounded bg-amber-50 px-2 py-1 text-xs">
                      <span className="font-medium text-amber-900">{v.de}</span>
                      <span className="text-amber-700 ml-1">— {v.tr}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sample phrases drawer */}
      <AnimatePresence>
        {showHints && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-0 shadow-sm mt-2">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Örnek Cümleler</span>
                  <button onClick={() => setShowHints(false)} className="text-xs text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {topic.samplePhrases.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => { setTextInput(p); setShowHints(false); }}
                      className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode badge — Google free APIs */}
      <div className="mt-2 flex justify-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-[10px] py-0.5 px-2 border-emerald-200 text-emerald-600 bg-emerald-50">
          🆓 Google Web Speech API · Ücretsiz tarayıcı ses tanıma + seslendirme
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] py-0.5 px-2',
            quotaExhausted
              ? 'border-red-200 text-red-600 bg-red-50'
              : quotaRemaining <= 10
              ? 'border-amber-200 text-amber-700 bg-amber-50'
              : 'border-slate-200 text-slate-600 bg-slate-50'
          )}
          title={
            quotaExhausted
              ? `Kota doldu — ${daysUntilReset} gün sonra yenilenecek (her ayın 1'inde)`
              : `Bu ay ${quotaRemaining} / ${speechUsage.monthlyLimit} tanıma hakkı kaldı. Kota her ayın 1'inde yenilenir.`
          }
        >
          {quotaExhausted
            ? `🔴 Kota doldu · ${daysUntilReset} gün sonra yenilenecek`
            : `🎤 Kota: ${quotaRemaining} / ${speechUsage.monthlyLimit} (bu ay)`}
        </Badge>
      </div>

      {quotaExhausted && browserSupported && (
        <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 border border-red-200">
          <p className="font-semibold">⚠️ Bu ayki ücretsiz ses tanıma kotan doldu.</p>
          <p className="mt-1">
            Google Web Speech API kotası her ayın 1'inde otomatik yenilenir.{' '}
            <strong>{daysUntilReset} gün</strong> sonra tekrar mikrofonla konuşabilirsin.
            Bu süre içinde <strong>yazarak cevap vermeye</strong> devam edebilirsin — yazılı modda kota sınırlaması yoktur.
          </p>
        </div>
      )}

      {!browserSupported && (
        <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 border border-amber-200">
          Tarayıcınız Web Speech API'yi desteklemiyor. Lütfen <strong>Chrome</strong> veya <strong>Edge</strong> kullanın, ya da aşağıdan yazarak cevap verebilirsiniz.
        </div>
      )}

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start justify-between gap-2"
          >
            <div className="flex-1">
              <p className="font-medium">Hata:</p>
              <p className="mt-0.5">{error}</p>
              <p className="mt-1 opacity-80">Yazarak cevap vermeye devam edebilirsiniz.</p>
            </div>
            <button onClick={() => setError(null)} className="shrink-0"><X className="h-3 w-3" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-0">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'flex gap-2',
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.sender === 'ai' && (
              <div className={cn('shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold', topic.color)}>
                {topic.icon}
              </div>
            )}
            <div className={cn(
              'max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm',
              msg.sender === 'user'
                ? 'bg-emerald-600 text-white rounded-br-sm'
                : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
            )}>
              <p className="text-sm leading-relaxed" dir="auto">{msg.text}</p>
              {msg.sender === 'ai' && (
                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    onClick={() => replayMessage(msg)}
                    className="text-xs text-emerald-600 hover:text-emerald-800 hover:underline flex items-center gap-0.5"
                  >
                    <Volume2 className="h-3 w-3" /> Tekrar dinle
                  </button>
                  <span className="text-[10px] text-emerald-400">Google TTS</span>
                </div>
              )}
              {msg.tip && msg.tip.trim() && (
                <div className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-800 border border-amber-100">
                  <span className="font-semibold">💡 İpucu: </span>{msg.tip}
                </div>
              )}
            </div>
            {msg.sender === 'user' && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm">
                🧑
              </div>
            )}
          </motion.div>
        ))}

        {/* Live transcript while listening */}
        {phase === 'listening' && liveTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end gap-2"
          >
            <div className="bg-emerald-100 border border-emerald-200 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-emerald-800 italic">
              {liveTranscript}
              <span className="inline-block w-1 h-4 ml-1 bg-emerald-500 animate-pulse align-middle" />
            </div>
            <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm">🧑</div>
          </motion.div>
        )}

        {/* Loading AI */}
        {phase === 'loading-ai' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-2">
            <div className={cn('shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm', topic.color)}>
              {topic.icon}
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 text-xs text-gray-500 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              AI düşünüyor...
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Listening indicator */}
      <AnimatePresence>
        {phase === 'listening' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-2 flex items-center gap-3 rounded-xl bg-red-50 px-3 py-2"
          >
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="w-1 rounded-full bg-red-500"
                  animate={{
                    height: [4, 16 + i * 2, 4],
                  }}
                  transition={{
                    duration: 0.4 + i * 0.05,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                  style={{ height: 4 }}
                />
              ))}
            </div>
            <span className="text-xs font-medium flex-1 text-red-700">
              🎤 Dinleniyor... Almanca konuş
            </span>
            <span className="text-xs text-red-500">
              Bitirmek için mikrofona tekrar bas
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom input area */}
      <div className="border-t border-gray-100 pt-3 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } }}
            placeholder="Yazarak da cevap verebilirsin..."
            disabled={phase !== 'chatting'}
            className="flex-1 h-11 rounded-full border border-gray-200 bg-white px-4 text-sm focus:border-emerald-400 focus:outline-none disabled:opacity-50"
            dir="auto"
          />
          <Button
            onClick={handleSendText}
            disabled={!textInput.trim() || phase !== 'chatting'}
            className="h-11 w-11 p-0 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
            aria-label="Gönder"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={handleMicToggle}
            disabled={
              !browserSupported ||
              quotaExhausted ||
              (phase !== 'chatting' && phase !== 'listening')
            }
            className={cn(
              'relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed',
              phase === 'listening'
                ? 'bg-red-500 hover:bg-red-600'
                : quotaExhausted
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            )}
            aria-label={phase === 'listening' ? 'Kaydı durdur' : 'Konuş'}
            title={
              quotaExhausted
                ? `Kota doldu — ${daysUntilReset} gün sonra yenilenecek`
                : phase === 'listening'
                ? 'Kaydı durdur'
                : 'Almanca konuş'
            }
          >
            {phase === 'listening' ? (
              <Square className="h-6 w-6" fill="currentColor" />
            ) : quotaExhausted ? (
              <Mic className="h-7 w-7 opacity-60" />
            ) : isBusy ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Mic className="h-7 w-7" />
            )}
            {phase === 'listening' && (
              <>
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-white"
                  initial={{ opacity: 0.7, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.8 }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-white"
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 2.2 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                />
              </>
            )}
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {phase === 'listening'
            ? 'Konuşmayı bitirince tekrar bas'
            : quotaExhausted
            ? `🔒 Kota doldu — ${daysUntilReset} gün sonra yenilenecek. Yazarak devam edebilirsin.`
            : phase === 'chatting'
            ? `🎤 Almanca konuşmak için mikrofona bas (Bu ay ${quotaRemaining} / ${speechUsage.monthlyLimit} kalan)`
            : 'İşleniyor...'}
        </p>
      </div>
    </div>
  );
}
