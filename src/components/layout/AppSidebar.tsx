'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { navItems } from '@/lib/constants';

export function AppSidebar() {
  const { activeModule, setActiveModule } = useAppStore();

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-gray-200 md:bg-white">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-bold text-emerald-700">DeutschMemo</span>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeModule === item.id
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4">
        <Separator className="mb-3" />
        <p className="text-xs text-muted-foreground">Almanca B1 Seviyesi</p>
      </div>
    </aside>
  );
}
