'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Shield, Trash2, Sparkles, AlertTriangle, Mic, Volume2, Calendar, Settings2, Key, Eye, EyeOff, CheckCircle2, Info, Globe, FolderPlus, Download, Upload, FileJson, FileText, Copy, Check, Plus, X, BookOpen, Pencil, ChevronRight, Database, HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { categories, wordPairs } from '@/lib/german-data';
import { useAppStore, type CustomWordList, type CustomWord } from '@/lib/store';
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

// ===== CSV/JSON Helpers =====
function hasTurkishSpecialChars(str: string): boolean {
  return /[şığüşçöİŞĞÜŞÇÖ]/.test(str);
}
function looksLikeHeader(first: string, second: string): boolean {
  const headerKeywords = ['german', 'turkish', 'almanca', 'türkçe', 'deutsch', 'de', 'tr', 'kelime', 'word', 'çeviri', 'translation'];
  const combined = (first + ' ' + second).toLowerCase();
  return headerKeywords.some((k) => combined.includes(k));
}
function parseCSV(content: string): CustomWord[] {
  let cleaned = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleaned.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  let startIndex = 0;
  if (lines.length > 1) {
    const parts = lines[0].split(',').map((s) => s.trim());
    if (parts.length >= 2 && looksLikeHeader(parts[0], parts[1])) startIndex = 1;
  }
  const words: CustomWord[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const p = lines[i].split(',').map((s) => s.trim());
    if (p.length >= 2 && p[0] && p[1]) words.push({ german: p[0], turkish: p[1] });
  }
  return words;
}

function buildCSV(list: CustomWordList): string {
  const header = 'Almanca,Türkçe';
  const rows = list.words.map((w) => `${w.german},${w.turkish}`).join('\n');
  return `${header}\n${rows}`;
}

function buildJSON(list: CustomWordList): string {
  return JSON.stringify({ name: list.name, description: list.description, words: list.words }, null, 2);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ===== Sample data for examples =====
const SAMPLE_CSV = `Almanca,Türkçe
Apfel,Elma
Haus,Ev
Buch,Kitap
Schule,Okul
Lehrer,Öğretmen
Fenster,Pencere
Tisch,Masa
Stuhl,Sandalye`;

const SAMPLE_JSON = JSON.stringify({
  name: "Örnek Liste",
  description: "Bu bir örnek kelime listesidir",
  words: [
    { german: "Guten Morgen", turkish: "Günaydın" },
    { german: "Auf Wiedersehen", turkish: "Hoşça kal" },
    { german: "Danke schön", turkish: "Çok teşekkürler" },
    { german: "Bitte schön", turkish: "Rica ederim" },
    { german: "Entschuldigung", turkish: "Özür dilerim" }
  ]
}, null, 2);

// ===== API Key input field component =====
function ApiKeyField({
  label, description, placeholder, value, onChange, testUrl, testMethod = 'POST', testBody, testKeyField, successHint,
}: {
  label: string; description: string; placeholder: string; value: string; onChange: (v: string) => void;
  testUrl: string; testMethod?: string; testBody?: Record<string, unknown>; testKeyField?: string; successHint?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTest = useCallback(async () => {
    if (!value.trim()) return;
    setTesting(true); setTestResult('idle');
    try {
      const body = testBody ? { ...testBody } : {};
      if (testKeyField) body[testKeyField] = value.trim();
      const res = await fetch(testUrl, { method: testMethod, headers: { 'Content-Type': 'application/json' }, body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined });
      if (res.status === 401 || res.status === 403) setTestResult('error'); else setTestResult('success');
    } catch { setTestResult('error'); } finally { setTesting(false); }
  }, [value, testUrl, testMethod, testBody, testKeyField]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {value.trim() ? (
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px]"><CheckCircle2 className="mr-1 h-3 w-3" /> Kayıtlı</Badge>
        ) : (
          <Badge variant="outline" className="border-gray-200 text-gray-500 text-[10px]">Girilmedi</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input type={visible ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-10 rounded-md border border-gray-200 px-3 pr-10 text-sm font-mono focus:border-emerald-400 focus:outline-none" placeholder={placeholder} autoComplete="off" />
          <button type="button" onClick={() => setVisible(!visible)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button size="sm" variant="outline" onClick={handleTest} disabled={testing || !value.trim()} className="shrink-0">
          {testing ? 'Test...' : 'Test Et'}
        </Button>
      </div>
      {testResult === 'success' && <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{successHint || 'API anahtarı geçerli.'}</p>}
      {testResult === 'error' && <p className="text-xs text-red-600">API anahtarı geçersiz veya erişim reddedildi.</p>}
    </div>
  );
}

// ── Tab definition ────────────────────────────────────────────────────────────
const SETTINGS_TABS = [
  { id: 'general', label: 'Genel', icon: Settings2 },
  { id: 'api', label: 'API Anahtarları', icon: Key },
  { id: 'speech', label: 'Ses Kotası', icon: Mic },
  { id: 'words', label: 'Sözlüklerim', icon: FolderPlus },
  { id: 'data', label: 'Veri Yönetimi', icon: Database },
  { id: 'about', label: 'Hakkında', icon: Sparkles },
] as const;

type TabId = (typeof SETTINGS_TABS)[number]['id'];

// ── Component ────────────────────────────────────────────────────────────────
export function SettingsModule() {
  const store = useAppStore();
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
  const customWordLists = useAppStore((s) => s.customWordLists);
  const addCustomWordList = useAppStore((s) => s.addCustomWordList);
  const deleteCustomWordList = useAppStore((s) => s.deleteCustomWordList);
  const updateCustomWordList = useAppStore((s) => s.updateCustomWordList);

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [showConfirm, setShowConfirm] = useState(false);
  const [limitInput, setLimitInput] = useState(String(speechUsage.monthlyLimit));

  // Sözlüklerim state
  const [wordScreen, setWordScreen] = useState<'lists' | 'detail'>('lists');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newWordGerman, setNewWordGerman] = useState('');
  const [newWordTurkish, setNewWordTurkish] = useState('');
  const [editingListName, setEditingListName] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Veri Yönetimi state
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const quotaRemaining = remainingSpeechQuota();
  const quotaExhausted = !hasSpeechQuota();
  const daysUntilReset = daysUntilSpeechReset();
  const usedPercent = useMemo(() => {
    if (speechUsage.monthlyLimit <= 0) return 100;
    return Math.min(100, Math.round(((speechUsage.monthlyLimit - quotaRemaining) / speechUsage.monthlyLimit) * 100));
  }, [speechUsage.monthlyLimit, quotaRemaining]);
  const usedCount = Math.max(0, speechUsage.monthlyLimit - quotaRemaining);

  const selectedList = customWordLists.find((l) => l.id === selectedListId);

  const handleSaveLimit = useCallback(() => {
    const parsed = parseInt(limitInput, 10);
    if (Number.isFinite(parsed) && parsed > 0) setSpeechMonthlyLimit(parsed);
    else setLimitInput(String(speechUsage.monthlyLimit));
  }, [limitInput, setSpeechMonthlyLimit, speechUsage.monthlyLimit]);

  const handleReset = useCallback(() => {
    clearAllData(); setShowConfirm(false); setLimitInput('300');
  }, [clearAllData]);

  // ── Word list handlers ──
  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const list: CustomWordList = {
      id: `cwl-${Date.now()}`,
      name: newListName.trim(),
      description: '',
      words: [], createdAt: new Date().toISOString(), category: 'Özel',
    };
    addCustomWordList(list);
    setNewListName('');
  };

  const handleAddWord = () => {
    if (!selectedListId || !newWordGerman.trim() || !newWordTurkish.trim()) return;
    const list = customWordLists.find((l) => l.id === selectedListId);
    if (!list) return;
    updateCustomWordList(selectedListId, {
      words: [...list.words, { german: newWordGerman.trim(), turkish: newWordTurkish.trim() }],
    });
    setNewWordGerman(''); setNewWordTurkish('');
  };

  const handleDeleteWord = (wordIndex: number) => {
    if (!selectedListId || !selectedList) return;
    updateCustomWordList(selectedListId, { words: selectedList.words.filter((_, i) => i !== wordIndex) });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        let words: CustomWord[] = [];
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          const w = Array.isArray(data) ? data : data.words;
          if (Array.isArray(w)) words = w.filter((x: any) => x.german && x.turkish).map((x: any) => ({ german: x.german, turkish: x.turkish }));
        } else {
          words = parseCSV(content);
        }
        if (words.length === 0) {
          setImportStatus({ type: 'error', msg: 'Dosyada geçerli kelime bulunamadı.' }); return;
        }
        const list: CustomWordList = {
          id: `cwl-${Date.now()}`,
          name: file.name.replace(/\.[^.]+$/, ''),
          description: `${words.length} kelime içe aktarıldı`,
          words, createdAt: new Date().toISOString(), category: 'İçe Aktarma',
        };
        addCustomWordList(list);
        setImportStatus({ type: 'success', msg: `${words.length} kelime başarıyla içe aktarıldı!` });
      } catch {
        setImportStatus({ type: 'error', msg: 'Dosya okunamadı. Lütfen formatı kontrol edin.' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Tab content renderers ─────────────────────────────────────────────────

  const renderGeneralTab = () => (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Uygulama Ayarları</p>
            <p>DeutschMemo uygulamanızın genel ayarlarını buradan yönetebilirsiniz. API anahtarları, ses kotası, sözlükleriniz ve veri yönetimi için ilgili sekmelere geçin.</p>
          </div>
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Hızlı Erişim</span>
        <div className="grid grid-cols-2 gap-2">
          {SETTINGS_TABS.filter(t => t.id !== 'general').map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-left">
                <Icon className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{tab.label}</span>
                <ChevronRight className="h-3.5 w-3.5 ml-auto text-gray-400" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderApiTab = () => (
    <div className="space-y-5">
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">API anahtarları gerekli mi?</p>
            <p>Geliştirme ortamında varsayılan anahtarlar kullanılır. Production&apos;da kendi API anahtarlarınızı girmeniz gerekir. Anahtarlar yalnızca tarayıcınızda saklanır.</p>
          </div>
        </div>
      </div>
      <Separator />
      <div className="space-y-5">
        <ApiKeyField label="Zhipu BigModel API Anahtarı" description="GLM-4.5-Air (sohbet) ve GLM-4-Voice (sesli konuşma) için." placeholder="51d6b2bb..." value={apiKeys.zhipuKey} onChange={(v) => setApiKey('zhipuKey', v)} testUrl="/api/chat" testBody={{ messages: [], systemPrompt: 'test' } as Record<string, unknown>} testKeyField="zhipuKey" successHint="Zhipu API anahtarı geçerli." />
        <Separator />
        <ApiKeyField label="ElevenLabs API Anahtarı" description="Yüksek kaliteli Almanca seslendirme (TTS) için." placeholder="sk_6c2fb452..." value={apiKeys.elevenLabsKey} onChange={(v) => setApiKey('elevenLabsKey', v)} testUrl="/api/tts" testBody={{ text: 'Hallo' } as Record<string, unknown>} testKeyField="elevenLabsKey" successHint="ElevenLabs API anahtarı geçerli." />
        <Separator />
        <ApiKeyField label="Google Cloud TTS API Anahtarı" description="Almanca seslendirme için yedek TTS sağlayıcısı." placeholder="AIzaSyDIy8..." value={apiKeys.googleTtsKey} onChange={(v) => setApiKey('googleTtsKey', v)} testUrl="/api/tts" testBody={{ text: 'Guten Tag' } as Record<string, unknown>} testKeyField="googleTtsKey" successHint="Google Cloud TTS API anahtarı geçerli." />
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
              <div className="flex items-center gap-2"><Volume2 className="h-4 w-4 text-slate-600" /><div><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.desc}</p></div></div>
              <Badge variant="outline" className={p.active ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-400'}>{p.active ? 'Aktif' : 'Pasif'}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSpeechTab = () => (
    <div className="space-y-5">
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-start gap-3"><AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" /><div className="text-sm text-blue-800"><p className="font-medium mb-1">Sesli tanıma (STT) aylık kotalıdır</p><p>Google Web Speech API sınırsız değildir. Mikrofonla her konuşma bir kredidir. Seslendirme (TTS) ise sınırsızdır. Kota her ayın 1&apos;inde yenilenir.</p></div></div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Bu ayki kullanım</span><Badge variant="outline" className={cn('text-xs', quotaExhausted ? 'border-red-200 text-red-700 bg-red-50' : usedPercent >= 80 ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50')}>{quotaExhausted ? 'Kota doldu' : `${usedPercent}% kullanıldı`}</Badge></div>
        <div className="flex items-end justify-between"><div><span className="text-3xl font-bold text-foreground">{usedCount}</span><span className="text-sm text-muted-foreground"> / {speechUsage.monthlyLimit} tanıma</span></div><div className="text-right"><span className="text-sm font-semibold text-foreground">{quotaRemaining}</span><span className="text-xs text-muted-foreground"> kalan</span></div></div>
        <Progress value={usedPercent} className={cn('h-2', quotaExhausted ? '[&>div]:bg-red-500' : usedPercent >= 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500')} />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /><span>Dönem: <strong className="text-foreground">{formatMonth(speechUsage.month)}</strong> · Yenileme: <strong className="text-foreground">{daysUntilReset} gün</strong> sonra</span></div>
      </div>
      {quotaExhausted && (<div className="rounded-lg bg-red-50 p-3 border border-red-200"><p className="text-sm text-red-800"><strong>Kota doldu.</strong> {daysUntilReset} gün sonra yenilenecek.</p></div>)}
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Aylık limit ayarı</span></div>
        <div className="flex items-center gap-2">
          <input type="number" min={1} max={10000} step={10} value={limitInput} onChange={(e) => setLimitInput(e.target.value)} className="flex-1 h-10 rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-400 focus:outline-none" />
          <Button size="sm" onClick={handleSaveLimit} disabled={limitInput === String(speechUsage.monthlyLimit)}>Kaydet</Button>
        </div>
      </div>
    </div>
  );

  const renderWordsTab = () => {
    if (wordScreen === 'detail' && selectedList) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => { setWordScreen('lists'); setSelectedListId(null); }} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              <span className="text-lg">‹</span> Tüm Listeler
            </button>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{selectedList.name}</h3>
            <Badge variant="outline">{selectedList.words.length} kelime</Badge>
          </div>
          <Separator />
          {/* Add word form */}
          <div className="flex gap-2">
            <Input placeholder="Almanca" value={newWordGerman} onChange={(e) => setNewWordGerman(e.target.value)} className="flex-1" />
            <Input placeholder="Türkçe" value={newWordTurkish} onChange={(e) => setNewWordTurkish(e.target.value)} className="flex-1" />
            <Button size="sm" onClick={handleAddWord} disabled={!newWordGerman.trim() || !newWordTurkish.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {/* Word list */}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {selectedList.words.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Henüz kelime eklenmedi. Yukarıdan kelime ekleyin.</p>
            )}
            {selectedList.words.map((w, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 group">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                  <span className="text-sm font-medium">{w.german}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-sm text-muted-foreground">{w.turkish}</span>
                </div>
                <button onClick={() => handleDeleteWord(i)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {/* Export buttons */}
          {selectedList.words.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => downloadFile(buildCSV(selectedList), `${selectedList.name}.csv`, 'text/csv')}>
                <FileText className="h-4 w-4 mr-1" /> CSV İndir
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => downloadFile(buildJSON(selectedList), `${selectedList.name}.json`, 'application/json')}>
                <FileJson className="h-4 w-4 mr-1" /> JSON İndir
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-purple-50 p-4">
          <div className="flex items-start gap-3">
            <FolderPlus className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-sm text-purple-800">
              <p className="font-medium mb-1">Özel Kelime Listeleri</p>
              <p>Kendi kelime listelerinizi oluşturun, CSV/JSON dosyalarından içe aktarın veya dışa aktarın.</p>
            </div>
          </div>
        </div>
        <Separator />
        {/* Create new list */}
        <div className="flex gap-2">
          <Input placeholder="Yeni liste adı..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateList()} className="flex-1" />
          <Button size="sm" onClick={handleCreateList} disabled={!newListName.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Oluştur
          </Button>
        </div>
        {/* Lists */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {customWordLists.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Henüz kelime listeniz yok.</p>
              <p className="text-xs text-muted-foreground">Yukarıdan yeni bir liste oluşturun.</p>
            </div>
          )}
          {customWordLists.map((list) => (
            <div key={list.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 hover:border-emerald-200 transition-all cursor-pointer group" onClick={() => { setSelectedListId(list.id); setWordScreen('detail'); }}>
              <div className="flex items-center gap-3">
                <FolderOpen className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">{list.name}</p>
                  <p className="text-xs text-muted-foreground">{list.words.length} kelime · {new Date(list.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{list.category}</Badge>
                <button onClick={(e) => { e.stopPropagation(); deleteCustomWordList(list.id); }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDataTab = () => (
    <div className="space-y-5">
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-start gap-3"><AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" /><div className="text-sm text-blue-800"><p className="font-medium mb-1">Veri Yönetimi</p><p>Özel kelime listelerinizi CSV veya JSON olarak dışa/içe aktarabilirsiniz. Örnek dosya formatlarını inceleyerek doğru formatı görebilirsiniz.</p></div></div>
      </div>
      <Separator />

      {/* Import */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase text-muted-foreground">İçe Aktar</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Dosya Yükle (CSV/JSON)
          </Button>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv,.json" onChange={handleFileImport} className="hidden" />
        {importStatus && (
          <div className={cn('rounded-lg p-3 text-sm', importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
            {importStatus.msg}
          </div>
        )}
      </div>
      <Separator />

      {/* Sample formats */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Örnek Dosya Formatları</span>
        <div className="grid gap-3">
          {/* CSV Example */}
          <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-emerald-600" /><span className="text-sm font-medium">CSV Formatı</span></div>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => downloadFile(SAMPLE_CSV, 'ornek-kelimeler.csv', 'text/csv')}><Download className="h-3 w-3 mr-1" /> İndir</Button>
            </div>
            <pre className="bg-slate-50 rounded-md p-2 text-xs text-slate-600 overflow-x-auto">{SAMPLE_CSV}</pre>
          </div>
          {/* JSON Example */}
          <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><FileJson className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">JSON Formatı</span></div>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => downloadFile(SAMPLE_JSON, 'ornek-kelimeler.json', 'application/json')}><Download className="h-3 w-3 mr-1" /> İndir</Button>
            </div>
            <pre className="bg-slate-50 rounded-md p-2 text-xs text-slate-600 overflow-x-auto max-h-40">{SAMPLE_JSON}</pre>
          </div>
        </div>
      </div>
      <Separator />

      {/* Storage info */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Depolama</span>
        <div className="rounded-lg bg-slate-50 p-3 space-y-2">
          <div className="flex items-center gap-2"><HardDrive className="h-4 w-4 text-slate-500" /><span className="text-sm font-medium">Kullanım Bilgisi</span></div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white rounded-md p-2"><span className="text-muted-foreground">Kelime Listeleri:</span><br /><strong>{customWordLists.length}</strong> liste, <strong>{customWordLists.reduce((a, l) => a + l.words.length, 0)}</strong> kelime</div>
            <div className="bg-white rounded-md p-2"><span className="text-muted-foreground">Okuma Egzersizleri:</span><br /><strong>{store.customReadingExercises.length}</strong> adet</div>
          </div>
        </div>
      </div>
      <Separator />

      {/* Danger zone */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <Trash2 className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-sm text-red-800">Tüm verileri sil</p>
            <p className="text-xs text-red-600 mt-1">Tüm ilerleme ve geçmiş verilerinizi kalıcı olarak siler. API anahtarları ve özel kelime listeleri korunur.</p>
            {!showConfirm ? (
              <Button variant="destructive" size="sm" className="mt-3" onClick={() => setShowConfirm(true)}><Trash2 className="mr-2 h-4 w-4" /> Verileri Sıfırla</Button>
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
      <div className="flex justify-between"><span>Uygulama</span><span className="font-medium text-foreground">DeutschMemo</span></div>
      <Separator />
      <div className="flex justify-between"><span>Seviye</span><span className="font-medium text-foreground">Almanca B1</span></div>
      <Separator />
      <div className="flex justify-between"><span>Toplam Kelime</span><span className="font-medium text-foreground">{wordPairs.length}</span></div>
      <Separator />
      <div className="flex justify-between"><span>Toplam Kategori</span><span className="font-medium text-foreground">{categories.length}</span></div>
    </div>
  );

  const tabContentMap: Record<TabId, () => React.ReactNode> = {
    general: renderGeneralTab,
    api: renderApiTab,
    speech: renderSpeechTab,
    words: renderWordsTab,
    data: renderDataTab,
    about: renderAboutTab,
  };

  return (
    <div className="space-y-5">
      {/* Tab navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all shrink-0', isActive ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300')}>
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
      {/* Tab content */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          {tabContentMap[activeTab]()}
        </CardContent>
      </Card>
    </div>
  );
}
