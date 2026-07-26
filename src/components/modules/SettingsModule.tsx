'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Shield, Trash2, Sparkles, AlertTriangle, Mic, Volume2, Calendar, Settings2, Key, Eye, EyeOff, CheckCircle2, Info, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { categories, wordPairs } from '@/lib/german-data';
import { useAppStore, LANGUAGE_OPTIONS, type TargetLanguage } from '@/lib/store';
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

// ===== API Key input field component =====
function ApiKeyField({
  label,
  description,
  placeholder,
  value,
  onChange,
  testUrl,
  testMethod = 'POST',
  testBody,
  testKeyField,
  successHint,
}: {
  label: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  testUrl: string;
  testMethod?: string;
  testBody?: Record<string, unknown>;
  testKeyField?: string;
  successHint?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTest = useCallback(async () => {
    if (!value.trim()) return;
    setTesting(true);
    setTestResult('idle');
    try {
      const body = testBody ? { ...testBody } : {};
      if (testKeyField) {
        body[testKeyField] = value.trim();
      }
      const res = await fetch(testUrl, {
        method: testMethod,
        headers: { 'Content-Type': 'application/json' },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });
      if (res.status === 401 || res.status === 403) {
        setTestResult('error');
      } else {
        setTestResult('success');
      }
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  }, [value, testUrl, testMethod, testBody, testKeyField]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {value.trim() ? (
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px]">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Kayıtlı
          </Badge>
        ) : (
          <Badge variant="outline" className="border-gray-200 text-gray-500 text-[10px]">
            Girilmedi
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-10 rounded-md border border-gray-200 px-3 pr-10 text-sm font-mono focus:border-emerald-400 focus:outline-none"
            placeholder={placeholder}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={testing || !value.trim()}
          className="shrink-0"
        >
          {testing ? 'Test...' : 'Test Et'}
        </Button>
      </div>
      {testResult === 'success' && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {successHint || 'API anahtarı geçerli.'}
        </p>
      )}
      {testResult === 'error' && (
        <p className="text-xs text-red-600">API anahtarı geçersiz veya erişim reddedildi. Lütfen kontrol edin.</p>
      )}
    </div>
  );
}

// ── Tab definition ────────────────────────────────────────────────────────────

const SETTINGS_TABS = [
  { id: 'api', label: 'API Anahtarları', icon: Key },
  { id: 'speech', label: 'Ses Kotası', icon: Mic },
  { id: 'language', label: 'Dil', icon: Globe },
  { id: 'data', label: 'Veri', icon: Shield },
  { id: 'about', label: 'Hakkında', icon: Sparkles },
] as const;

type TabId = (typeof SETTINGS_TABS)[number]['id'];

// ── Component ────────────────────────────────────────────────────────────────

export function SettingsModule() {
  const clearAllData = useAppStore((s) => s.clearAllData);
  const speechUsage = useAppStore((s) => s.speechUsage);
  const setSpeechMonthlyLimit = useAppStore((s) => s.setSpeechMonthlyLimit);
  const hasSpeechQuota = useAppStore((s) => s.hasSpeechQuota);
  const remainingSpeechQuota = useAppStore((s) => s.remainingSpeechQuota);
  const daysUntilSpeechReset = useAppStore((s) => s.daysUntilSpeechReset);
  const targetLanguage = useAppStore((s) => s.targetLanguage);
  const setTargetLanguage = useAppStore((s) => s.setTargetLanguage);

  const apiKeys = useAppStore((s) => s.apiKeys);
  const setApiKey = useAppStore((s) => s.setApiKey);

  const [activeTab, setActiveTab] = useState<TabId>('api');
  const [showConfirm, setShowConfirm] = useState(false);
  const [limitInput, setLimitInput] = useState<string>(String(speechUsage.monthlyLimit));

  const quotaRemaining = remainingSpeechQuota();
  const quotaExhausted = !hasSpeechQuota();
  const daysUntilReset = daysUntilSpeechReset();

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
      setLimitInput(String(speechUsage.monthlyLimit));
    }
  }, [limitInput, setSpeechMonthlyLimit, speechUsage.monthlyLimit]);

  const handleReset = useCallback(() => {
    clearAllData();
    setShowConfirm(false);
    setLimitInput('300');
  }, [clearAllData]);

  // ── Tab content renderers ─────────────────────────────────────────────────

  const renderApiTab = () => (
    <div className="space-y-5">
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">API anahtarları gerekli mi?</p>
            <p>
              Geliştirme ortamında varsayılan anahtarlar kullanılır. Production&apos;da
              kendi API anahtarlarınızı girmeniz gerekir. Anahtarlar yalnızca
              tarayıcınızda localStorage&apos;da saklanır, sunucuya kaydedilmez.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-5">
        <ApiKeyField
          label="Zhipu BigModel API Anahtarı"
          description="GLM-4.5-Air (sohbet), GLM-4-Voice (sesli konuşma) ve GLM-ASR (ses tanıma) için kullanılır. open.bigmodel.cn adresinden alabilirsiniz."
          placeholder="51d6b2bb...z122Ar2NX"
          value={apiKeys.zhipuKey}
          onChange={(v) => setApiKey('zhipuKey', v)}
          testUrl="/api/chat"
          testBody={{ messages: [], systemPrompt: 'test' } as Record<string, unknown>}
          testKeyField="zhipuKey"
          successHint="Zhipu API anahtarı geçerli (sohbet ve sesli konuşma çalışacak)."
        />

        <Separator />

        <ApiKeyField
          label="ElevenLabs API Anahtarı"
          description="Yüksek kaliteli Almanca seslendirme (TTS) için kullanılır. elevenlabs.io adresinden alabilirsiniz. Boş bırakılırsa Google Cloud TTS kullanılır."
          placeholder="sk_6c2fb452...ea43fc99"
          value={apiKeys.elevenLabsKey}
          onChange={(v) => setApiKey('elevenLabsKey', v)}
          testUrl="/api/tts"
          testBody={{ text: 'Hallo' } as Record<string, unknown>}
          testKeyField="elevenLabsKey"
          successHint="ElevenLabs API anahtarı geçerli."
        />

        <Separator />

        <ApiKeyField
          label="Google Cloud TTS API Anahtarı"
          description="Almanca seslendirme için yedek TTS sağlayıcısı. ElevenLabs yoksa veya başarısız olursa kullanılır. Google Cloud Console&apos;dan alabilirsiniz."
          placeholder="AIzaSyDIy8..."
          value={apiKeys.googleTtsKey}
          onChange={(v) => setApiKey('googleTtsKey', v)}
          testUrl="/api/tts"
          testBody={{ text: 'Guten Tag' } as Record<string, unknown>}
          testKeyField="googleTtsKey"
          successHint="Google Cloud TTS API anahtarı geçerli."
        />
      </div>

      <Separator />
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase text-muted-foreground">TTS Sağlayıcı Sırası</span>
        <div className="space-y-2">
          {[
            { name: 'ElevenLabs', desc: 'Birinci tercih · en yüksek kalite', active: !!apiKeys.elevenLabsKey },
            { name: 'Google Cloud TTS', desc: 'İkinci tercih · 4M karakter/ay ücretsiz', active: !!apiKeys.googleTtsKey },
            { name: 'Google Translate TTS', desc: 'Son çare · ücretsiz, düşük kalite', active: true },
          ].map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-slate-600" />
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
              </div>
              <Badge variant="outline" className={p.active ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-400'}>
                {p.active ? 'Aktif' : 'Pasif'}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSpeechTab = () => (
    <div className="space-y-5">
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

      {quotaExhausted && (
        <div className="rounded-lg bg-red-50 p-3 border border-red-200">
          <p className="text-sm text-red-800">
            <strong>Kota doldu.</strong> Bu ay sesli tanıma kullanılamaz.{' '}
            {daysUntilReset} gün sonra otomatik yenilenecek.
            Bu süre içinde <strong>yazarak</strong> cevap vermeye devam edebilirsiniz.
          </p>
        </div>
      )}

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
              Sınırsız
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLanguageTab = () => (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Hedef dil tercihinizi secin</p>
            <p>
              Su an icin yalnizca Turkce ceviriler mevcuttur. Farkli dillerdeki kelimeleri
              &quot;Ozel Kelime Listeleri&quot; modulune manuel olarak ekleyebilirsiniz.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {LANGUAGE_OPTIONS.map((lang) => {
          const isActive = targetLanguage === lang.value;
          return (
            <button
              key={lang.value}
              onClick={() => setTargetLanguage(lang.value)}
              disabled={lang.value !== 'tr'}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium border transition-all',
                isActive
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                lang.value !== 'tr' && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="mr-1.5 font-bold text-xs">{lang.flag}</span>
              {lang.label}
              {lang.value !== 'tr' && (
                <span className="ml-1.5 text-[10px] text-amber-600">yakin</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-4">
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
    </div>
  );

  const renderAboutTab = () => (
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
  );

  const tabContentMap: Record<TabId, () => React.ReactNode> = {
    api: renderApiTab,
    speech: renderSpeechTab,
    language: renderLanguageTab,
    data: renderDataTab,
    about: renderAboutTab,
  };

  return (
    <div className="space-y-5">
      {/* Tab navigation - horizontal scrollable on mobile */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all shrink-0',
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          {tabContentMap[activeTab]()}
        </CardContent>
      </Card>
    </div>
  );
}
