'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  BookOpen,
  PenLine,
  Type,
  GripHorizontal,
  ArrowLeftRight,
  Timer,
  Target,
  Trophy,
  Flame,
  History,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { categories, wordPairs } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { getCategoryColor, colorMap } from '@/lib/constants';

export function StatisticsModule() {
  const { totalPracticed, correctAnswers, streak, exerciseResults, cardProgress, todayReviewed, exerciseHistory, clearHistory } = useAppStore();
  const [historyPage, setHistoryPage] = useState(1);
  const accuracy = totalPracticed > 0 ? Math.round((correctAnswers / totalPracticed) * 100) : 0;
  const totalWords = wordPairs.length;
  const learnedCount = Object.values(cardProgress).filter((c) => c.correct >= 2).length;
  const notStartedCount = totalWords - Object.keys(cardProgress).length;

  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const catWords = wordPairs.filter((w) => w.category === cat.id);
      const learned = catWords.filter((w) => cardProgress[w.id] && cardProgress[w.id].correct >= 2).length;
      const practiced = catWords.filter((w) => cardProgress[w.id]).length;
      return {
        id: cat.id,
        name: cat.nameTr,
        nameDe: cat.name,
        learned,
        practiced,
        total: catWords.length,
        percent: catWords.length > 0 ? Math.round((learned / catWords.length) * 100) : 0,
      };
    }).filter((c) => c.total > 0);
  }, [cardProgress]);

  const chartData = categoryStats.slice(0, 12);

  const exerciseLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    'fill-blank': { label: 'Boşluk Doldurma', icon: PenLine, color: 'text-amber-600' },
    'word-completion': { label: 'Kelime Tamamlama', icon: Type, color: 'text-rose-600' },
    'drag-drop': { label: 'Sürükle Bırak', icon: GripHorizontal, color: 'text-purple-600' },
    'matching': { label: 'Eşleştirme', icon: ArrowLeftRight, color: 'text-teal-600' },
    'competition': { label: 'Yarışma', icon: Timer, color: 'text-violet-600' },
  };

  const historyPerPage = 10;
  const paginatedHistory = exerciseHistory.slice(0, historyPage * historyPerPage);
  const hasMoreHistory = exerciseHistory.length > historyPage * historyPerPage;

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('tr-TR', { weekday: 'short' });
      const count = exerciseHistory.filter((e) => e.date.startsWith(dateStr)).reduce((sum, e) => sum + e.total, 0);
      days.push({ day: dayLabel, count, date: dateStr });
    }
    return days;
  }, [exerciseHistory]);

  const maxActivity = Math.max(...last7Days.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Toplam Pratik', value: totalPracticed, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Doğruluk', value: `%${accuracy}`, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Öğrenilen', value: `${learnedCount}/${totalWords}`, icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Seri', value: `${streak} gün`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className={`mx-auto mb-2 inline-flex rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kelime İlerlemesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-600">{learnedCount}</div>
              <div className="text-xs text-muted-foreground">Öğrenildi</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-600">{Object.keys(cardProgress).length - learnedCount}</div>
              <div className="text-xs text-muted-foreground">Çalışıldı</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-400">{notStartedCount}</div>
              <div className="text-xs text-muted-foreground">Başlanmadı</div>
            </div>
          </div>
          <Progress value={(learnedCount / totalWords) * 100} className="h-3" />
          <p className="mt-1 text-xs text-muted-foreground text-center">
            Toplam {totalWords} kelimenin %{Math.round((learnedCount / totalWords) * 100)}&apos;ı öğrenildi
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Son 7 Gün Aktivite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-1 h-20">
            {last7Days.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t bg-violet-400 transition-all" style={{ height: `${Math.max((d.count / maxActivity) * 100, 4)}%` }} />
                <span className="text-[9px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-xs text-muted-foreground">Bugün {todayReviewed} kart çalışıldı</div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Alıştırma Sonuçları</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(exerciseResults).length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">Henüz alıştırma yapılmadı</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(exerciseResults).map(([key, val]) => {
                const info = exerciseLabels[key] || { label: key, icon: BookOpen, color: 'text-gray-600' };
                const Icon = info.icon;
                const pct = val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
                      <Icon className={`h-4 w-4 ${info.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{info.label}</span>
                        <span className="text-muted-foreground">{val.correct}/{val.total} ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kategori Bazlı İlerleme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Öğrenildi']} />
                <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.percent >= 80 ? '#10b981' : entry.percent >= 50 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kategori Detayları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto">
            <div className="space-y-1.5">
              {categoryStats.map((cs) => {
                const clr = getCategoryColor(cs.id);
                return (
                  <div key={cs.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors">
                    <div className={`h-3 w-3 rounded-full shrink-0 ${clr.bg}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{cs.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{cs.learned}/{cs.total}</span>
                      </div>
                      <Progress value={cs.percent} className="mt-1 h-1.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-emerald-600" />
              Geçmiş
            </CardTitle>
            {exerciseHistory.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="mr-1 h-3 w-3" /> Sil
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {exerciseHistory.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">Henüz alıştırma geçmişi yok</p>
          ) : (
            <div className="space-y-2">
              {paginatedHistory.map((entry) => {
                const pct = entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0;
                const dateObj = new Date(entry.date);
                const dateStr = dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                const info = exerciseLabels[entry.exercise] || { label: entry.exerciseLabel, icon: BookOpen, color: 'text-gray-600' };
                const Icon = info.icon;
                return (
                  <div key={entry.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-white text-sm font-bold shrink-0 ${
                      pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}>
                      {pct}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${info.color} shrink-0`} />
                        <span className="text-sm font-medium truncate">{entry.exerciseLabel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{dateStr} {timeStr}</span>
                        <span>•</span>
                        <span>{entry.correct}/{entry.total} doğru</span>
                      </div>
                      {entry.categories.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {entry.categories.slice(0, 3).map((catId) => {
                            const cat = categories.find((c) => c.id === catId);
                            if (!cat) return null;
                            const clr = colorMap[cat.color] || colorMap.emerald;
                            return (
                              <Badge key={catId} variant="secondary" className={`text-[10px] px-1.5 py-0 ${clr.light} ${clr.text}`}>
                                {cat.nameTr}
                              </Badge>
                            );
                          })}
                          {entry.categories.length > 3 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{entry.categories.length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Progress value={pct} className="w-16 h-1.5 shrink-0" />
                  </div>
                );
              })}
              {hasMoreHistory && (
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setHistoryPage((p) => p + 1)}>
                  Daha fazla göster ({exerciseHistory.length - paginatedHistory.length} kaldı)
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
