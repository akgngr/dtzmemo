'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Shield, Trash2, Sparkles, AlertTriangle, Mic, Volume2, Calendar, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { categories, wordPairs } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

// Pretty-print a YYYY-MM month string ("2025-07" → "Temmuz 2025")
const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
function formatMonth(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  if (!y || !m) return monthStr;
  return `${MONTH_NAMES_TR[m - 1]} ${y}`;
}

export function SettingsModule() {
  const clearAllData = useAppStore((s) => s.clearAllData);
  const speechUsage = useAppStore((s) => s.speechUsage);
  const setSpeechMonthlyLimit = useAppStore((s) => s.setSpeechMonthlyLimit);
  const hasSpeechQuota = useAppStore((s) => s.hasSpeechQuota);
  const remainingSpeechQuota = useAppStore((s) => s.remainingSpeechQuota);
  const daysUntilSpeechReset = useAppStore((s) => s.daysUntilSpeechReset);

  const [showConfirm, setShowConfirm] = useState(false);
  const [limitInput, setLimitInput] = useState<string>(String(speechUsage.monthlyLimit));

  const quotaRemaining = remainingSpeechQuota();
  const quotaExhausted = !hasSpeechQuota();
  const daysUntilReset = daysUntilSpeechReset();

  // Usage percentage for the progress bar (capped at 100)
  const usedPercent = useMemo(() => {
    if (speechUsage.monthlyLimit <= 0) return 100;
    const used = Math.max(0, speechUsage.monthlyLimit - quotaRemaining);
    return Math.min(100, Math.round((used / speechUsage.monthlyLimit) * 100));
  }, [speechUsage.monthlyLimit, quotaRemaining]);

  const usedCount = Math.max(0, speechUsage.monthlyLimit - quotaRemaining);

  const handleSaveLimit = useCallback(() => {
    const parsed = parseInt(limitInput, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      setSpeechMonthlyLimit(parsed);
    } else {
      // Reset to current on invalid input
      setLimitInput(String(speechUsage.monthlyLimit));
    }
  }, [limitInput, setSpeechMonthlyLimit, speechUsage.monthlyLimit]);

  const handleReset = useCallback(() => {
    clearAllData();
    setShowConfirm(false);
    setLimitInput('300');
  }, [clearAllData]);

  return (
    <div className="space-y-6">
      {/* ===== Google Web Speech API Usage Card ===== */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mic className="h-4 w-4 text-emerald-600" />
            Google Web Speech API Kullanımı
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Sesli tanıma (STT) aylık kotalıdır</p>
                <p>
                  Google&apos;ın ücretsiz Web Speech API&apos;si sınırsız değildir. Mikrofonla her başarılı
                  konuşma bir (1) kredidir. <strong>Seslendirme (TTS)</strong> ise tarayıcıda yerel
                  çalışır ve sınırsızdır. Kota her ayın 1&apos;inde otomatik yenilenir.
                </p>
              </div>
            </div>
          </div>

          {/* Current usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Bu ayki kullanım</span>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  quotaExhausted
                    ? 'border-red-200 text-red-700 bg-red-50'
                    : usedPercent >= 80
                    ? 'border-amber-200 text-amber-700 bg-amber-50'
                    : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                )}
              >
                {quotaExhausted ? '🔴 Kota doldu' : `${usedPercent}% kullanıldı`}
              </Badge>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <span className="text-3xl font-bold text-foreground">{usedCount}</span>
                <span className="text-sm text-muted-foreground"> / {speechUsage.monthlyLimit} tanıma</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-foreground">{quotaRemaining}</span>
                <span className="text-xs text-muted-foreground"> kalan</span>
              </div>
            </div>

            <Progress
              value={usedPercent}
              className={cn(
                'h-2',
                quotaExhausted ? '[&>div]:bg-red-500' : usedPercent >= 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'
              )}
            />

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                Dönem: <strong className="text-foreground">{formatMonth(speechUsage.month)}</strong>
                {' · '}Yenileme: <strong className="text-foreground">{daysUntilReset} gün</strong> sonra
                (her ayın 1&apos;inde)
              </span>
            </div>
          </div>

          {/* Status / Exhausted warning */}
          {quotaExhausted && (
            <div className="rounded-lg bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-800">
                <strong>⚠️ Kota doldu.</strong> Bu ay sesli tanıma kullanılamaz.{' '}
                {daysUntilReset} gün sonra (gelecek ayın 1&apos;inde) otomatik yenilenecek.
                Bu süre içinde <strong>yazarak</strong> cevap vermeye devam edebilirsiniz — yazılı
                modda kota sınırlaması yoktur.
              </p>
            </div>
          )}

          {/* Monthly limit config */}
          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Aylık limit ayarı</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Varsayılan 300. Google&apos;ın pratik ücretsiz kullanım limiti içinde kalmak için
              bu değeri düşürmeniz önerilir. 1-10000 arası bir değer girebilirsiniz.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={10000}
                step={10}
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                className="flex-1 h-10 rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-400 focus:outline-none"
                placeholder="Örn. 300"
              />
              <Button size="sm" onClick={handleSaveLimit} disabled={limitInput === String(speechUsage.monthlyLimit)}>
                Kaydet
              </Button>
              {limitInput !== String(speechUsage.monthlyLimit) && (
                <Button size="sm" variant="outline" onClick={() => setLimitInput(String(speechUsage.monthlyLimit))}>
                  İptal
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {[100, 200, 300, 500].map((v) => (
                <button
                  key={v}
                  onClick={() => { setLimitInput(String(v)); setSpeechMonthlyLimit(v); }}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs border transition-colors',
                    speechUsage.monthlyLimit === v
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {v}/ay
                </button>
              ))}
            </div>
          </div>

          {/* Service breakdown */}
          <Separator />

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Servis bazında durum</span>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium">Sesli Tanıma (STT)</p>
                    <p className="text-xs text-muted-foreground">Google Web Speech API · ücretsiz, kotalı</p>
                  </div>
                </div>
                <Badge variant="outline" className={quotaExhausted ? 'border-red-200 text-red-700 bg-red-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50'}>
                  {quotaExhausted ? 'Doldu' : `${quotaRemaining} kalan`}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium">Seslendirme (TTS)</p>
                    <p className="text-xs text-muted-foreground">Browser SpeechSynthesis · sınırsız</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                  ∞ Sınırsız
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Data Management ===== */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-emerald-600" />
            Veri Yönetimi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Verileriniz otomatik olarak kaydedilir</p>
                <p>Tüm çalışma verileriniz, ilerlemeniz ve ayarlarınız tarayıcınızın localStorage&apos;ına otomatik olarak kaydedilir. Bu sayede uygulamayı kapatsanız bile verileriniz korunur.</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-red-800">Tüm verileri sil</p>
                <p className="text-xs text-red-600 mt-1">
                  Tüm ilerleme, geçmiş ve ayar verilerinizi kalıcı olarak siler. Bu işlem geri alınamaz.
                </p>
                {!showConfirm ? (
                  <Button variant="destructive" size="sm" className="mt-3" onClick={() => setShowConfirm(true)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Verileri Sıfırla
                  </Button>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="destructive" size="sm" onClick={handleReset}>Eminim, Sil</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>İptal</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Hakkında
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Uygulama</span>
              <span className="font-medium text-foreground">DeutschMemo</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Seviye</span>
              <span className="font-medium text-foreground">Almanca B1</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Toplam Kelime</span>
              <span className="font-medium text-foreground">{wordPairs.length}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Toplam Kategori</span>
              <span className="font-medium text-foreground">{categories.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
