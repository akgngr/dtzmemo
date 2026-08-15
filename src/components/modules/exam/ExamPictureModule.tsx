'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookMarked, ChevronRight, RotateCcw, Lightbulb, CheckCircle,
  Mic, Square, Send, Volume2, X, Loader2, ArrowLeft, Eye, GraduationCap,
  Clock, AlertTriangle, Star, BookOpen, MessageSquare, Award, Sparkles,
} from 'lucide-react';
import { picturePrompts, PicturePrompt } from '@/lib/exam-data';
import { useAppStore } from '@/lib/store';
import { useTTS } from '@/hooks/use-tts';
import { cn } from '@/lib/utils';

type Level = 'beginner' | 'intermediate' | 'pro';
type Phase = 'select-picture' | 'select-level' | 'preparing' | 'analyzing' | 'chatting' | 'listening' | 'loading-ai' | 'ended';
type Sender = 'user' | 'ai';

interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

interface VocabItem {
  word: string;
  article: string;
  meaning: string;
  example: string;
}

interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  tip?: string;
  suggestions?: string[];
  isEnding?: boolean;
  grammarCorrections?: GrammarCorrection[];
}

interface SessionFeedback {
  strengths: string[];
  improvements: string[];
  score: string;
}

interface LevelOption {
  id: Level;
  label: string;
  labelTr: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
}

const LEVELS: LevelOption[] = [
  {
    id: 'beginner', label: 'Başlangıç', labelTr: 'Anfänger', icon: '🟢',
    color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200',
    textColor: 'text-emerald-600',
    description: 'AI seni adım adım yönlendirir, kalıp cümleler ve örnekler gösterir.',
  },
  {
    id: 'intermediate', label: 'Orta', labelTr: 'Mittelstufe', icon: '🟡',
    color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200',
    textColor: 'text-amber-600',
    description: 'AI sadece gerekirse yardım eder, sen bağımsız açıklarsın.',
  },
  {
    id: 'pro', label: 'Sınav', labelTr: 'Prüfung', icon: '🔴',
    color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200',
    textColor: 'text-red-600',
    description: 'Gerçek sınav simülasyonu — AI bir sınav görevlisi gibi davranır.',
  },
];

const PREP_TIME_MAP: Record<Level, number> = { beginner: 60, intermediate: 45, pro: 30 };
const SPEAKING_TIME_MAP: Record<Level, number> = { beginner: 300, intermediate: 180, pro: 120 };

/* ═══ Cache helpers ═══ */
function getDescCache(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem('exam-pic-desc-cache') || '{}'); } catch { return {}; }
}
function saveDescCache(url: string, desc: string) {
  const c = getDescCache(); c[url] = desc;
  localStorage.setItem('exam-pic-desc-cache', JSON.stringify(c));
}

/* ══════════════════════════════════════════════════════════ */
export function ExamPictureModule() {
  const { apiKeys, remainingSpeechQuota, hasSpeechQuota, incrementSpeechUsage, daysUntilSpeechReset } = useAppStore();
  const tts = useTTS();

  const [phase, setPhase] = useState<Phase>('select-picture');
  const [level, setLevel] = useState<Level | null>(null);
  const [selectedPicture, setSelectedPicture] = useState<PicturePrompt | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [fallbackNotice, setFallbackNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [browserSupported, setBrowserSupported] = useState(true);

  /* ── New feature states ── */
  const [prepTimeLeft, setPrepTimeLeft] = useState(0);
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState(0);
  const [speakingTimerActive, setSpeakingTimerActive] = useState(false);
  const [vocabulary, setVocabulary] = useState<VocabItem[]>([]);
  const [showVocabPanel, setShowVocabPanel] = useState(false);
  const [sampleAnswer, setSampleAnswer] = useState('');
  const [sessionFeedback, setSessionFeedback] = useState<SessionFeedback | null>(null);
  const [allCorrections, setAllCorrections] = useState<GrammarCorrection[]>([]);
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SR | null>(null);
  const finalTranscriptRef = useRef('');
  const manualStopRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxDurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAiRef = useRef<ChatMessage | null>(null);
  const levelRef = useRef<Level | null>(null);
  const msgsRef = useRef<ChatMessage[]>([]);
  const imgDescRef = useRef('');
  const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { msgsRef.current = messages; }, [messages]);
  useEffect(() => { imgDescRef.current = imageDescription; }, [imageDescription]);

  const quotaRemaining = remainingSpeechQuota();
  const quotaExhausted = !hasSpeechQuota();

  // Scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, phase, liveTranscript]);

  // Auto-play AI
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.sender !== 'ai' || last === lastAiRef.current) return;
    lastAiRef.current = last;
    tts.speak(last.text).catch(() => {});
  }, [messages, tts]);

  // Browser check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const w = window as any;
      if (!w.SpeechRecognition && !w.webkitSpeechRecognition) setBrowserSupported(false);
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
      if (speakTimerRef.current) clearInterval(speakTimerRef.current);
    };
  }, []);

  /* ═══ Prep Timer ═══ */
  const startPrepTimer = useCallback((lvl: Level) => {
    const total = PREP_TIME_MAP[lvl];
    setPrepTimeLeft(total);
    setPhase('preparing');
    prepTimerRef.current = setInterval(() => {
      setPrepTimeLeft(prev => {
        if (prev <= 1) {
          if (prepTimerRef.current) clearInterval(prepTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /* ═══ Speaking Timer ═══ */
  useEffect(() => {
    if (speakingTimerActive && speakingTimeLeft > 0) {
      speakTimerRef.current = setInterval(() => {
        setSpeakingTimeLeft(prev => {
          if (prev <= 1) {
            setSpeakingTimerActive(false);
            if (speakTimerRef.current) clearInterval(speakTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (speakTimerRef.current) clearInterval(speakTimerRef.current); };
  }, [speakingTimerActive]);

  const startSpeakingTimer = useCallback((lvl: Level) => {
    setSpeakingTimeLeft(SPEAKING_TIME_MAP[lvl]);
    setSpeakingTimerActive(true);
  }, []);

  /* ═══ API Call ═══ */
  const fetchAiReply = useCallback(async (history: ChatMessage[], isFirst: boolean) => {
    setPhase('loading-ai');
    setError(null);
    try {
      const apiMessages = history
        .filter(m => m.id !== 'opener')
        .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

      const res = await fetch('/api/exam-picture-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedPicture!.imageUrl,
          messages: apiMessages,
          level: levelRef.current!,
          imageDescription: imgDescRef.current || undefined,
          isFirstMessage: isFirst,
          zhipuKey: apiKeys.zhipuKey || undefined,
          openaiKey: apiKeys.openaiKey || undefined,
          claudeKey: apiKeys.claudeKey || undefined,
          googleAiKey: apiKeys.googleAiKey || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      const data = await res.json();

      if (data.imageDescription) setImageDescription(data.imageDescription);
      if (isFirst && Array.isArray(data.vocabulary)) setVocabulary(data.vocabulary);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || '...',
        tip: data.tip || '',
        isEnding: Boolean(data.isEnding),
        suggestions: Array.isArray(data.suggestions) && data.suggestions.length > 0 ? data.suggestions : undefined,
        grammarCorrections: Array.isArray(data.grammarCorrections) ? data.grammarCorrections : undefined,
      };

      // Track corrections
      if (aiMsg.grammarCorrections && aiMsg.grammarCorrections.length > 0) {
        setAllCorrections(prev => [...prev, ...aiMsg.grammarCorrections!]);
      }

      setMessages(prev => [...prev, aiMsg]);

      if (aiMsg.isEnding) {
        if (data.sampleAnswer) setSampleAnswer(data.sampleAnswer);
        if (data.sessionFeedback) setSessionFeedback(data.sessionFeedback);
        setSpeakingTimerActive(false);
        setTimeout(() => setPhase('ended'), 1500);
      } else {
        setPhase('chatting');
        // Start speaking timer on first real chat message
        if (isFirst) startSpeakingTimer(levelRef.current!);
      }
    } catch (err) {
      setError((err as Error).message);
      setPhase('chatting');
    }
  }, [selectedPicture, apiKeys, startSpeakingTimer]);

  /* ═══ Start Session ═══ */
  const startSession = useCallback(async (pic: PicturePrompt, lvl: Level) => {
    setSelectedPicture(pic);
    setLevel(lvl);
    setMessages([]);
    setShowHints(false);
    setError(null);
    setVocabulary([]);
    setSampleAnswer('');
    setSessionFeedback(null);
    setAllCorrections([]);
    setShowSampleAnswer(false);
    setShowSummary(true);
    setSpeakingTimerActive(false);

    const cachedDesc = getDescCache()[pic.imageUrl];
    if (cachedDesc) setImageDescription(cachedDesc);

    // Start prep timer first
    startPrepTimer(lvl);

    // Pre-fetch AI analysis during prep time
    try {
      const res = await fetch('/api/exam-picture-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: pic.imageUrl, messages: [], level: lvl, isFirstMessage: true,
          fallbackDescription: pic.description,
          cachedDescription: cachedDesc || undefined,
          zhipuKey: apiKeys.zhipuKey || undefined,
          openaiKey: apiKeys.openaiKey || undefined,
          claudeKey: apiKeys.claudeKey || undefined,
          googleAiKey: apiKeys.googleAiKey || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.imageDescription) {
        setImageDescription(data.imageDescription);
        saveDescCache(pic.imageUrl, data.imageDescription);
      }
      if (data.usedFallback) setFallbackNotice(true); else setFallbackNotice(false);
      if (Array.isArray(data.vocabulary)) setVocabulary(data.vocabulary);

      const opener: ChatMessage = {
        id: 'opener', sender: 'ai',
        text: data.reply || 'Bitte beschreiben Sie dieses Bild.',
        tip: data.tip || '',
        suggestions: Array.isArray(data.suggestions) && data.suggestions.length > 0 ? data.suggestions : undefined,
      };
      setMessages([opener]);

      // Wait for prep timer to finish if still running
      // The prep timer will auto-transition or user can skip
    } catch (err) {
      console.error('[ExamPicture] startSession failed:', err);
      setError((err as Error).message);
      setPhase('select-level');
    }
  }, [apiKeys, startPrepTimer]);

  /* ═══ Skip Prep / Start Chatting ═══ */
  const skipPrepAndChat = useCallback(() => {
    if (prepTimerRef.current) { clearInterval(prepTimerRef.current); prepTimerRef.current = null; }
    setPrepTimeLeft(0);
    setPhase('chatting');
    startSpeakingTimer(levelRef.current!);
  }, [startSpeakingTimer]);

  /* ═══ Send User Message ═══ */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || phase !== 'chatting') return;
    setTextInput('');
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, sender: 'user', text: text.trim() };
    const updated = [...msgsRef.current, userMsg];
    setMessages(updated);
    await fetchAiReply(updated, false);
  }, [phase, fetchAiReply]);

  /* ═══ Speech Recognition ═══ */
  const startListening = useCallback(() => {
    if (quotaExhausted) { setError(`Bu ayki ses tanıma kotan doldu. ${daysUntilSpeechReset()} gün sonra yenilenecek.`); return; }
    tts.stop(); setError(null);
    setLiveTranscript(''); finalTranscriptRef.current = ''; manualStopRef.current = false;
    if (recognitionRef.current) try { recognitionRef.current.abort(); } catch {}

    const w = window as any;
    const ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as SRCtor | undefined;
    if (!ctor) { setBrowserSupported(false); return; }

    const rec = new ctor();
    rec.lang = 'de-DE'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onstart = () => setPhase('listening');
    rec.onresult = (e: SREvent) => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      silenceTimerRef.current = setTimeout(() => { manualStopRef.current = true; try { rec.stop(); } catch {} }, 5000);
      let interim = '', final_ = finalTranscriptRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final_ += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      finalTranscriptRef.current = final_;
      setLiveTranscript((final_ + interim).trim());
    };
    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed') setError('Mikrofon izni reddedildi.');
      else if (e.error === 'no-speech' && !finalTranscriptRef.current.trim()) setError('Ses algılanamadı.');
      else if (e.error !== 'aborted') setError(`Tanıma hatası: ${e.error}`);
      setPhase('chatting');
    };
    rec.onend = () => {
      if (maxDurTimerRef.current) { clearTimeout(maxDurTimerRef.current); maxDurTimerRef.current = null; }
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      const t = finalTranscriptRef.current.trim();
      if (t) { incrementSpeechUsage(); sendMessage(t); }
      else if (manualStopRef.current) setPhase('chatting');
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      maxDurTimerRef.current = setTimeout(() => { manualStopRef.current = true; try { rec.stop(); } catch {} }, 30_000);
    } catch { setError('Dinleme başlatılamadı.'); setPhase('chatting'); }
  }, [tts, quotaExhausted, daysUntilSpeechReset, incrementSpeechUsage, sendMessage]);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (maxDurTimerRef.current) { clearTimeout(maxDurTimerRef.current); maxDurTimerRef.current = null; }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
  }, []);

  const handleMicToggle = useCallback(() => {
    if (phase === 'listening') stopListening();
    else if (phase === 'chatting') startListening();
  }, [phase, startListening, stopListening]);

  const reset = useCallback(() => {
    if (recognitionRef.current) try { recognitionRef.current.abort(); } catch {}
    if (prepTimerRef.current) { clearInterval(prepTimerRef.current); prepTimerRef.current = null; }
    if (speakTimerRef.current) { clearInterval(speakTimerRef.current); speakTimerRef.current = null; }
    tts.stop();
    setSpeakingTimerActive(false);
    setPrepTimeLeft(0);
    setSpeakingTimeLeft(0);
    setPhase(selectedPicture ? 'select-level' : 'select-picture');
    setMessages([]); setImageDescription(''); setLevel(null); setError(null); setFallbackNotice(false);
    setVocabulary([]); setSampleAnswer(''); setSessionFeedback(null); setAllCorrections([]);
  }, [selectedPicture, tts]);

  const lastAiMsg = messages[messages.length - 1];
  const lastSuggestions = lastAiMsg?.sender === 'ai' && lastAiMsg.suggestions?.length ? lastAiMsg.suggestions : undefined;
  const userMessageCount = messages.filter(m => m.sender === 'user').length;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const speakTimePercent = level ? (speakingTimeLeft / SPEAKING_TIME_MAP[level]) * 100 : 0;

  /* ═══════════════ RENDER ═════════════ */

  // ─── Phase: Preparing (prep timer) ───
  if (phase === 'preparing' && selectedPicture && level) {
    const prepTotal = PREP_TIME_MAP[level];
    const prepPercent = (prepTimeLeft / prepTotal) * 100;
    return (
      <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)]">
        <div className="shrink-0 rounded-xl bg-violet-600 p-3 text-white shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-14 rounded-lg overflow-hidden bg-black/20 shrink-0">
                <img src={selectedPicture.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold leading-tight truncate">Hazırlık Süresi</h2>
                <p className="text-xs opacity-90">Resmi inceleyin ve düşüncelerinizi toplayın</p>
              </div>
            </div>
            <button onClick={reset} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors" title="Geri">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
          {/* Timer circle */}
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="6" />
              <circle cx="60" cy="60" r="54" fill="none" stroke={prepTimeLeft <= 10 ? '#ef4444' : '#8b5cf6'}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - prepPercent / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-3xl font-bold tabular-nums', prepTimeLeft <= 10 ? 'text-red-500' : 'text-violet-700')}>
                {prepTimeLeft}
              </span>
              <span className="text-xs text-gray-500">saniye</span>
            </div>
          </div>

          <div className="text-center max-w-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Resmi dikkatlice inceleyin:</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>• Vordergrund (Ön plan) — Ne görüyorsunuz?</p>
              <p>• Hintergrund (Arka plan) — Neler var?</p>
              <p>• Personen — Kimler, ne yapıyorlar?</p>
              <p>• Stimmung — Atmosfer nasıl?</p>
            </div>
          </div>

          {/* Image preview */}
          <div className="w-full max-w-md rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <img src={selectedPicture.imageUrl} alt={selectedPicture.title}
              className="w-full max-h-[30vh] object-contain bg-gray-50" />
          </div>

          <button onClick={skipPrepAndChat}
            className="flex items-center gap-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 text-sm font-medium shadow-md transition-all hover:scale-105">
            <MessageSquare className="h-4 w-4" />
            {prepTimeLeft > 0 ? 'Hazırlığı Atla, Başla' : 'Başla'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Phase 1: Select Picture ───
  if (phase === 'select-picture') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 p-5 border border-violet-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <Eye className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-violet-900">Bildbeschreibung</h2>
              <p className="text-xs text-violet-500">Resim Tanımlama — AI Destekli B1 Hazırlık</p>
            </div>
          </div>
          <p className="text-sm text-violet-700 leading-relaxed">
            Bir resim seçin. AI resmi analiz edip size uygun seviyede rehberlik edecek.
            Hazırlık süresi, dilbilgisi düzeltmeleri, oturum özeti ve örnek cevap dahil!
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <Clock className="h-4 w-4" />, label: 'Hazırlık Süresi', desc: 'Seviyeye göre geri sayım' },
            { icon: <AlertTriangle className="h-4 w-4" />, label: 'Dilbilgisi Kontrolü', desc: 'Anlık hata düzeltme' },
            { icon: <Award className="h-4 w-4" />, label: 'Oturum Özeti', desc: 'Detaylı değerlendirme' },
            { icon: <BookOpen className="h-4 w-4" />, label: 'Örnek Cevap', desc: 'Model bildbeschreibung' },
          ].map((f, i) => (
            <div key={i} className="rounded-xl bg-white border border-gray-100 p-3 flex items-start gap-2">
              <div className="text-violet-500 mt-0.5">{f.icon}</div>
              <div><p className="text-xs font-semibold text-gray-800">{f.label}</p><p className="text-[10px] text-gray-400">{f.desc}</p></div>
            </div>
          ))}
        </div>

        <div className="grid gap-3">
          {picturePrompts.map((p, i) => (
            <motion.button key={p.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              onClick={() => { setSelectedPicture(p); setPhase('select-level'); }}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 hover:border-violet-300 hover:shadow-md transition-all text-left group"
            >
              <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 text-sm">{p.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{p.titleTr}</p>
                <p className="text-[11px] text-violet-500 mt-1">En az {p.minSentences} cümle · {p.guidedQuestions.length} rehber soru</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-violet-400 shrink-0" />
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Phase 2: Select Level ───
  if (phase === 'select-level' && selectedPicture) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-violet-600 p-3 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setPhase('select-picture')} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">{selectedPicture.title}</h2>
              <p className="text-xs opacity-80">{selectedPicture.titleTr}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <img src={selectedPicture.imageUrl} alt={selectedPicture.title} className="w-full max-h-[35vh] object-contain bg-gray-50" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2">Seviye Seçin</h3>
          <div className="grid gap-2">
            {LEVELS.map((l, i) => (
              <motion.button key={l.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                onClick={() => startSession(selectedPicture, l.id)}
                className={cn('rounded-xl border-2 p-4 text-left transition-all hover:shadow-md',
                  l.borderColor, l.bgColor
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{l.icon}</span>
                  <span className={cn('font-bold text-sm', l.color)}>{l.label}</span>
                  <span className="text-xs text-gray-400">{l.labelTr}</span>
                </div>
                <p className="text-xs text-gray-600">{l.description}</p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Hazırlık: {PREP_TIME_MAP[l.id]}sn</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Konuşma: {Math.floor(SPEAKING_TIME_MAP[l.id] / 60)}dk</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Phase: Analyzing ───
  if (phase === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center">
            <Eye className="h-8 w-8 text-violet-500" />
          </div>
          <motion.div className="absolute inset-0 rounded-full border-2 border-violet-400"
            animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        <p className="text-sm font-medium text-violet-700">AI resmi analiz ediyor...</p>
        <p className="text-xs text-gray-400">Resim içeriğine göre yönlendirme hazırlanıyor</p>
      </div>
    );
  }

  // ─── Chat Interface ───
  const isBusy = phase === 'listening' || phase === 'loading-ai';
  const levelInfo = LEVELS.find(l => l.id === level);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="shrink-0 rounded-xl bg-violet-600 p-3 text-white shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-14 rounded-lg overflow-hidden bg-black/20 shrink-0">
              {selectedPicture && <img src={selectedPicture.imageUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold leading-tight truncate">{selectedPicture?.title} · Bildbeschreibung</h2>
              <p className="text-xs opacity-90 truncate">{levelInfo?.label} ({levelInfo?.labelTr})</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {fallbackNotice && (
              <span className="text-[10px] bg-amber-400/40 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">⚠️ Metin bazlı</span>
            )}
            {/* Speaking timer in header */}
            {speakingTimerActive && (
              <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold tabular-nums',
                speakingTimeLeft <= 30 ? 'bg-red-500/80' : 'bg-white/20'
              )}>
                <Clock className="h-3 w-3" />
                {formatTime(speakingTimeLeft)}
              </div>
            )}
            {/* Vocab button */}
            {vocabulary.length > 0 && (
              <button onClick={() => setShowVocabPanel(v => !v)}
                className={cn('h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors', showVocabPanel && 'bg-white/20')}
                title="Kelime Paneli">
                <BookOpen className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setShowHints(v => !v)} className={cn('h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors', showHints && 'bg-white/20')} title="İpuçları">
              <Lightbulb className="h-4 w-4" />
            </button>
            <button onClick={reset} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors" title="Kapat">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Speaking time bar */}
        {speakingTimerActive && (
          <div className="mt-2 h-1 rounded-full bg-white/20 overflow-hidden">
            <motion.div className={cn('h-full rounded-full transition-colors', speakingTimeLeft <= 30 ? 'bg-red-400' : 'bg-white/60')}
              initial={{ width: '100%' }} animate={{ width: `${speakTimePercent}%` }} transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>

      {/* Vocabulary Panel */}
      <AnimatePresence>
        {showVocabPanel && vocabulary.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden shrink-0"
          >
            <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-800">Resim Kelimeleri</span>
                  <span className="text-[10px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full">{vocabulary.length}</span>
                </div>
                <button onClick={() => setShowVocabPanel(false)} className="text-blue-400 hover:text-blue-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {vocabulary.map((v, i) => (
                  <button key={i} onClick={() => tts.speak(v.word)}
                    className="group flex items-center gap-1 rounded-lg bg-white border border-blue-100 px-2.5 py-1.5 text-left hover:bg-blue-100 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-semibold text-blue-900">{v.article} <span className="group-hover:text-blue-600">{v.word}</span></span>
                      {v.meaning && <span className="text-[10px] text-blue-500 ml-1.5">{v.meaning}</span>}
                    </div>
                    <Volume2 className="h-3 w-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline image */}
      <AnimatePresence>
        {showHints && selectedPicture && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden shrink-0"
          >
            <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 relative">
              <img src={selectedPicture.imageUrl} alt={selectedPicture.title}
                className="w-full max-h-[50vh] object-contain bg-gray-50" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3 flex items-end justify-between">
                <p className="text-white/90 text-xs truncate">{selectedPicture.title} — {selectedPicture.titleTr}</p>
                <button onClick={() => setShowHints(false)}
                  className="flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/30 px-2 py-1 text-white text-[11px] transition-colors">
                  <X className="h-3 w-3" /> Kapat
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="shrink-0 mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start justify-between gap-2 border border-red-200"
          >
            <p className="flex-1">{error}</p>
            <button onClick={() => setError(null)}><X className="h-3 w-3" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-0">
        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={cn('flex gap-2', msg.sender === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.sender === 'ai' && (
              <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold bg-violet-500">
                <GraduationCap className="h-4 w-4" />
              </div>
            )}
            <div className={cn(
              'max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm',
              msg.sender === 'user' ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
            )}>
              <p className="text-sm leading-relaxed" dir="auto">{msg.text}</p>
              {msg.sender === 'ai' && (
                <div className="mt-1.5 flex items-center gap-2">
                  <button onClick={() => tts.speak(msg.text)} className="text-xs text-violet-600 hover:underline flex items-center gap-0.5">
                    <Volume2 className="h-3 w-3" /> Tekrar dinle
                  </button>
                </div>
              )}
              {/* Grammar Corrections — shown under AI messages */}
              {msg.sender === 'ai' && msg.grammarCorrections && msg.grammarCorrections.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Düzeltmeler</p>
                  {msg.grammarCorrections.map((gc, i) => (
                    <div key={i} className="rounded-lg bg-orange-50 border border-orange-100 px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="line-through text-red-500">{gc.original}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-semibold text-green-700">{gc.corrected}</span>
                      </div>
                      {gc.explanation && <p className="text-[10px] text-orange-600 mt-0.5">{gc.explanation}</p>}
                    </div>
                  ))}
                </div>
              )}
              {msg.tip && (
                <div className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-800 border border-amber-100">
                  <span className="font-semibold">💡 </span>{msg.tip}
                </div>
              )}
              {msg.suggestions && msg.suggestions.length > 0 && level === 'beginner' && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.suggestions.map((s, i) => (
                    <button key={i} onClick={() => setTextInput(s)}
                      className="rounded-full bg-violet-50 border border-violet-100 px-2.5 py-1 text-[11px] text-violet-700 hover:bg-violet-100 transition-colors"
                    >{s}</button>
                  ))}
                </div>
              )}
            </div>
            {msg.sender === 'user' && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm">🧑</div>
            )}
          </motion.div>
        ))}

        {/* Live transcript */}
        {phase === 'listening' && liveTranscript && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end gap-2">
            <div className="bg-violet-100 border border-violet-200 rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-violet-800 italic">
              {liveTranscript}
              <span className="inline-block w-1 h-4 ml-1 bg-violet-500 animate-pulse align-middle" />
            </div>
            <div className="shrink-0 w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm">🧑</div>
          </motion.div>
        )}

        {/* Loading */}
        {phase === 'loading-ai' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-2">
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white bg-violet-500">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 text-xs text-gray-500 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> AI düşünüyor...
            </div>
          </motion.div>
        )}

        {/* Ended — Session Summary */}
        {phase === 'ended' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Main completion card */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <div className="flex justify-center mb-2">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
              </div>
              <h3 className="font-bold text-emerald-900 mb-1">Oturum Tamamlandı!</h3>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {userMessageCount} mesaj</span>
                {allCorrections.length > 0 && (
                  <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> {allCorrections.length} düzeltme</span>
                )}
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={reset} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
                  <RotateCcw className="h-3.5 w-3.5" /> Yeniden Başla
                </button>
                <button onClick={() => { setPhase('select-level'); setMessages([]); setImageDescription(''); setLevel(null); }}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium bg-violet-600 text-white hover:bg-violet-700">
                  <BookMarked className="h-3.5 w-3.5" /> Seviye Değiştir
                </button>
              </div>
            </div>

            {/* Session Feedback */}
            {sessionFeedback && showSummary && (
              <div className="rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
                <button onClick={() => setShowSummary(v => !v)}
                  className="flex items-center justify-between w-full text-left mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    <span className="text-sm font-bold text-violet-900">Değerlendirme</span>
                    {sessionFeedback.score && (
                      <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">{sessionFeedback.score}</span>
                    )}
                  </div>
                </button>

                {sessionFeedback.strengths.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Star className="h-3 w-3" /> Güçlü Yönler
                    </p>
                    <div className="space-y-1">
                      {sessionFeedback.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <span className="text-emerald-500 mt-0.5">✓</span>{s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sessionFeedback.improvements.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Geliştirilebilir
                    </p>
                    <div className="space-y-1">
                      {sessionFeedback.improvements.map((s, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <span className="text-amber-500 mt-0.5">→</span>{s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Corrections Summary */}
            {allCorrections.length > 0 && (
              <div className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  Yapılan Düzeltmeler ({allCorrections.length})
                </p>
                <div className="space-y-1.5">
                  {allCorrections.map((gc, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-orange-50 rounded-lg px-2.5 py-1.5 border border-orange-100">
                      <span className="line-through text-red-500 font-medium">{gc.original}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-semibold text-green-700">{gc.corrected}</span>
                      {gc.explanation && <span className="text-[10px] text-orange-500 ml-auto hidden sm:inline">{gc.explanation}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Answer */}
            {sampleAnswer && (
              <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
                <button onClick={() => setShowSampleAnswer(v => !v)}
                  className="flex items-center justify-between w-full text-left">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-bold text-blue-900">Örnek Bildbeschreibung</span>
                  </div>
                  <span className={cn('text-xs text-blue-500 transition-transform', showSampleAnswer && 'rotate-180')}>▼</span>
                </button>
                <AnimatePresence>
                  {showSampleAnswer && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-blue-100">
                        <p className="text-sm text-gray-700 leading-relaxed" dir="auto">{sampleAnswer}</p>
                        <button onClick={() => tts.speak(sampleAnswer)}
                          className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                          <Volume2 className="h-3.5 w-3.5" /> Örnek cevabı dinle
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Listening indicator */}
      <AnimatePresence>
        {phase === 'listening' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="shrink-0 mb-2 flex items-center gap-3 rounded-xl bg-red-50 px-3 py-2"
          >
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <motion.span key={i} className="w-1 rounded-full bg-red-500"
                  animate={{ height: [4, 16 + i * 2, 4] }}
                  transition={{ duration: 0.4 + i * 0.05, repeat: Infinity, repeatType: 'reverse' }}
                  style={{ height: 4 }}
                />
              ))}
            </div>
            <span className="text-xs font-medium flex-1 text-red-700">🎤 Dinleniyor...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom input */}
      {phase !== 'ended' && (
        <div className="shrink-0 border-t border-gray-100 pt-3 space-y-1">
          {lastSuggestions && (
            <div className="flex flex-wrap gap-1 px-1">
              {lastSuggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}
                  className="rounded-full bg-violet-50 border border-violet-100 px-2.5 py-1 text-[11px] text-violet-700 hover:bg-violet-100 transition-colors"
                >{s}</button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(textInput); } }}
              placeholder="Almanca yazarak cevap ver..." disabled={isBusy}
              className="flex-1 h-11 rounded-full border border-gray-200 bg-white px-4 text-sm focus:border-violet-400 focus:outline-none disabled:opacity-50"
              dir="auto"
            />
            <button onClick={handleMicToggle}
              disabled={!browserSupported || quotaExhausted || (phase !== 'chatting' && phase !== 'listening')}
              className={cn(
                'relative flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shrink-0',
                phase === 'listening' ? 'bg-red-500' : 'bg-violet-600'
              )}
            >
              {phase === 'listening' ? <Square className="h-5 w-5" fill="currentColor" /> : <Mic className="h-5 w-5" />}
            </button>
            <button onClick={() => sendMessage(textInput)} disabled={!textInput.trim() || isBusy}
              className="h-11 w-11 p-0 rounded-full bg-violet-600 hover:bg-violet-700 text-white shrink-0 disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground">
            {phase === 'listening' ? '🎤 Dinleniyor... 5sn sessizlik = otomatik durdur'
              : quotaExhausted ? '🔒 Kota doldu — yazarak devam edebilirsin'
              : `🎤 ${quotaRemaining}/${(useAppStore.getState() as any).speechUsage?.monthlyLimit || 50} kalan · Mikrofon veya yazı ile cevap ver`}
          </p>
        </div>
      )}
    </div>
  );
}
