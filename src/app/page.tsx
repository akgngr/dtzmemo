'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { categories } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { navItems } from '@/lib/constants';

// Layout
import { AppTabs } from '@/components/layout/AppTabs';

// Modules
import { Dashboard } from '@/components/modules/Dashboard';
import { FlashcardModule } from '@/components/modules/FlashcardModule';
import { FillBlankModule } from '@/components/modules/FillBlankModule';
import { WordCompletionModule } from '@/components/modules/WordCompletionModule';
import { DragDropModule } from '@/components/modules/DragDropModule';
import { MatchingModule } from '@/components/modules/MatchingModule';
import { WordMemorizationModule } from '@/components/modules/WordMemorizationModule';
import { VocabModule } from '@/components/modules/VocabModule';
import { VocabExplorerModule } from '@/components/modules/VocabExplorerModule';
import { PronunciationTrainerModule } from '@/components/modules/PronunciationTrainerModule';
import { CompetitionModule } from '@/components/modules/CompetitionModule';
import { ConversationModule } from '@/components/modules/ConversationModule';
import { StatisticsModule } from '@/components/modules/StatisticsModule';
import { SettingsModule } from '@/components/modules/SettingsModule';
import { SpacedRepetitionModule } from '@/components/modules/SpacedRepetitionModule';
import { ListeningModule } from '@/components/modules/ListeningModule';
import { ReadingModule } from '@/components/modules/ReadingModule';
import { QuizModule } from '@/components/modules/QuizModule';
import { AchievementsModule } from '@/components/modules/AchievementsModule';

const moduleMap: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  flashcards: FlashcardModule,
  'fill-blank': FillBlankModule,
  'word-completion': WordCompletionModule,
  'drag-drop': DragDropModule,
  matching: MatchingModule,
  'kelime-ezber': WordMemorizationModule,
  vocab: VocabModule,
  'vocab-explorer': VocabExplorerModule,
  pronunciation: PronunciationTrainerModule,
  conversation: ConversationModule,
  competition: CompetitionModule,
  'spaced-repetition': SpacedRepetitionModule,
  listening: ListeningModule,
  reading: ReadingModule,
  quiz: QuizModule,
  achievements: AchievementsModule,
  statistics: StatisticsModule,
  settings: SettingsModule,
};

export default function Home() {
  const { activeModule, selectedCategories } = useAppStore();

  const ActiveComponent = moduleMap[activeModule] || Dashboard;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Unified Header with Grid Menu */}
      <AppTabs />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
          {/* Module title */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {navItems.find((n) => n.id === activeModule)?.label || 'Ana Sayfa'}
              </h1>
              {selectedCategories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedCategories.map((catId) => (
                    <Badge
                      key={catId}
                      variant="secondary"
                      className="cursor-pointer text-xs"
                      onClick={() => useAppStore.getState().toggleCategory(catId)}
                    >
                      {categories.find((c) => c.id === catId)?.nameTr} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeModule}-${selectedCategories.join(',')}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
