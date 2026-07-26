'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderPlus,
  Upload,
  Plus,
  X,
  Trash2,
  ChevronLeft,
  Share2,
  BookOpen,
  FileText,
  Link,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Pencil,
  ListChecks,
  Copy,
  Check,
  Download,
  RotateCcw,
  ArrowRight,
  Volume2,
  Shuffle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

// ── Data Types ──────────────────────────────────────────────────────────────

interface CustomWord {
  german: string;
  turkish: string;
}

interface CustomWordList {
  id: string;
  name: string;
  description: string;
  words: CustomWord[];
  createdAt: string;
  category: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Simple heuristic: does a string contain Turkish-only special chars? */
function hasTurkishSpecialChars(str: string): boolean {
  return /[şığüşçöİŞĞÜŞÇÖ]/.test(str);
}

/** Check if a string looks like a CSV header (e.g. "german,turkish" or "Almanca,Türkçe") */
function looksLikeHeader(first: string, second: string): boolean {
  const headerKeywords = ['german', 'turkish', 'almanca', 'türkçe', 'deutsch', 'de', 'tr', 'kelime', 'word', 'çeviri', 'translation'];
  const combined = (first + ' ' + second).toLowerCase();
  return headerKeywords.some((k) => combined.includes(k));
}

/** Parse CSV content into word pairs */
function parseCSV(content: string): CustomWord[] {
  // Strip BOM if present
  let cleaned = content.replace(/^\uFEFF/, '');

  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const lines = cleaned.split('\n').filter((line) => line.trim().length > 0);

  if (lines.length === 0) return [];

  let startIndex = 0;

  // Check if the first line is a header
  if (lines.length > 1) {
    const firstLineParts = lines[0].split(',').map((s) => s.trim());
    if (firstLineParts.length >= 2) {
      const col1 = firstLineParts[0];
      const col2 = firstLineParts[1];
      // Skip if it looks like a header
      if (looksLikeHeader(col1, col2) || hasTurkishSpecialChars(col1)) {
        startIndex = 1;
      }
    }
  }

  const words: CustomWord[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(',').map((s) => s.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
      words.push({ german: parts[0], turkish: parts[1] });
    }
  }

  return words;
}

/** Encode a list to a base64 share string */
function encodeList(list: Omit<CustomWordList, 'id' | 'createdAt' | 'category'>): string {
  const payload = { n: list.name, d: list.description, w: list.words };
  return btoa(JSON.stringify(payload));
}

/** Decode a base64 share string */
function decodeList(encoded: string): { name: string; description: string; words: CustomWord[] } | null {
  try {
    const payload = JSON.parse(atob(encoded));
    if (payload && payload.w && Array.isArray(payload.w)) {
      return {
        name: payload.n || 'İçe Aktarılan Liste',
        description: payload.d || '',
        words: payload.w.filter(
          (w: any) => typeof w.german === 'string' && typeof w.turkish === 'string' && w.german && w.turkish
        ),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function generateShareURL(list: Omit<CustomWordList, 'id' | 'createdAt' | 'category'>): string {
  const base64 = encodeList(list);
  return window.location.origin + window.location.pathname + '?import=' + encodeURIComponent(base64);
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / restricted contexts
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

function generateId(): string {
  return `cwl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Build CSV string from word pairs */
function buildCSV(words: CustomWord[]): string {
  const lines = ['almanca,türkçe'];
  for (const w of words) {
    const german = w.german.includes(',') ? `"${w.german}"` : w.german;
    const turkish = w.turkish.includes(',') ? `"${w.turkish}"` : w.turkish;
    lines.push(`${german},${turkish}`);
  }
  return lines.join('\n');
}

/** Trigger a CSV file download */
function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return isoString;
  }
}

// ── Category options ───────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  'Genel',
  'Günlük Yaşam',
  'İş / Meslek',
  'Eğitim',
  'Seyahat',
  'Yiyecek / İçecek',
  'Sağlık',
  'Alışveriş',
  'Teknoloji',
  'Diğer',
];

// ── Animation variants ──────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

// ── Component ───────────────────────────────────────────────────────────────

export function CustomWordsModule() {
  // ── Screen state ──────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<'lists' | 'detail' | 'practice'>('lists');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // ── Store integration with fallback ───────────────────────────────────────
  const storeState = useAppStore() as any;
  const hasStoreSupport = 'customWordLists' in storeState;

  const [localLists, setLocalLists] = useState<CustomWordList[]>([]);

  const lists: CustomWordList[] = hasStoreSupport
    ? (storeState.customWordLists as CustomWordList[])
    : localLists;

  const addList = (list: CustomWordList) => {
    if (hasStoreSupport && storeState.addCustomWordList) {
      storeState.addCustomWordList(list);
    } else {
      setLocalLists((prev) => [...prev, list]);
    }
  };

  const deleteList = (id: string) => {
    if (hasStoreSupport && storeState.deleteCustomWordList) {
      storeState.deleteCustomWordList(id);
    } else {
      setLocalLists((prev) => prev.filter((l) => l.id !== id));
    }
  };

  // ── CSV Import state ──────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for ?import= URL param at init time (before first render)
  const initialUrlImport = (() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const importParam = params.get('import');
    if (!importParam) return null;
    return decodeList(importParam);
  })();

  const [csvParsedWords, setCsvParsedWords] = useState<CustomWord[]>(
    initialUrlImport?.words ?? []
  );
  const [csvImportName, setCsvImportName] = useState(initialUrlImport?.name ?? '');
  const [csvImportDescription, setCsvImportDescription] = useState(initialUrlImport?.description ?? '');
  const [csvImportCategory, setCsvImportCategory] = useState('Genel');
  const [showCsvPreview, setShowCsvPreview] = useState(
    initialUrlImport && initialUrlImport.words.length > 0
  );

  // ── Manual entry state ────────────────────────────────────────────────────
  const [manualListName, setManualListName] = useState('');
  const [manualListDescription, setManualListDescription] = useState('');
  const [manualListCategory, setManualListCategory] = useState('Genel');
  const [manualGermanInput, setManualGermanInput] = useState('');
  const [manualTurkishInput, setManualTurkishInput] = useState('');
  const [manualWords, setManualWords] = useState<CustomWord[]>([]);

  // ── URL Import state ──────────────────────────────────────────────────────
  const [urlImportText, setUrlImportText] = useState('');

  // ── Detail screen state ───────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Add word to existing list state ────────────────────────────────────────
  const [showAddWord, setShowAddWord] = useState(false);
  const [addWordGerman, setAddWordGerman] = useState('');
  const [addWordTurkish, setAddWordTurkish] = useState('');

  // ── Practice (Flashcard) state ────────────────────────────────────────────
  const [practiceWords, setPracticeWords] = useState<CustomWord[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceFlipped, setPracticeFlipped] = useState(false);
  const [practiceKnown, setPracticeKnown] = useState(0);
  const [practiceUnknown, setPracticeUnknown] = useState(0);
  const [practiceShuffled, setPracticeShuffled] = useState(false);

  // ── Toast auto-dismiss ────────────────────────────────────────────────────
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // ── Selected list data ────────────────────────────────────────────────────
  const selectedList = lists.find((l) => l.id === selectedListId) ?? null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setToastMessage('Lütfen bir .csv dosyası seçin.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setToastMessage('CSV dosyasından kelime çifti bulunamadı.');
        return;
      }
      setCsvParsedWords(parsed);
      setCsvImportName(file.name.replace(/\.csv$/i, ''));
      setCsvImportDescription('');
      setShowCsvPreview(true);
    };
    reader.readAsText(file);
  }, []);

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleConfirmCsvImport = () => {
    const name = csvImportName.trim();
    if (!name) {
      setToastMessage('Lütfen bir liste adı girin.');
      return;
    }
    const newList: CustomWordList = {
      id: generateId(),
      name,
      description: csvImportDescription.trim(),
      words: csvParsedWords,
      createdAt: new Date().toISOString(),
      category: csvImportCategory,
    };
    addList(newList);
    resetCsvImport();
    setToastMessage(`"${name}" listesi ${csvParsedWords.length} kelime ile eklendi.`);
  };

  const resetCsvImport = () => {
    setCsvParsedWords([]);
    setCsvImportName('');
    setCsvImportDescription('');
    setCsvImportCategory('Genel');
    setShowCsvPreview(false);
  };

  const handleAddManualWord = () => {
    const german = manualGermanInput.trim();
    const turkish = manualTurkishInput.trim();
    if (!german || !turkish) {
      setToastMessage('Hem Almanca hem Türkçe alanlarını doldurun.');
      return;
    }
    setManualWords((prev) => [...prev, { german, turkish }]);
    setManualGermanInput('');
    setManualTurkishInput('');
  };

  const handleRemoveManualWord = (index: number) => {
    setManualWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveManualList = () => {
    const name = manualListName.trim();
    if (!name) {
      setToastMessage('Lütfen bir liste adı girin.');
      return;
    }
    if (manualWords.length === 0) {
      setToastMessage('En az bir kelime çifti ekleyin.');
      return;
    }
    const newList: CustomWordList = {
      id: generateId(),
      name,
      description: manualListDescription.trim(),
      words: [...manualWords],
      createdAt: new Date().toISOString(),
      category: manualListCategory,
    };
    addList(newList);
    setManualListName('');
    setManualListDescription('');
    setManualListCategory('Genel');
    setManualWords([]);
    setToastMessage(`"${name}" listesi ${manualWords.length} kelime ile oluşturuldu.`);
  };

  const handleUrlImport = () => {
    const text = urlImportText.trim();
    if (!text) {
      setToastMessage('Lütfen bir bağlantı veya base64 kodu yapıştırın.');
      return;
    }

    // Try to extract from URL
    let encoded = text;
    try {
      const url = new URL(text);
      const param = url.searchParams.get('import');
      if (param) {
        encoded = param;
      }
    } catch {
      // Not a URL — treat as raw base64
    }

    const decoded = decodeList(encoded);
    if (!decoded || decoded.words.length === 0) {
      setToastMessage('Geçersiz veya boş veri. Lütfen bağlantıyı kontrol edin.');
      return;
    }

    const newList: CustomWordList = {
      id: generateId(),
      name: decoded.name,
      description: decoded.description,
      words: decoded.words,
      createdAt: new Date().toISOString(),
      category: 'Genel',
    };
    addList(newList);
    setUrlImportText('');
    setToastMessage(`"${decoded.name}" listesi ${decoded.words.length} kelime ile içe aktarıldı.`);
  };

  const handleOpenDetail = (id: string) => {
    setSelectedListId(id);
    setDeleteConfirm(false);
    setShareCopied(false);
    setScreen('detail');
  };

  const handleBack = () => {
    setScreen('lists');
    setSelectedListId(null);
    setDeleteConfirm(false);
    setShareCopied(false);
    setShowAddWord(false);
    setAddWordGerman('');
    setAddWordTurkish('');
  };

  const handleBackFromPractice = () => {
    setScreen('detail');
    setPracticeWords([]);
    setPracticeIndex(0);
    setPracticeFlipped(false);
    setPracticeKnown(0);
    setPracticeUnknown(0);
    setPracticeShuffled(false);
  };

  const handleDeleteList = () => {
    if (!selectedListId) return;
    const name = selectedList?.name || 'Liste';
    deleteList(selectedListId);
    setToastMessage(`"${name}" listesi silindi.`);
    handleBack();
  };

  const handleShare = async () => {
    if (!selectedList) return;
    const url = generateShareURL({
      name: selectedList.name,
      description: selectedList.description,
      words: selectedList.words,
    });
    const ok = await copyToClipboard(url);
    if (ok) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } else {
      setToastMessage('Bağlantı kopyalanamadı.');
    }
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!selectedList || selectedList.words.length === 0) {
      setToastMessage('Dışa aktarılacak kelime yok.');
      return;
    }
    const csv = buildCSV(selectedList.words);
    const safeName = selectedList.name.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s-_]/g, '').replace(/\s+/g, '_');
    downloadCSV(csv, `${safeName}.csv`);
    setToastMessage(`"${selectedList.name}" CSV olarak indirildi.`);
  };

  // ── Add word to existing list ──────────────────────────────────────────────
  const handleAddWordToExistingList = () => {
    if (!selectedListId) return;
    const german = addWordGerman.trim();
    const turkish = addWordTurkish.trim();
    if (!german || !turkish) {
      setToastMessage('Hem Almanca hem Türkçe alanlarını doldurun.');
      return;
    }
    const updatedList: CustomWordList = {
      ...selectedList!,
      words: [...selectedList!.words, { german, turkish }],
    };
    if (hasStoreSupport && storeState.addCustomWordList) {
      storeState.deleteCustomWordList(selectedListId);
      storeState.addCustomWordList(updatedList);
    } else {
      setLocalLists((prev) => prev.map((l) => (l.id === selectedListId ? updatedList : l)));
    }
    setAddWordGerman('');
    setAddWordTurkish('');
    setToastMessage('Yeni kelime listeye eklendi.');
  };

  // ── Practice (Flashcard) ──────────────────────────────────────────────────
  const handlePractice = () => {
    if (!selectedList || selectedList.words.length === 0) {
      setToastMessage('Bu listede pratik yapılacak kelime yok.');
      return;
    }
    const words = practiceShuffled
      ? [...selectedList.words].sort(() => Math.random() - 0.5)
      : [...selectedList.words];
    setPracticeWords(words);
    setPracticeIndex(0);
    setPracticeFlipped(false);
    setPracticeKnown(0);
    setPracticeUnknown(0);
    setScreen('practice');
  };

  const handleFlipCard = () => {
    setPracticeFlipped((prev) => !prev);
  };

  const handlePracticeAnswer = (known: boolean) => {
    if (known) {
      setPracticeKnown((prev) => prev + 1);
    } else {
      setPracticeUnknown((prev) => prev + 1);
    }
    if (practiceIndex + 1 >= practiceWords.length) {
      // Session complete
      setPracticeFlipped(false);
    } else {
      setPracticeIndex((prev) => prev + 1);
      setPracticeFlipped(false);
    }
  };

  const practiceComplete = practiceWords.length > 0 && practiceIndex >= practiceWords.length;
  const practiceProgress = practiceWords.length > 0 ? ((practiceIndex + (practiceComplete ? 0 : 1)) / practiceWords.length) * 100 : 0;
  const currentPracticeWord = practiceWords[practiceIndex] ?? null;

  const handleDeleteWordFromList = (wordIndex: number) => {
    if (!selectedListId) return;
    const updatedWords = selectedList.words.filter((_, i) => i !== wordIndex);
    const updatedList: CustomWordList = {
      ...selectedList,
      words: updatedWords,
    };
    // Re-add the updated list (replace)
    if (hasStoreSupport && storeState.addCustomWordList) {
      storeState.deleteCustomWordList(selectedListId);
      storeState.addCustomWordList(updatedList);
    } else {
      setLocalLists((prev) => prev.map((l) => (l.id === selectedListId ? updatedList : l)));
    }
  };

  // ── Unique categories from existing lists ─────────────────────────────────
  const existingCategories = Array.from(new Set(lists.map((l) => l.category)));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {screen === 'lists' ? (
        <motion.div
          key="lists-screen"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={staggerContainer}
          className="space-y-6"
        >
          {/* ── Gradient Header ──────────────────────────────────────────── */}
          <motion.div
            variants={fadeInUp}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 to-green-600 p-6 text-white shadow-sm"
          >
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">Özel Kelime Listeleri</h2>
              </div>
              <p className="ml-[52px] text-sm text-white/80">
                Kendi kelime listelerinizi oluşturun, CSV ile içe aktarın veya paylaşın.
              </p>
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10" />
          </motion.div>

          {/* Store fallback note */}
          {!hasStoreSupport && (
            <motion.div variants={fadeInUp}>
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Veriler şu anda yerel olarak saklanmaktadır. Kalıcı depolama için mağaza güncellemesi gereklidir.</span>
              </div>
            </motion.div>
          )}

          {/* ── CSV Import Area ──────────────────────────────────────────── */}
          <motion.div variants={fadeInUp}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Upload className="h-4 w-4 text-teal-600" />
                  CSV Dosyasından İçe Aktar
                </div>

                {!showCsvPreview ? (
                  <>
                    <div
                      onClick={handleDropZoneClick}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 transition-colors hover:border-teal-400 hover:bg-teal-50/50"
                    >
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                        <FileText className="h-5 w-5 text-teal-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        CSV dosyasını sürükleyin veya tıklayın
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Format: almanca,türkçe (başlık satırı isteğe bağlı)
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        <strong>{csvParsedWords.length}</strong> kelime çifti başarıyla ayrıştırıldı.
                      </span>
                    </div>

                    {/* Preview first few words */}
                    <div className="max-h-32 overflow-y-auto rounded-lg bg-gray-50 p-2">
                      <div className="space-y-1">
                        {csvParsedWords.slice(0, 10).map((w, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded-md bg-white px-2 py-1 text-xs"
                          >
                            <span className="font-medium text-gray-800">{w.german}</span>
                            <span className="text-gray-300">-</span>
                            <span className="text-gray-600">{w.turkish}</span>
                          </div>
                        ))}
                        {csvParsedWords.length > 10 && (
                          <p className="px-2 text-center text-xs text-gray-400">
                            ... ve {csvParsedWords.length - 10} kelime daha
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder="Liste adı"
                        value={csvImportName}
                        onChange={(e) => setCsvImportName(e.target.value)}
                        className="h-9 rounded-lg"
                      />
                      <Input
                        placeholder="Açıklama (isteğe bağlı)"
                        value={csvImportDescription}
                        onChange={(e) => setCsvImportDescription(e.target.value)}
                        className="h-9 rounded-lg"
                      />
                      <div className="flex gap-2">
                        {CATEGORY_OPTIONS.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCsvImportCategory(cat)}
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                              csvImportCategory === cat
                                ? 'bg-teal-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleConfirmCsvImport}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                        size="sm"
                      >
                        <Check className="mr-1.5 h-4 w-4" />
                        Listeyi Kaydet
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetCsvImport}
                        size="sm"
                        className="rounded-xl"
                      >
                        <X className="mr-1.5 h-4 w-4" />
                        İptal
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ── URL Import ───────────────────────────────────────────────── */}
          <motion.div variants={fadeInUp}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Link className="h-4 w-4 text-blue-600" />
                  Bağlantı ile İçe Aktar
                </div>
                <p className="mb-2 text-xs text-gray-500">
                  Paylaşılan bir liste bağlantısını veya base64 kodunu yapıştırın.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Bağlantı veya base64 kodu..."
                    value={urlImportText}
                    onChange={(e) => setUrlImportText(e.target.value)}
                    className="h-9 rounded-lg flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                  />
                  <Button
                    onClick={handleUrlImport}
                    variant="outline"
                    size="sm"
                    className="rounded-xl whitespace-nowrap"
                  >
                    <Upload className="mr-1.5 h-4 w-4" />
                    İçe Aktar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Manual Entry ────────────────────────────────────────────── */}
          <motion.div variants={fadeInUp}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Pencil className="h-4 w-4 text-amber-600" />
                  Kelime Listesi Oluştur
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Liste adı"
                      value={manualListName}
                      onChange={(e) => setManualListName(e.target.value)}
                      className="h-9 rounded-lg"
                    />
                    <Input
                      placeholder="Açıklama (isteğe bağlı)"
                      value={manualListDescription}
                      onChange={(e) => setManualListDescription(e.target.value)}
                      className="h-9 rounded-lg"
                    />
                  </div>

                  {/* Category selection */}
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setManualListCategory(cat)}
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                          manualListCategory === cat
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <Separator />

                  {/* Word pair input */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <Input
                      placeholder="Almanca"
                      value={manualGermanInput}
                      onChange={(e) => setManualGermanInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddManualWord()}
                      className="h-9 rounded-lg"
                    />
                    <Input
                      placeholder="Türkçe"
                      value={manualTurkishInput}
                      onChange={(e) => setManualTurkishInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddManualWord()}
                      className="h-9 rounded-lg"
                    />
                    <Button
                      onClick={handleAddManualWord}
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Added words as removable chips */}
                  {manualWords.length > 0 && (
                    <div className="max-h-36 overflow-y-auto rounded-lg bg-gray-50 p-2">
                      <div className="flex flex-wrap gap-1.5">
                        <AnimatePresence>
                          {manualWords.map((w, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="group flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs shadow-sm border border-gray-200"
                            >
                              <span className="font-medium text-gray-800">{w.german}</span>
                              <span className="text-gray-300">-</span>
                              <span className="text-gray-600">{w.turkish}</span>
                              <button
                                onClick={() => handleRemoveManualWord(i)}
                                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleSaveManualList}
                    disabled={!manualListName.trim() || manualWords.length === 0}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl disabled:opacity-50"
                    size="sm"
                  >
                    <FolderPlus className="mr-1.5 h-4 w-4" />
                    Listeyi Kaydet ({manualWords.length} kelime)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Existing Lists ───────────────────────────────────────────── */}
          <motion.div variants={fadeInUp}>
            <div className="mb-3 flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">
                Kayıtlı Listeler
              </h3>
              {lists.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {lists.length}
                </Badge>
              )}
            </div>

            {lists.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-12 text-center"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <FolderOpen className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  Henüz özel kelime listeniz yok
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Yukarıdaki yöntemlerden biriyle yeni bir liste oluşturun.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AnimatePresence>
                  {lists.map((list, index) => (
                    <motion.div
                      key={list.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => handleOpenDetail(list.id)}
                      className="group cursor-pointer"
                    >
                      <Card className="h-full rounded-2xl border-0 shadow-sm transition-shadow hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-sm font-semibold text-gray-800">
                                {list.name}
                              </h4>
                              {list.description && (
                                <p className="mt-0.5 truncate text-xs text-gray-500">
                                  {list.description}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'shrink-0 border-0 text-[10px] font-medium',
                                list.category === 'Genel'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-teal-50 text-teal-700'
                              )}
                            >
                              {list.category}
                            </Badge>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              <span>{list.words.length} kelime</span>
                            </div>
                            <span>{formatDate(list.createdAt)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : screen === 'detail' ? (
        /* ═══════════════════════════════════════════════════════════════════
           DETAIL SCREEN
           ═══════════════════════════════════════════════════════════════════ */
        <motion.div
          key="detail-screen"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          className="space-y-5"
        >
          {selectedList ? (
            <>
              {/* Back button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="-ml-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Listelere Dön
              </Button>

              {/* List header card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 to-green-600 p-5 text-white shadow-sm">
                <div className="relative z-10">
                  <h2 className="text-lg font-bold leading-tight">{selectedList.name}</h2>
                  {selectedList.description && (
                    <p className="mt-1 text-sm text-white/80">{selectedList.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-white/70">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{selectedList.words.length} kelime</span>
                    </div>
                    <Badge className="border-0 bg-white/20 text-white backdrop-blur">
                      {selectedList.category}
                    </Badge>
                    <span>{formatDate(selectedList.createdAt)}</span>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-white/10" />
              </div>

              {/* Word list */}
              <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {selectedList.words.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                      >
                        <FolderOpen className="mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-sm text-gray-400">Bu listede kelime bulunmuyor.</p>
                      </motion.div>
                    ) : (
                      selectedList.words.map((word, i) => (
                        <motion.div
                          key={`${word.german}-${word.turkish}-${i}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8, height: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[10px] font-semibold text-teal-700">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800">{word.german}</p>
                            <p className="text-xs text-gray-500">{word.turkish}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteWordFromList(i)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Add word to list */}
              <motion.div variants={fadeInUp}>
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="p-4">
                    <button
                      onClick={() => setShowAddWord((prev) => !prev)}
                      className="flex w-full items-center justify-between text-sm font-semibold text-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-teal-600" />
                        Listeye Kelime Ekle
                      </div>
                      <motion.span
                        animate={{ rotate: showAddWord ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Plus className="h-4 w-4 text-gray-400" />
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {showAddWord && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                              <Input
                                placeholder="Almanca"
                                value={addWordGerman}
                                onChange={(e) => setAddWordGerman(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddWordToExistingList()}
                                className="h-9 rounded-lg"
                              />
                              <Input
                                placeholder="Türkçe"
                                value={addWordTurkish}
                                onChange={(e) => setAddWordTurkish(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddWordToExistingList()}
                                className="h-9 rounded-lg"
                              />
                              <Button
                                onClick={handleAddWordToExistingList}
                                size="sm"
                                className="h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Action buttons */}
              <div className="space-y-2">
                {/* Practice button with shuffle option */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => { setPracticeShuffled(false); handlePractice(); }}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                    disabled={selectedList.words.length === 0}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Sıralı Çalış
                  </Button>
                  <Button
                    onClick={() => { setPracticeShuffled(true); handlePractice(); }}
                    variant="outline"
                    className="rounded-xl"
                    disabled={selectedList.words.length === 0}
                    title="Karıştırılmış sırayla çalış"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>

                {/* Export CSV button */}
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="w-full rounded-xl"
                  disabled={selectedList.words.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV Olarak İndir
                </Button>

                {/* Share button */}
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="w-full rounded-xl"
                >
                  {shareCopied ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-600">Bağlantı Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Listeyi Paylaş
                    </>
                  )}
                </Button>

                {/* Delete button */}
                {!deleteConfirm ? (
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirm(true)}
                    className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Listeyi Sil
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2"
                  >
                    <p className="flex flex-1 items-center text-sm text-red-600">
                      <AlertCircle className="mr-1.5 h-4 w-4" />
                      Emin misiniz?
                    </p>
                    <Button
                      onClick={handleDeleteList}
                      variant="destructive"
                      size="sm"
                      className="rounded-xl"
                    >
                      Evet, Sil
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(false)}
                      className="rounded-xl"
                    >
                      İptal
                    </Button>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">Liste bulunamadı.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mt-3 text-teal-600 hover:text-teal-700"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Listelere Dön
              </Button>
            </div>
          )}
        </motion.div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
           PRACTICE SCREEN (Flashcard)
           ═══════════════════════════════════════════════════════════════════ */
        <motion.div
          key="practice-screen"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="space-y-5"
        >
          {/* Back + progress bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackFromPractice}
                className="-ml-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Listeye Dön
              </Button>
              <span className="text-xs text-gray-500">
                {Math.min(practiceIndex + 1, practiceWords.length)} / {practiceWords.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-green-500"
                animate={{ width: `${practiceProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Bildi: <strong className="text-emerald-600">{practiceKnown}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <X className="h-3.5 w-3.5 text-red-400" />
                <span>Bilmedi: <strong className="text-red-500">{practiceUnknown}</strong></span>
              </div>
            </div>
          </div>

          {!practiceComplete && currentPracticeWord ? (
            <>
              {/* Flashcard */}
              <div className="flex justify-center">
                <motion.div
                  onClick={handleFlipCard}
                  className="relative w-full max-w-sm cursor-pointer select-none overflow-hidden rounded-2xl bg-white shadow-lg"
                  style={{ perspective: 600 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={practiceIndex}
                      initial={{ opacity: 0, rotateY: -30 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      exit={{ opacity: 0, rotateY: 30 }}
                      transition={{ duration: 0.25 }}
                      className="p-8 text-center"
                    >
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                        Almanca
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        {currentPracticeWord.german}
                      </p>

                      <AnimatePresence>
                        {practiceFlipped && (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                          >
                            <Separator className="my-4" />
                            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                              Türkçe
                            </p>
                            <p className="text-xl font-semibold text-teal-700">
                              {currentPracticeWord.turkish}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!practiceFlipped && (
                        <p className="mt-6 text-xs text-gray-400">
                          Cevabı görmek için tıklayın
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Answer buttons (only shown after flip) */}
              <AnimatePresence>
                {practiceFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="flex gap-3"
                  >
                    <Button
                      onClick={() => handlePracticeAnswer(false)}
                      variant="outline"
                      className="flex-1 rounded-xl border-red-200 py-6 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <X className="mr-2 h-5 w-5" />
                      Bilmedim
                    </Button>
                    <Button
                      onClick={() => handlePracticeAnswer(true)}
                      className="flex-1 rounded-xl bg-emerald-600 py-6 text-white hover:bg-emerald-700"
                    >
                      <Check className="mr-2 h-5 w-5" />
                      Bildim
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : practiceComplete ? (
            /* ── Session Summary ─────────────────────────────────────── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5"
            >
              <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-green-600 p-8 text-center text-white shadow-lg">
                <div className="mb-3 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold">Pratik Tamamlandı!</h3>
                <p className="mt-2 text-sm text-white/80">
                  {practiceWords.length} kelime çalışıldı
                </p>

                <div className="mt-6 flex items-center justify-center gap-8">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{practiceKnown}</p>
                    <p className="mt-1 text-xs text-white/70">Bildi</p>
                  </div>
                  <div className="h-10 w-px bg-white/30" />
                  <div className="text-center">
                    <p className="text-3xl font-bold">{practiceUnknown}</p>
                    <p className="mt-1 text-xs text-white/70">Bilmedi</p>
                  </div>
                  <div className="h-10 w-px bg-white/30" />
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {practiceWords.length > 0
                        ? Math.round((practiceKnown / practiceWords.length) * 100)
                        : 0}%
                    </p>
                    <p className="mt-1 text-xs text-white/70">Doğruluk</p>
                  </div>
                </div>
              </div>

              {/* Action buttons for summary */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setPracticeShuffled(false);
                    handlePractice();
                  }}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Tekrar Çalış
                </Button>
                <Button
                  onClick={() => {
                    setPracticeShuffled(true);
                    handlePractice();
                  }}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Karıştır
                </Button>
              </div>
              <Button
                onClick={handleBackFromPractice}
                className="w-full rounded-xl"
                variant="ghost"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Listeye Dön
              </Button>
            </motion.div>
          ) : null}
        </motion.div>
      )}
    </div>
  );
}