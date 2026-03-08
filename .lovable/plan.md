

# Bug Fix Plan: Scoring, Suggestions, and Loading States

## Root Causes Identified

### Bug 1: All Scores are 0 (CRITICAL)
`calculateCategoryScore()` in `src/utils/userProfile.ts` line 84 uses `r.question_id.includes(category)` to match responses to categories. But `question_id` stores the full question text (e.g., "I enjoy writing essays, stories, or journal entries for fun."), which does NOT contain the category name (e.g., "Linguistic"). So **zero questions match**, all scores = 0, all career compatibility = 0%.

**Fix:** Build a reverse lookup map from question text → category using the `LAYER_X_QUESTIONS` data. Match responses to categories via this map instead of string inclusion.

### Bug 2: "Complete the assessment to see your profile"
The OverviewTab radar chart shows this when `radarSlice.length === 0`, which happens because all scores are 0 and get filtered out. Fixing Bug 1 fixes this.

### Bug 3: Suggest Button Returns Nothing
`handleSuggestions()` (line 229-245) checks `PREDETERMINED_SUGGESTIONS[question]` — if not found, the `else if (layer === 6)` block is **empty** (just an empty try/catch). It never calls the AI. The button sets loading then immediately clears it.

**Fix:** When no predetermined suggestions exist, call the AI via `gemini-assist` edge function (same as `handleAISuggestions`).

### Bug 4: No Loading UI for Explain/Suggest
The Explain button has no spinner — `handleExplanation` sets `aiLoading` to `question + 'explain'` but the Explain button doesn't check this state to show a loader. The Suggest button already has a spinner (line 532-533).

**Fix:** Add loading spinner to the Explain button, checking `aiLoading === q + 'explain'`.

---

## Implementation

### File 1: `src/utils/userProfile.ts`
- Build a `questionToCategoryMap` from all LAYER_X_QUESTIONS at module level
- Rewrite `calculateCategoryScore()` to use this map instead of `r.question_id.includes(category)`

### File 2: `src/pages/Assessment.tsx`
- Fix `handleSuggestions()`: when no predetermined suggestions exist, call `gemini-assist` with mode `'suggest'` and parse the response
- Add loading spinner to Explain button (check `aiLoading === q + 'explain'`)

These two files are the only changes needed. All downstream components (Results, OverviewTab, ScoreBreakdown, CareerPathsPanel) will work correctly once scores are non-zero.

