'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LayoutGrid, X, ArrowLeft, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { categories } from '@/lib/german-data';
import { useAppStore } from '@/lib/store';
import { navItems, b1ExamItems } from '@/lib/constants';
import { cn } from '@/lib/utils';

type MenuView = 'main' | 'b1-exam';

export function AppTabs() {
  const { activeModule, setActiveModule, selectedCategories, clearCategories } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<MenuView>('main');

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (menuView === 'b1-exam') setMenuView('main');
        else setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen, menuView]);

  const handleSelect = (id: string) => {
    setActiveModule(id);
    setMenuOpen(false);
    setMenuView('main');
  };

  const handleB1Click = () => {
    setMenuView('b1-exam');
  };

  const handleBack = () => {
    setMenuView('main');
  };

  // Find label for active module
  const getActiveLabel = () => {
    // Check main nav
    for (const item of navItems) {
      if (item.id === activeModule) return item.label;
    }
    // Check B1 exam sub-items
    for (const item of b1ExamItems) {
      if (item.id === activeModule) return `B1 Sınavı > ${item.label}`;
    }
    return 'Ana Sayfa';
  };

  const isB1View = menuView === 'b1-exam';

  return (
    <>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-bold text-emerald-700 leading-tight">DeutschMemo</span>
              <span className="block text-[10px] text-gray-400 leading-tight truncate">Almanca B1 Seviyesi</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedCategories.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5">
                <Badge variant="secondary" className="cursor-pointer text-xs" onClick={clearCategories}>
                  {selectedCategories.length === 1
                    ? categories.find((c) => c.id === selectedCategories[0])?.nameTr + ' \u2715'
                    : selectedCategories.length + ' kategori \u2715'}
                </Badge>
              </div>
            )}
            <button
              onClick={() => { setMenuOpen(!menuOpen); setMenuView('main'); }}
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

      {/* ── Menu Overlay ────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/40 backdrop-blur-md"
            onClick={() => { setMenuOpen(false); setMenuView('main'); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mx-auto mt-auto mb-auto flex w-full max-w-lg flex-col rounded-t-3xl bg-white/95 backdrop-blur-xl shadow-2xl sm:mx-auto sm:mt-auto sm:mb-auto sm:rounded-3xl sm:max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-gray-300" />
              </div>

              {/* Menu header */}
              <div className="flex items-center justify-between px-5 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {isB1View ? 'B1 Sınavı' : 'Menü'}
                </span>
                <button
                  onClick={() => { setMenuOpen(false); setMenuView('main'); }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Nav grid */}
              <div className="grid grid-cols-4 gap-1 overflow-y-auto px-3 pb-4 sm:gap-2 sm:px-4">
                <AnimatePresence mode="wait">
                  {!isB1View ? (
                    /* ── MAIN MENU ── */
                    <motion.div
                      key="main-menu"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="contents"
                    >
                      {navItems.map((item, i) => {
                        const isActive = activeModule === item.id;

                        // B1 Sınavı — special group button
                        if (item.isGroup) {
                          const isB1Active = activeModule.startsWith('exam-');
                          return (
                            <motion.button
                              key={item.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.02, duration: 0.2 }}
                              onClick={handleB1Click}
                              className={cn(
                                'flex flex-col items-center gap-2 rounded-2xl px-2 py-4 transition-all duration-150',
                                isB1Active
                                  ? 'bg-violet-500 text-white shadow-md shadow-violet-200'
                                  : 'text-gray-600 hover:bg-violet-50 hover:text-violet-700 active:scale-95'
                              )}
                            >
                              <div className={cn(
                                'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                                isB1Active ? 'bg-white/20' : 'bg-violet-100'
                              )}>
                                <item.icon className="h-5 w-5" />
                              </div>
                              <span className="truncate text-[11px] font-medium leading-tight w-full text-center">{item.label}</span>
                            </motion.button>
                          );
                        }

                        // Regular item
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
                            <div className={cn(
                              'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                              isActive ? 'bg-white/20' : 'bg-gray-100'
                            )}>
                              <item.icon className="h-5 w-5" />
                            </div>
                            <span className="truncate text-[11px] font-medium leading-tight w-full text-center">{item.label}</span>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  ) : (
                    /* ── B1 EXAM SUB-MENU ── */
                    <motion.div
                      key="b1-exam-menu"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.2 }}
                      className="contents"
                    >
                      {b1ExamItems.map((item, i) => {
                        const isActive = activeModule === item.id;
                        return (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.2 }}
                            onClick={() => handleSelect(item.id)}
                            className={cn(
                              'flex flex-col items-center gap-2 rounded-2xl px-2 py-4 transition-all duration-150',
                              isActive
                                ? 'bg-violet-500 text-white shadow-md shadow-violet-200'
                                : 'text-gray-600 hover:bg-violet-50 hover:text-violet-700 active:scale-95'
                            )}
                          >
                            <div className={cn(
                              'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                              isActive ? 'bg-white/20' : 'bg-violet-100'
                            )}>
                              <item.icon className="h-5 w-5" />
                            </div>
                            <span className="truncate text-[11px] font-semibold leading-tight w-full text-center">{item.label}</span>
                            {item.sublabel && (
                              <span className="truncate text-[9px] leading-tight w-full text-center opacity-60">{item.sublabel}</span>
                            )}
                          </motion.button>
                        );
                      })}

                      {/* BACK button */}
                      <motion.button
                        key="back-btn"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: b1ExamItems.length * 0.05, duration: 0.2 }}
                        onClick={handleBack}
                        className="flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:scale-95 transition-all duration-150"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
                          <ArrowLeft className="h-5 w-5" />
                        </div>
                        <span className="truncate text-[11px] font-medium leading-tight w-full text-center">Geri</span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Category clear */}
              {selectedCategories.length > 0 && !isB1View && (
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

      {/* Update module label in store */}
      <ActiveModuleLabelSetter label={getActiveLabel()} />
    </>
  );
}

function ActiveModuleLabelSetter({ label }: { label: string }) {
  const setModuleLabel = useAppStore((s) => s.setModuleLabel);
  useEffect(() => { setModuleLabel(label); }, [label, setModuleLabel]);
  return null;
}
