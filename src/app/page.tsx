'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { categories } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { navItems } from '@/lib/constants';

// Layout
import { AppSidebar } from '@/components/layout/AppSidebar';
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
  statistics: StatisticsModule,
  settings: SettingsModule,
};

export default function Home() {
  const { activeModule, selectedCategories } = useAppStore();

  const ActiveComponent = moduleMap[activeModule] || Dashboard;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <AppSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Mobile Header + Bottom Tabs */}
          <AppTabs />

          {/* Content Area */}
          <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Module title - Desktop */}
            <div className="mb-6 hidden md:flex md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {navItems.find((n) => n.id === activeModule)?.label || 'Ana Sayfa'}
                </h1>
                {selectedCategories.length > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kategori:{' '}
                    <span className="inline-flex flex-wrap gap-1">
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
                    </span>
                  </p>
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
    </div>
  );
}
