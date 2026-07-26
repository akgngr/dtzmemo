'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LayoutGrid, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { categories } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { navItems } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function AppTabs() {
  const { activeModule, setActiveModule, selectedCategories, clearCategories } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  const handleSelect = (id: string) => {
    setActiveModule(id);
    setMenuOpen(false);
  };

  return (
    <>
      {/* ── Unified Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-bold text-emerald-700 leading-tight">DeutschMemo</span>
              <span className="block text-[10px] text-gray-400 leading-tight truncate">Almanca B1 Seviyesi</span>
            </div>
          </div>

          {/* Right side: category badges + grid menu button */}
          <div className="flex items-center gap-2">
            {selectedCategories.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5">
                {selectedCategories.length === 1 ? (
                  <Badge variant="secondary" className="cursor-pointer text-xs" onClick={clearCategories}>
                    {categories.find((c) => c.id === selectedCategories[0])?.nameTr} ✕
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="cursor-pointer text-xs" onClick={clearCategories}>
                    {selectedCategories.length} kategori ✕
                  </Badge>
                )}
              </div>
            )}

            {/* Grid Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200',
                menuOpen
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              )}
              aria-label="Menü"
            >
              <LayoutGrid className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Full-Screen Menu Overlay ──────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/40 backdrop-blur-md"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mx-auto mt-auto mb-auto flex w-full max-w-lg flex-col rounded-t-3xl bg-white/95 backdrop-blur-xl shadow-2xl sm:mx-auto sm:mt-auto sm:mb-auto sm:rounded-3xl sm:max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-gray-300" />
              </div>

              {/* Menu header */}
              <div className="flex items-center justify-between px-5 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Menü
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Nav grid — 4 columns, scrollable if needed */}
              <div className="grid grid-cols-4 gap-1 overflow-y-auto px-3 pb-4 sm:gap-2 sm:px-4">
                {navItems.map((item, i) => {
                  const isActive = activeModule === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.2 }}
                      onClick={() => handleSelect(item.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-2xl px-2 py-4 transition-all duration-150',
                        isActive
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                          : 'text-gray-600 hover:bg-white/80 hover:text-gray-900 active:scale-95'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                          isActive
                            ? 'bg-white/20'
                            : 'bg-gray-100'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="truncate text-[11px] font-medium leading-tight w-full text-center">
                        {item.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Mobile category clear */}
              {selectedCategories.length > 0 && (
                <div className="border-t border-gray-200/50 px-4 py-3">
                  <button
                    onClick={() => { clearCategories(); setMenuOpen(false); }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Kategori filtresini temizle ({selectedCategories.length})
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
