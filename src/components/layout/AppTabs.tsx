'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Close menu on Escape
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

  const activeLabel = navItems.find((n) => n.id === activeModule)?.label || 'Ana Sayfa';
  const ActiveIcon = navItems.find((n) => n.id === activeModule)?.icon || Sparkles;

  return (
    <>
      {/* ── Unified Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
          {/* Logo + Active Module Name */}
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

            {/* Grid Menu Button */}
            <div className="relative" ref={menuRef}>
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

              {/* ── Dropdown Menu Panel ────────────────────────────── */}
              <AnimatePresence>
                {menuOpen && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                      onClick={() => setMenuOpen(false)}
                    />

                    {/* Panel */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute right-0 top-full z-50 mt-2 w-[320px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-black/10 sm:w-[380px]"
                    >
                      {/* Panel header */}
                      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Menü
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <ActiveIcon className="h-3 w-3 text-emerald-600" />
                          <span>{activeLabel}</span>
                        </div>
                      </div>

                      {/* Nav grid */}
                      <div className="grid grid-cols-4 gap-0.5 p-2 max-h-[70vh] overflow-y-auto">
                        {navItems.map((item) => {
                          const isActive = activeModule === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelect(item.id)}
                              className={cn(
                                'flex flex-col items-center gap-1.5 rounded-xl px-1 py-3 transition-all duration-150',
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                              )}
                            >
                              <div
                                className={cn(
                                  'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                                  isActive
                                    ? 'bg-emerald-100'
                                    : 'bg-gray-100 group-hover:bg-gray-200'
                                )}
                              >
                                <item.icon className="h-[18px] w-[18px]" />
                              </div>
                              <span className="truncate text-[10px] font-medium leading-tight w-full text-center">
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Mobile category clear (shown only on small screens) */}
                      {selectedCategories.length > 0 && (
                        <div className="flex border-t border-gray-100 p-2 sm:hidden">
                          <button
                            onClick={() => { clearCategories(); setMenuOpen(false); }}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs text-red-500 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                            Kategori filtresini temizle ({selectedCategories.length})
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
