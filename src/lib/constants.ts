import {
  Home as HomeIcon,
  Layers,
  PenLine,
  Type,
  GripHorizontal,
  ArrowLeftRight,
  BarChart3,
  MessageSquare,
  HandHelping,
  Mail,
  Heart,
  AlertTriangle,
  Search,
  Thermometer,
  Phone,
  Calendar,
  Clock,
  CreditCard,
  Megaphone,
  PartyPopper,
  Key,
  Image,
  CheckCircle,
  FileX,
  Wrench,
  Zap,
  Bell,
  Shield,
  Package,
  Gift,
  HelpCircle,
  ClipboardList,
  ArrowRight,
  Brain,
  BookOpen,
  Timer,
  Settings,
  X,
  Sparkles,
  MessageCircle,
  Mic,
  Compass,
  RotateCcw,
  Headphones,
  CircleHelp,
  Award,
  FolderPlus,
  BookOpenText,
  GraduationCap,
  FileEdit,
  Puzzle,
  BookMarked,
  ArrowLeft,
} from 'lucide-react';
import { categories } from '@/lib/german-data';

/* ────────────────────────── Icon Mapping ────────────────────────── */
export const iconMap: Record<string, React.ElementType> = {
  Handshake: MessageSquare,
  HandHelping,
  Mail,
  Heart,
  AlertTriangle,
  Search,
  Thermometer,
  Phone,
  Calendar,
  Clock,
  CreditCard,
  Megaphone,
  PartyPopper,
  Key,
  Image,
  CheckCircle,
  FileX,
  Wrench,
  Zap,
  Bell,
  Shield,
  Package,
  Gift,
  HelpCircle,
  ClipboardList,
  ArrowRight,
  Brain,
  X,
  MessageSquare,
};

/* ────────────────────────── Color Map ────────────────────────── */
export const colorMap: Record<string, { bg: string; text: string; border: string; light: string }> = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-300', light: 'bg-emerald-50' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-300', light: 'bg-amber-50' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-300', light: 'bg-rose-50' },
  pink: { bg: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-300', light: 'bg-pink-50' },
  red: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-300', light: 'bg-red-50' },
  teal: { bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-300', light: 'bg-teal-50' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-300', light: 'bg-orange-50' },
  cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-300', light: 'bg-cyan-50' },
  violet: { bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-300', light: 'bg-violet-50' },
  sky: { bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-300', light: 'bg-sky-50' },
  lime: { bg: 'bg-lime-500', text: 'text-lime-600', border: 'border-lime-300', light: 'bg-lime-50' },
  fuchsia: { bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', border: 'border-fuchsia-300', light: 'bg-fuchsia-50' },
  yellow: { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-300', light: 'bg-yellow-50' },
  indigo: { bg: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-400', light: 'bg-emerald-50' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-300', light: 'bg-purple-50' },
  green: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-300', light: 'bg-green-50' },
  slate: { bg: 'bg-slate-500', text: 'text-slate-600', border: 'border-slate-300', light: 'bg-slate-50' },
  stone: { bg: 'bg-stone-500', text: 'text-stone-600', border: 'border-stone-300', light: 'bg-stone-50' },
};

export function getCategoryColor(catId: string) {
  const cat = categories.find((c) => c.id === catId);
  return colorMap[cat?.color || 'emerald'] || colorMap.emerald;
}

/* ────────────────────────── Nav Items ────────────────────────── */
export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  isGroup?: boolean;
  sublabel?: string;
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Ana Sayfa', icon: HomeIcon },
  { id: 'flashcards', label: 'Kartlar', icon: Layers },
  { id: 'fill-blank', label: 'Boşluk', icon: PenLine },
  { id: 'word-completion', label: 'Tamamlama', icon: Type },
  { id: 'drag-drop', label: 'Sürükle', icon: GripHorizontal },
  { id: 'matching', label: 'Eşleştirme', icon: ArrowLeftRight },
  { id: 'kelime-ezber', label: 'Kelime Ezber', icon: Sparkles },
  { id: 'vocab-explorer', label: 'Kelime Gezgini', icon: Compass },
  { id: 'pronunciation', label: 'Telaffuz', icon: Mic },
  { id: 'conversation', label: 'Konuşma', icon: MessageCircle },
  { id: 'competition', label: 'Yarışma', icon: Timer },
  { id: 'spaced-repetition', label: 'Tekrar', icon: RotateCcw },
  { id: 'listening', label: 'Dinleme', icon: Headphones },
  { id: 'reading', label: 'Okuma', icon: BookOpenText },
  { id: 'quiz', label: 'Quiz', icon: CircleHelp },
  { id: 'achievements', label: 'Başarımlar', icon: Award },
  { id: 'b1-exam', label: 'B1 Sınavı', icon: GraduationCap, isGroup: true },
  { id: 'custom-words', label: 'Sözlüklerim', icon: FolderPlus },
  { id: 'statistics', label: 'İstatistik', icon: BarChart3 },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
];

export const b1ExamItems: NavItem[] = [
  { id: 'exam-writing', label: 'Yazma', sublabel: 'Schriftlicher Ausdruck', icon: FileEdit },
  { id: 'exam-grammar', label: 'Dil Yapıları', sublabel: 'Sprachbausteine', icon: Puzzle },
  { id: 'exam-picture', label: 'Resim Tanımlama', sublabel: 'Bildbeschreibung', icon: BookMarked },
  { id: 'exam-vocab', label: 'Sınav Kelimeleri', sublabel: 'Prüfungswortschatz', icon: GraduationCap },
];
