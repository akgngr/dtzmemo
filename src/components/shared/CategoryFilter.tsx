'use client';

import React, { useState } from 'react';
import { X, Filter, ChevronDown, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { categories } from '@/lib/german-data';
import { vocabulary } from '@/lib/vocabulary-data';
import { useAppStore } from '@/lib/store';
import { iconMap, colorMap } from '@/lib/constants';

export function CategoryFilter() {
  const { selectedCategories, toggleCategory, clearCategories } = useAppStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCategories.map((catId) => {
            const cat = categories.find((c) => c.id === catId);
            if (!cat) return null;
            const Icon = iconMap[cat.icon] || BookOpen;
            const clr = colorMap[cat.color] || colorMap.emerald;
            return (
              <Badge
                key={catId}
                className={`${clr.bg} text-white border-0 cursor-pointer text-xs gap-1`}
                onClick={() => toggleCategory(catId)}
              >
                <Icon className="h-3 w-3" />
                {cat.nameTr}
                <X className="h-3 w-3 ml-0.5" />
              </Badge>
            );
          })}
          <Badge
            variant="outline"
            className="cursor-pointer text-xs text-red-500 border-red-300 hover:bg-red-50"
            onClick={clearCategories}
          >
            Temizle
          </Badge>
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-sm font-normal"
          >
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {selectedCategories.length === 0
                ? 'Tüm kategoriler'
                : `${selectedCategories.length} kategori seçili`
              }
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={4}>
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Kategoriler</span>
              {selectedCategories.length > 0 && (
                <Button variant="ghost" size="sm" className="h-auto p-1 text-xs text-red-500" onClick={clearCategories}>
                  Tümünü Temizle
                </Button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto max-h-60 p-2">
            {categories.map((cat) => {
              const Icon = iconMap[cat.icon] || BookOpen;
              const isSelected = selectedCategories.includes(cat.id);
              const clr = colorMap[cat.color] || colorMap.emerald;
              return (
                <div
                  key={cat.id}
                  role="option"
                  aria-selected={isSelected}
                  className={`flex w-full items-center gap-3 rounded-md px-2 py-2 cursor-pointer transition-colors text-left ${
                    isSelected ? clr.light : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleCategory(cat.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    className="pointer-events-none"
                  />
                  <Icon className={`h-4 w-4 shrink-0 ${isSelected ? clr.text : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${isSelected ? clr.text : ''}`}>{cat.nameTr}</div>
                    <div className="text-xs text-muted-foreground truncate">{cat.name}</div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {vocabulary.filter((w) => w.category === cat.id).length}
                  </span>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
