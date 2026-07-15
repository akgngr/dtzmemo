'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { categories } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { navItems } from '@/lib/constants';

export function AppTabs() {
  const { activeModule, setActiveModule, selectedCategories, clearCategories } = useAppStore();

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-emerald-700 text-sm">DeutschMemo</span>
          </div>
          {selectedCategories.length > 0 && (
            <div className="flex items-center gap-1.5">
              {selectedCategories.length === 1 ? (
                <Badge
                  variant="secondary"
                  className="cursor-pointer text-xs"
                  onClick={clearCategories}
                >
                  {categories.find((c) => c.id === selectedCategories[0])?.nameTr} ✕
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="cursor-pointer text-xs"
                  onClick={clearCategories}
                >
                  {selectedCategories.length} kategori ✕
                </Badge>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Bottom Tab Navigation - Mobile */}
      <nav className="sticky bottom-0 z-30 border-t border-gray-200 bg-white md:hidden">
        <div className="flex overflow-x-auto scrollbar-hide justify-around py-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1.5 text-xs transition-colors min-w-[40px] shrink-0 ${
                activeModule === item.id ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="truncate text-[9px] leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
