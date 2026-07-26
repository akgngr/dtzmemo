# Task: SpacedRepetitionModule (SM-2 Review Module)

## Summary
Created `/home/z/my-project/src/components/modules/SpacedRepetitionModule.tsx` —
a SM-2 spaced-repetition review module for the DeutschMemo (German-Turkish B1)
vocabulary learning app.

## File Created

**`/home/z/my-project/src/components/modules/SpacedRepetitionModule.tsx`**

- ~510 lines, single React client component
- Exported as `export function SpacedRepetitionModule()`

## Implementation Details

### Screen State Machine (`'overview' | 'review' | 'summary'`)

1. **Overview Screen**
   - Gradient header (`from-blue-500 to-cyan-600`) with `RotateCcw` icon,
     Turkish title "Aralıklı Tekrar" and an SM-2 explainer subtitle.
   - Stats cards grid (3 columns on sm+):
     - "Bugün Tekrar Bekleyen" → `dueCards.length` (nextReview ≤ now OR new)
     - "Yeni Kartlar" → cards not present in `cardProgress`
     - "Ustalaşan" → cards where `correct >= 5`
   - Empty state with `Leaf` icon when no cards are due.
   - "Tekrarı Başlat" CTA inside a gradient card (white button on blue).
   - Due-cards preview list (up to 5) showing German/Turkish + per-card
     correct/wrong ratio or a "Yeni" badge.
   - `CategoryFilter` at top — when categories are selected, `dueCards`
     are filtered accordingly.

2. **Review Screen**
   - Ghost "Geri Dön" back button (uses `ArrowLeft` icon, returns to overview).
   - Progress bar + counter badges (current/total + correct so far).
   - Animated flashcard via `AnimatePresence` keyed by card id (slide in/out).
     - Gradient header shows German sentence + category badge + "Almanca" badge.
     - `SpeakButton` (color="blue", label="Dinle") next to the German text.
   - "Cevabı Gör" button reveals Turkish translation in an amber panel.
   - Three rating buttons (left → right): Zor (red), Orta (amber), Güzel (green)
     using `ThumbsDown`, `Minus`, `ThumbsUp` icons.
   - After rating: calls `updateCardProgress(id, rating)` (SM-2 lives in the
     store), `incrementPracticed(rating !== 'hard')`,
     `incrementTodayReviewed()`. Auto-advances after 1s via `setTimeout`.
   - Last card → saves exercise result and transitions to summary.

3. **Summary Screen**
   - Trophy header (color-adaptive gradient based on accuracy).
   - Three stat tiles: Güzel / Orta / Zor counts.
   - Accuracy progress bar + "%".
   - "Tekrar Dene" (outline, returns to overview so updated SM-2 stats show)
     and "Ana Menüye Dön" (calls `setActiveModule('dashboard')`).

### Key Technical Decisions

- **No emojis** — all icons come from `lucide-react` (RotateCcw, Clock,
  Sparkles, CheckCircle2, Leaf, Eye, ArrowLeft, Trophy, Home, ThumbsUp,
  Minus, ThumbsDown).
- **Stale-timeout guard** — `advanceTimerRef` holds the pending auto-advance
  `setTimeout` ID. It is cleared on back/retry/menu so a user who leaves the
  review screen mid-advance can't trigger a stale `setCurrentIndex` on a
  freshly-shuffled deck.
- **Final tally computed synchronously** inside `handleRate` (instead of
  reading `results` inside the timeout callback) because state updates are
  async and we need the correct counts when persisting the exercise result.
- **Fisher–Yates shuffle** with a 30-card session cap (`MAX_SESSION`).
- **Due-card detection** matches the spec exactly: a card is due when
  `!cardProgress[id]` (new) OR `cardProgress[id].nextReview <= Date.now()`.
- **Visual style** matches existing modules: `border-0 shadow-sm rounded-2xl`
  cards, gradient headers, `AnimatePresence` slide transitions,
  `motion.div` fade-ins on stat tiles.
- **SpeakButton color="blue"** is a valid variant per `SpeakButton.tsx`
  (`'emerald' | 'purple' | 'amber' | 'blue' | 'slate'`).
- **Persisted to history** via `saveExerciseResult('flashcards', correct,
  total, selectedCategories)` so it shows up in the Statistics module.

## Lint Status
- `bun run lint` → 0 errors, 1 unrelated pre-existing warning in
  `MatchingModule.tsx` (unused eslint-disable directive). The new file is
  clean.
- Dev server log shows no compile errors after the file was added.

## Integration Notes (for downstream agents)
- The module is NOT yet wired into the navigation. To surface it in the app,
  add an entry to `navItems` in `src/lib/constants.ts` (e.g.
  `{ id: 'spaced-repetition', label: 'Aralıklı Tekrar', icon: RotateCcw }`)
  and render `<SpacedRepetitionModule />` when `activeModule === 'spaced-repetition'`
  in `src/app/page.tsx` (or wherever the active module is dispatched).
- The SM-2 algorithm itself lives in `useAppStore.updateCardProgress` in
  `src/lib/store.ts`; this module only consumes it.
