'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  Lock,
  PartyPopper,
  Target,
  Flame,
  BookOpen,
  Trophy,
  Star,
  Zap,
  Compass,
  Crown,
  GraduationCap,
  Medal,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { wordPairs } from '@/lib/german-data';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  unlocked: boolean;
  unlockDate: string | null;
}

interface ExerciseHistoryEntry {
  id: string;
  date: string;
  exercise: string;
  exerciseLabel: string;
  correct: number;
  total: number;
  categories: string[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** All exercise types the app ships with (used for the Ke\u015fif\u00e7i achievement) */
const ALL_EXERCISE_TYPES = [
  'fill-blank',
  'word-completion',
  'drag-drop',
  'matching',
  'flashcards',
  'competition',
  'kelime-ezber',
  'conversation',
] as const;

const TOTAL_ACHIEVEMENTS = 12;

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function toDayStr(isoDate: string): string {
  return isoDate.slice(0, 10);
}

function formatDateTurkish(dayStr: string): string {
  const d = new Date(dayStr + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Calculate the best (longest) streak from exercise history dates */
function calcBestStreak(history: ExerciseHistoryEntry[]): number {
  if (history.length === 0) return 0;

  const uniqueDays = [...new Set(history.map((e) => toDayStr(e.date)))].sort();
  if (uniqueDays.length === 0) return 0;

  let best = 1;
  let run = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1] + 'T00:00:00');
    const curr = new Date(uniqueDays[i] + 'T00:00:00');
    const diff = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff === 1) {
      run += 1;
      if (run > best) best = run;
    } else if (diff > 1) {
      run = 1;
    }
  }

  return best;
}

/**
 * Simplified unlock-date finder.
 * Walks through exercise history chronologically, tracking cumulative stats,
 * and returns the date the condition was first likely satisfied.
 */
function findUnlockDate(
  achievementId: string,
  history: ExerciseHistoryEntry[],
  cardProgress: Record<string, { correct: number }>,
  totalWords: number,
): string | null {
  if (history.length === 0) return null;

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));

  switch (achievementId) {
    case 'first-step': {
      return toDayStr(sorted[0].date);
    }

    case '10-words': {
      let cum = 0;
      for (const e of sorted) {
        cum += e.total;
        if (cum >= 10) return toDayStr(e.date);
      }
      return null;
    }

    case '50-words': {
      let cum = 0;
      for (const e of sorted) {
        cum += e.total;
        if (cum >= 50) return toDayStr(e.date);
      }
      return null;
    }

    case '100-words': {
      let cum = 0;
      for (const e of sorted) {
        cum += e.total;
        if (cum >= 100) return toDayStr(e.date);
      }
      return null;
    }

    case '3-streak':
    case '7-streak':
    case '30-streak': {
      const target =
        achievementId === '3-streak'
          ? 3
          : achievementId === '7-streak'
            ? 7
            : 30;
      const uniqueDays = [
        ...new Set(sorted.map((e) => toDayStr(e.date))),
      ].sort();
      let run = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        const prev = new Date(uniqueDays[i - 1] + 'T00:00:00');
        const curr = new Date(uniqueDays[i] + 'T00:00:00');
        const diff = Math.round(
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diff === 1) {
          run += 1;
          if (run >= target) return uniqueDays[i];
        } else if (diff > 1) {
          run = 1;
        }
      }
      return null;
    }

    case 'perfect': {
      for (const e of sorted) {
        if (e.correct === e.total && e.total >= 5) return toDayStr(e.date);
      }
      return null;
    }

    case 'explorer': {
      const used = new Set<string>();
      for (const e of sorted) {
        used.add(e.exercise);
        if (used.size >= ALL_EXERCISE_TYPES.length) return toDayStr(e.date);
      }
      return null;
    }

    case 'master': {
      const masteredCount = Object.values(cardProgress).filter(
        (cp) => cp.correct >= 3,
      ).length;
      if (masteredCount < 50) return null;
      return toDayStr(sorted[sorted.length - 1].date);
    }

    case 'super-master': {
      const masteredCount = Object.values(cardProgress).filter(
        (cp) => cp.correct >= 3,
      ).length;
      if (masteredCount < totalWords) return null;
      return toDayStr(sorted[sorted.length - 1].date);
    }

    case 'marathon': {
      const dayTotals: Record<string, number> = {};
      for (const e of sorted) {
        const day = toDayStr(e.date);
        dayTotals[day] = (dayTotals[day] || 0) + e.total;
        if (dayTotals[day] >= 20) return day;
      }
      return null;
    }

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Achievement definitions                                             */
/* ------------------------------------------------------------------ */

function buildAchievements(
  totalPracticed: number,
  streak: number,
  exerciseHistory: ExerciseHistoryEntry[],
  cardProgress: Record<string, { correct: number }>,
  totalWords: number,
  todayReviewed: number,
): AchievementDef[] {
  const uniqueExercises = new Set(exerciseHistory.map((e) => e.exercise));
  const hasPerfectSession = exerciseHistory.some(
    (e) => e.correct === e.total && e.total >= 5,
  );
  const masteredCount = Object.values(cardProgress).filter(
    (cp) => cp.correct >= 3,
  ).length;

  const defs: Omit<AchievementDef, 'unlocked' | 'unlockDate'>[] = [
    {
      id: 'first-step',
      title: '\u0130lk Ad\u0131m',
      description: '\u0130lk al\u0131\u015f\u0131rmas\u0131n\u0131 tamamla',
      icon: BookOpen,
    },
    {
      id: '10-words',
      title: '10 Kelime',
      description: '10 kelime pratik yap',
      icon: Star,
    },
    {
      id: '50-words',
      title: '50 Kelime',
      description: '50 kelime pratik yap',
      icon: Medal,
    },
    {
      id: '100-words',
      title: '100 Kelime',
      description: '100 kelime pratik yap',
      icon: Trophy,
    },
    {
      id: '3-streak',
      title: '3 G\u00fcn Seri',
      description: '\u00dcst \u00fcste 3 g\u00fcn pratik yap',
      icon: Flame,
    },
    {
      id: '7-streak',
      title: '7 G\u00fcn Seri',
      description: '\u00dcst \u00fcste 7 g\u00fcn pratik yap',
      icon: Flame,
    },
    {
      id: '30-streak',
      title: '30 G\u00fcn Seri',
      description: '\u00dcst \u00fcste 30 g\u00fcn pratik yap',
      icon: Flame,
    },
    {
      id: 'perfect',
      title: 'M\u00fckemmel',
      description: 'Bir oturumda %100 do\u011fruluk (en az 5 soru)',
      icon: Zap,
    },
    {
      id: 'explorer',
      title: 'Ke\u015ffif\u00e7i',
      description: 'T\u00fcm al\u0131\u015f\u0131rma t\u00fcrlerini dene',
      icon: Compass,
    },
    {
      id: 'master',
      title: 'Usta',
      description: '50 kelimeyi \u00f6\u011fren (her biri en az 3 do\u011fru)',
      icon: GraduationCap,
    },
    {
      id: 'super-master',
      title: 'S\u00fcper Usta',
      description: 'T\u00fcm kelimeleri \u00f6\u011fren',
      icon: Crown,
    },
    {
      id: 'marathon',
      title: 'Maraton',
      description: 'Bir g\u00fcnde 20+ kart tekrarla',
      icon: Target,
    },
  ];

  const conditionMap: Record<string, boolean> = {
    'first-step': totalPracticed >= 1,
    '10-words': totalPracticed >= 10,
    '50-words': totalPracticed >= 50,
    '100-words': totalPracticed >= 100,
    '3-streak': streak >= 3,
    '7-streak': streak >= 7,
    '30-streak': streak >= 30,
    'perfect': hasPerfectSession,
    'explorer': ALL_EXERCISE_TYPES.every((t) => uniqueExercises.has(t)),
    'master': masteredCount >= 50,
    'super-master': masteredCount >= totalWords && totalWords > 0,
    'marathon': todayReviewed >= 20,
  };

  return defs.map((d) => ({
    ...d,
    unlocked: conditionMap[d.id] ?? false,
    unlockDate: findUnlockDate(d.id, exerciseHistory, cardProgress, totalWords),
  }));
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function AchievementsModule() {
  const {
    totalPracticed,
    correctAnswers,
    streak,
    todayReviewed,
    cardProgress,
    exerciseHistory,
  } = useAppStore();

  const totalWords = wordPairs.length;

  /* ---------- computed: today accuracy ---------- */
  const todayAccuracy = useMemo(() => {
    const today = getTodayStr();
    const todayEntries = exerciseHistory.filter(
      (e) => toDayStr(e.date) === today,
    );
    if (todayEntries.length === 0) return 0;
    const totalCorrect = todayEntries.reduce((s, e) => s + e.correct, 0);
    const totalQ = todayEntries.reduce((s, e) => s + e.total, 0);
    return totalQ > 0 ? (totalCorrect / totalQ) * 100 : 0;
  }, [exerciseHistory]);

  /* ---------- computed: best streak ---------- */
  const bestStreak = useMemo(
    () => calcBestStreak(exerciseHistory),
    [exerciseHistory],
  );

  /* ---------- computed: mastered words ---------- */
  const masteredCount = useMemo(
    () => Object.values(cardProgress).filter((cp) => cp.correct >= 3).length,
    [cardProgress],
  );

  /* ---------- computed: overall accuracy ---------- */
  const overallAccuracy = useMemo(
    () =>
      totalPracticed > 0
        ? Math.round((correctAnswers / totalPracticed) * 100)
        : 0,
    [totalPracticed, correctAnswers],
  );

  /* ---------- daily goals ---------- */
  const goals = useMemo(() => {
    const goal1Progress = Math.min(todayReviewed / 20, 1);
    const goal2Progress = Math.min(todayAccuracy / 80, 1);
    const goal3Done = streak >= 1;
    const goal3Progress = goal3Done ? 1 : 0;

    return [
      {
        label: '20 kart tekrarla',
        current: todayReviewed,
        target: 20,
        progress: goal1Progress,
        done: goal1Progress >= 1,
        displayValue: `${todayReviewed}/20`,
      },
      {
        label: 'En az %80 do\u011fruluk',
        current: Math.round(todayAccuracy),
        target: 80,
        progress: goal2Progress,
        done: todayAccuracy >= 80,
        displayValue: `%${Math.round(todayAccuracy)}`,
      },
      {
        label: 'Seriyi devam ettir',
        current: streak,
        target: 1,
        progress: goal3Progress,
        done: goal3Done,
        displayValue: `${streak} g\u00fcn`,
      },
    ];
  }, [todayReviewed, todayAccuracy, streak]);

  const allGoalsDone = goals.every((g) => g.done);
  const dailyCompletionPct = Math.round(
    (goals.reduce((s, g) => s + (g.done ? 1 : 0), 0) / goals.length) * 100,
  );

  /* ---------- achievements ---------- */
  const achievements = useMemo(
    () =>
      buildAchievements(
        totalPracticed,
        streak,
        exerciseHistory,
        cardProgress,
        totalWords,
        todayReviewed,
      ),
    [totalPracticed, streak, exerciseHistory, cardProgress, totalWords, todayReviewed],
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* ---- Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 px-6 py-8 shadow-sm text-white"
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Award className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Ba\u015far\u0131mlar &amp; Hedefler
            </h1>
            <p className="mt-0.5 text-sm text-white/80">
              G\u00fcn\u00fcl\u00fck hedeflerini takip et, ba\u015far\u0131mlar\u0131n\u0131 a\u00e7
            </p>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-4 right-16 h-20 w-20 rounded-full bg-white/10" />
      </motion.div>

      {/* ---- Daily Goals ---- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            {/* Section header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  G\u00fcn\u00fcl\u00fck Hedefler
                </h2>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                %{dailyCompletionPct}
              </span>
            </div>

            {/* Overall progress bar */}
            <Progress value={dailyCompletionPct} className="mb-5 h-2.5" />

            {/* Goal items */}
            <div className="flex flex-col gap-4">
              {goals.map((goal) => (
                <div key={goal.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {goal.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">
                        {goal.displayValue}
                      </span>
                      {goal.done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </div>
                  </div>
                  <Progress
                    value={Math.round(goal.progress * 100)}
                    className={cn(
                      'h-1.5 transition-all',
                      goal.done && '[&>div]:bg-emerald-500',
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Celebration message */}
            {allGoalsDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="mt-5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 dark:from-emerald-950/40 dark:to-teal-950/40"
              >
                <PartyPopper className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  T\u00fcm g\u00fcn\u00fcl\u00fck hedefler tamamland\u0131! Harika bir g\u00fcn!
                </span>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* ---- Achievements ---- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-foreground">
              Ba\u015far\u0131mlar
            </h2>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {unlockedCount}/{TOTAL_ACHIEVEMENTS} Ba\u015far\u0131m Kazan\u0131ld\u0131
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {achievements.map((ach, i) => {
            const Icon = ach.unlocked ? ach.icon : Lock;
            return (
              <motion.div
                key={ach.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <Card
                  className={cn(
                    'h-full rounded-2xl border-0 shadow-sm transition-colors',
                    ach.unlocked
                      ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30'
                      : 'bg-muted/50 opacity-50',
                  )}
                >
                  <CardContent className="flex h-full flex-col items-center gap-2 p-4 text-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl',
                        ach.unlocked
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3
                      className={cn(
                        'text-sm font-semibold leading-tight',
                        ach.unlocked
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {ach.title}
                    </h3>

                    <p
                      className={cn(
                        'text-xs leading-snug',
                        ach.unlocked
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/60',
                      )}
                    >
                      {ach.unlocked ? ach.description : '???'}
                    </p>

                    {ach.unlocked && ach.unlockDate && (
                      <p className="mt-auto pt-1 text-[10px] text-muted-foreground/70">
                        {formatDateTurkish(ach.unlockDate)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ---- Statistics Summary ---- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-foreground">
                \u0130statistikler
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatItem
                icon={BookOpen}
                label="Toplam Pratik"
                value={totalPracticed.toString()}
              />
              <StatItem
                icon={CheckCircle2}
                label="Do\u011fru Cevap"
                value={correctAnswers.toString()}
              />
              <StatItem
                icon={TrendingUp}
                label="Do\u011fruluk"
                value={`%${overallAccuracy}`}
              />
              <StatItem
                icon={Flame}
                label="Mevcut Seri"
                value={`${streak} g\u00fcn`}
              />
              <StatItem
                icon={Calendar}
                label="En \u0130yi Seri"
                value={`${bestStreak} g\u00fcn`}
              />
              <StatItem
                icon={GraduationCap}
                label="\u00d6\u011frenilen Kelime"
                value={`${masteredCount}/${totalWords}`}
              />
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat sub-component                                                 */
/* ------------------------------------------------------------------ */

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/50 px-3 py-4">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-lg font-bold tabular-nums text-foreground">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
