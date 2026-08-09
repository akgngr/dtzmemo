'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, ArrowLeft, Trophy, Clock, MessageSquare,
  Lightbulb, RotateCcw, Home, Mic, Volume2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { conversationTopics, type ConversationTopic } from '@/lib/conversation-topics';
import { useAppStore } from '@/lib/store';
import { useTTS } from '@/hooks/use-tts';
import { ConversationChat, type ConversationSummary } from './ConversationChat';
import { SpeakButton } from '@/components/shared/SpeakButton';
import { cn } from '@/lib/utils';

type Screen = 'topics' | 'chat' | 'summary';

const difficultyColors: Record<string, string> = {
  A2: 'bg-emerald-100 text-emerald-700',
  B1: 'bg-amber-100 text-amber-700',
  B2: 'bg-purple-100 text-purple-700',
};

export function ConversationModule() {
  const { saveExerciseResult, incrementPracticed } = useAppStore();
  const [screen, setScreen] = useState<Screen>('topics');
  const [activeTopic, setActiveTopic] = useState<ConversationTopic | null>(null);
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const tts = useTTS({ lang: 'de-DE' });

  const vorstellungText = useAppStore((s) => s.vorstellungText);

  const handleSelectTopic = useCallback((topic: ConversationTopic) => {
    // Guard: Vorstellung topic requires stored text
    if (topic.id === 'b1-vorstellung' && !vorstellungText.trim()) {
      // Scroll to or switch to settings — just show alert
      alert('Önce Ayarlar > Genel sekmesinden B1 Vorstellung metninizi yazın.');
      return;
    }
    setActiveTopic(topic);
    setSummary(null);
    setScreen('chat');
  }, [vorstellungText]);

  const handleExitChat = useCallback((convSummary: ConversationSummary) => {
    setSummary(convSummary);
    setScreen('summary');
    // Save to global statistics
    saveExerciseResult('conversation', convSummary.userMessageCount, convSummary.messageCount, []);
    // Count each user turn as a "practiced" item
    for (let i = 0; i < convSummary.userMessageCount; i++) {
      incrementPracticed(true);
    }
  }, [saveExerciseResult, incrementPracticed]);

  const handleBackToTopics = useCallback(() => {
    setScreen('topics');
    setActiveTopic(null);
    setSummary(null);
    setShowIntro(false);
  }, []);

  const handleReplayTopic = useCallback(() => {
    if (activeTopic) {
      setSummary(null);
      setScreen('chat');
    }
  }, [activeTopic]);

  // --- Topics selection screen ---
  if (screen === 'topics') {
    return (
      <div className="space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-6 text-white shadow-lg md:p-8"
        >
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-purple-200">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Konuşma Pratiği</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">Almanca Konuş!</h2>
            <p className="mt-2 text-purple-100 max-w-2xl">
              Gerçek hayat durumlarında Almanca pratiği yap. Mikrofona bas, Almanca konuş — yapay zeka seninle sohbet edecek, hatalarını nazikçe düzeltecek.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white border-0 backdrop-blur">🎤 Sesli konuşma</Badge>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur">🔊 AI sesli yanıt</Badge>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur">💡 Anlık düzeltme</Badge>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur">8 gerçek konu</Badge>
            </div>
          </div>
        </motion.div>

        {/* Topic grid */}
        <div>
          <h3 className="mb-3 text-lg font-semibold">Bir konu seç</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {conversationTopics.map((topic, idx) => (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => handleSelectTopic(topic)}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl text-white shadow-sm', topic.color)}>
                    {topic.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h4 className="font-semibold text-gray-900 leading-tight">{topic.titleDe}</h4>
                      <Badge className={cn('text-[10px] px-1.5 py-0', difficultyColors[topic.difficulty])}>
                        {topic.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{topic.titleTr}</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{topic.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                  {topic.id === 'b1-vorstellung' ? (
                    <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" /> Özel metin</span>
                  ) : (
                    <>
                      <span className="flex items-center gap-0.5"><Mic className="h-3 w-3" /> {topic.vocabulary.length} kelime</span>
                      <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" /> {topic.samplePhrases.length} örnek</span>
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tips card */}
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1">İpuçları</p>
                <ul className="space-y-1 text-xs list-disc list-inside opacity-90">
                  <li>Sessiz bir ortamda konuşman tanıma kalitesini artırır</li>
                  <li>Yapay zeka B1 seviyesinde Almanca yanıt verir — basit ve net konuş</li>
                  <li>Gramer hatan olursa "💡 Tipp" olarak nazikçe düzeltilirsin</li>
                  <li>İstersen örnek cümleleri (💡 simgesi) kullanarak başlayabilirsin</li>
                  <li>Konuyu değiştirmek istersen üst köşedeki ✕ ile bitirebilirsin</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Chat screen ---
  if (screen === 'chat' && activeTopic) {
    return (
      <div className="space-y-3">
        <ConversationChat topic={activeTopic} onExit={handleExitChat} />
      </div>
    );
  }

  // --- Summary screen ---
  if (screen === 'summary' && summary && activeTopic) {
    const accuracyPct = summary.messageCount > 0
      ? Math.round((summary.userMessageCount / summary.messageCount) * 100)
      : 0;
    const tipsRate = summary.userMessageCount > 0
      ? Math.round((summary.tipsCount / summary.userMessageCount) * 100)
      : 0;
    // Calculate performance score (higher = better)
    // Base 50 + 30 for participation (≥4 turns) - 20 for high tips rate
    const performanceScore = Math.max(0, Math.min(100,
      50 + Math.min(30, summary.userMessageCount * 6) - Math.min(20, tipsRate / 5)
    ));
    const performanceLabel = performanceScore >= 80 ? 'Harika!' : performanceScore >= 60 ? 'İyi!' : 'Devam et!';
    const performanceColor = performanceScore >= 80 ? 'text-emerald-600' : performanceScore >= 60 ? 'text-amber-600' : 'text-purple-600';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4"
      >
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className={cn('p-6 text-center text-white', activeTopic.color)}>
            <Trophy className="mx-auto mb-3 h-12 w-12" />
            <h2 className="text-2xl font-bold">Konuşma Tamamlandı!</h2>
            <p className="mt-1 text-white/90 text-sm">
              {activeTopic.icon} {summary.topicTitleDe} · {summary.topicTitleTr}
            </p>
          </div>
          <CardContent className="p-6 space-y-4">
            {/* Performance score */}
            <div className="text-center">
              <p className={cn('text-5xl font-bold', performanceColor)}>{performanceScore}</p>
              <p className={cn('text-sm font-semibold', performanceColor)}>{performanceLabel}</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-emerald-50 p-3 text-center">
                <MessageSquare className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                <div className="text-xl font-bold text-emerald-700">{summary.userMessageCount}</div>
                <div className="text-xs text-emerald-600">Senin mesajların</div>
              </div>
              <div className="rounded-lg bg-purple-50 p-3 text-center">
                <MessageCircle className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                <div className="text-xl font-bold text-purple-700">{summary.messageCount}</div>
                <div className="text-xs text-purple-600">Toplam mesaj</div>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-center">
                <Lightbulb className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                <div className="text-xl font-bold text-amber-700">{summary.tipsCount}</div>
                <div className="text-xs text-amber-600">İpucu aldın</div>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <Clock className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                <div className="text-xl font-bold text-blue-700">
                  {Math.floor(summary.durationSec / 60)}:{(summary.durationSec % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-blue-600">Süre</div>
              </div>
            </div>

            <Progress value={performanceScore} className="h-2" />

            {/* Conversation history preview */}
            <div className="rounded-lg border border-gray-100 max-h-72 overflow-y-auto">
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-muted-foreground sticky top-0">
                Sohbet özeti
              </div>
              <div className="p-3 space-y-2">
                {summary.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-2',
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.sender === 'ai' && (
                      <div className={cn('shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs', activeTopic.color)}>
                        {activeTopic.icon}
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[80%] rounded-lg px-2.5 py-1.5 text-xs',
                      msg.sender === 'user'
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-gray-50 text-gray-700'
                    )}>
                      <p dir="auto">{msg.text}</p>
                      {msg.tip && msg.tip.trim() && (
                        <p className="mt-1 text-[10px] text-amber-700">💡 {msg.tip}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleReplayTopic} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                <RotateCcw className="mr-2 h-4 w-4" />
                Aynı konuyu tekrar dene
              </Button>
              <Button onClick={handleBackToTopics} variant="outline" className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Konu seçimine dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Fallback
  return null;
}
