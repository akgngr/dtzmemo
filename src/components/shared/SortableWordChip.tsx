'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableWordChip({ id, word, isCorrect }: { id: string; word: string; isCorrect?: boolean | null }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`inline-flex select-none items-center rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-colors touch-none ${
        isDragging
          ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400'
          : isCorrect === true
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          : isCorrect === false
          ? 'bg-red-100 text-red-800 border border-red-300'
          : 'bg-white text-gray-800 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
      }`}
    >
      {word}
    </div>
  );
}
