'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  PenLine,
  Type,
  GripHorizontal,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  Flame,
  Trophy,
  Sparkles,
  Timer,
  Settings,
  MessageCircle,
  RotateCcw,
  Headphones,
  CircleHelp,
  Award,
  BookOpenText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { categories } from '@/lib/german-data';
import { vocabulary } from '@/lib/vocabulary-data';
import { useAppStore } from '@/lib/store';
import { getCategoryColor } from '@/lib/constants';
import { CategoryFilter } from '@/components/shared/CategoryFilter';

export function Dashboard() {
  const { setActiveModule, streak, todayReviewed, cardProgress } = useAppStore();
  const totalWords = vocabulary.length;
  const totalCategories = categories.length;
  const learnedCount = Object.values(cardProgress).filter((c) => c.correct >= 2).length;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg md:p-8"
      >
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-100">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Almanca B1 Seviyesi</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">DeutschMemo</h1>
          <p className="mt-1 text-emerald-100">Almanca-Türkçe ezberleme uygulaması</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[
          { label: 'Toplam Kelime', value: totalWords, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Kategoriler', value: totalCategories, icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Öğrenilen', value: learnedCount, icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Seri', value: `${streak} gün`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`mb-2 inline-flex rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Today Progress */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Bugünkü İlerleme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex justify-between text-sm">
            <span>Bugün tekrar edilen</span>
            <span className="font-medium">{todayReviewed} kart</span>
          </div>
          <Progress value={Math.min((todayReviewed / 20) * 100, 100)} className="h-3" />
          <p className="mt-1 text-xs text-muted-foreground">
            Günlük hedef: 20 kart
          </p>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Hızlı Başla</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { id: 'flashcards', label: 'Kart Çevir', icon: Layers, desc: 'Aralıklı tekrar', color: 'from-emerald-500 to-emerald-600' },
            { id: 'fill-blank', label: 'Boşluk Doldur', icon: PenLine, desc: 'Kelime yazma', color: 'from-amber-500 to-amber-600' },
            { id: 'word-completion', label: 'Kelime Tamamla', icon: Type, desc: 'Harf eksikleri', color: 'from-rose-500 to-rose-600' },
            { id: 'drag-drop', label: 'Cümle Kur', icon: GripHorizontal, desc: 'Sürükle bırak', color: 'from-purple-500 to-purple-600' },
            { id: 'matching', label: 'Eşleştir', icon: ArrowLeftRight, desc: 'Almanca-Türkçe', color: 'from-teal-500 to-teal-600' },
            { id: 'kelime-ezber', label: 'Kelime Ezber', icon: Sparkles, desc: '502 kelime kartı', color: 'from-fuchsia-500 to-fuchsia-600' },
            { id: 'vocab-explorer', label: 'Kelime Gezgini', icon: BookOpen, desc: '502 kelime', color: 'from-cyan-500 to-cyan-600' },
            { id: 'conversation', label: 'Konuşma', icon: MessageCircle, desc: 'AI ile Almanca sohbet', color: 'from-indigo-500 to-purple-600' },
            { id: 'competition', label: 'Yarışma', icon: Timer, desc: 'Zamana karşı', color: 'from-violet-500 to-violet-600' },
            { id: 'spaced-repetition', label: 'Tekrar', icon: RotateCcw, desc: 'Aralıklı tekrar', color: 'from-blue-500 to-cyan-600' },
            { id: 'listening', label: 'Dinleme', icon: Headphones, desc: 'Dinleyerek öğren', color: 'from-rose-500 to-pink-600' },
            { id: 'reading', label: 'Okuma', icon: BookOpenText, desc: 'Metinleri anla', color: 'from-indigo-500 to-blue-600' },
            { id: 'quiz', label: 'Quiz', icon: CircleHelp, desc: 'Çoktan seçmeli', color: 'from-indigo-500 to-purple-600' },
            { id: 'achievements', label: 'Başarımlar', icon: Award, desc: 'Hedefler & rozetler', color: 'from-amber-500 to-red-500' },
            { id: 'statistics', label: 'İstatistikler', icon: BarChart3, desc: 'İlerleme takibi', color: 'from-orange-500 to-orange-600' },
            { id: 'settings', label: 'Ayarlar', icon: Settings, desc: 'Veri yönetimi', color: 'from-gray-500 to-gray-600' },
          ].map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveModule(item.id)}
              className="group relative overflow-hidden rounded-xl p-4 text-left text-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color}`} />
              <div className="relative z-10">
                <item.icon className="mb-2 h-6 w-6 opacity-90" />
                <div className="font-semibold">{item.label}</div>
                <div className="text-xs opacity-80">{item.desc}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Kategoriler</h2>
        <CategoryFilter />
      </div>

      {/* Recent words preview */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Son Kelimeler</span>
            <Button variant="ghost" size="sm" onClick={() => setActiveModule('flashcards')}>
              Tümünü Gör <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {vocabulary.slice(0, 5).map((wp) => {
              const clr = getCategoryColor(wp.category);
              return (
                <div key={wp.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                  <div className={`h-2 w-2 rounded-full ${clr.bg}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{wp.german}</div>
                    <div className="truncate text-xs text-muted-foreground">{wp.turkish}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
