

# Comprehensive Assessment Analysis — Issues Found

I reviewed every key file, the database schema, actual stored data, and the full user flow. Here's what I found:

---

## CRITICAL BUG: Changing an answer does NOT save to the database

**Severity: Critical**

In `Assessment.tsx` line 190, `saveResponse()` uses `supabase.from("assessment_responses").insert(...)`. However, the database has a **unique constraint** on `(assessment_id, question_id)`. This means:

- First time answering a question: works fine, row is inserted.
- **Changing your answer**: the `insert()` **silently fails** because a row already exists for that question. The local React state updates (so the UI looks correct), but the **database still has the original answer**.

**Impact**: If a user changes any answer during the assessment, the change is lost. Only their first response is permanently recorded. This corrupts all scoring and AI analysis.

**Fix**: Change `.insert()` to `.upsert()` with `onConflict: 'assessment_id,question_id'`.

---

## BUG: "New Assessment" button resumes old in-progress assessment

**Severity: Medium**

The Assessment page (lines 152-171) first checks for any `in_progress` assessment and resumes it. Clicking "New Assessment" from the navbar or dashboard doesn't start a fresh assessment — it resumes whatever was left unfinished.

**Impact**: User expects a fresh start but gets dropped into a half-completed old assessment.

**Fix**: The "New Assessment" button should explicitly create a new assessment (or mark the old one as abandoned) rather than relying on the Assessment page's auto-resume logic.

---

## BUG: BackgroundInfo creates orphaned assessments

**Severity: Medium**

`BackgroundInfo.tsx` always creates a NEW assessment on submit (line 40-53). If a user visits Background Info from the dashboard to "update their profile," it creates yet another in-progress assessment, leaving the previous one orphaned.

**Impact**: Orphaned assessments clutter the database and dashboard history. The Profile page's "Completion" stats become misleading (shows e.g., 2/7 completed when 5 were abandoned).

**Fix**: BackgroundInfo should either update an existing in-progress assessment or clearly be separated from the "update profile" concept.

---

## BUG: Navbar "Results" link shows error page

**Severity: Low-Medium**

The navbar "Results" link and avatar dropdown both navigate to `/results` without an assessment ID. The Results page then shows "No assessment selected — We could not find an assessment id in the URL."

**Fix**: Auto-redirect to the latest completed assessment's results, or show a list of completed assessments to pick from.

---

## ISSUE: Assessment completion uses `window.location.href` instead of `navigate()`

**Severity: Low**

Line 319: `window.location.href = "/results?assess=" + assessmentId` causes a full page reload, losing all React state and forcing re-initialization.

**Fix**: Use `navigate(`/results?assess=${assessmentId}`)`.

---

## ISSUE: No way to truly delete or restart a stuck assessment

**Severity: Low**

If an assessment gets stuck at layer 6 (e.g., the one at `464b5394` in the DB which is `in_progress` at layer 6), there's no UI to abandon or restart it. The user is stuck.

---

## Data Integrity Verification (PASSED)

- All 6 layers have the correct question counts (43, 21, 18, 12, 11, 35).
- No duplicate responses found in any completed assessment.
- Scoring weights are properly capped at 5.0.
- Layer 6 qualitative data is correctly extracted for AI analysis.
- Career compatibility scoring formula works correctly against the profile data.

---

## AI Integration Analysis (MOSTLY OK)

- The "Explain" feature calls `aiService.chatResponse()` which invokes `gemini-assist` in `chat` mode — works but is wasteful for simple explanations.
- The "Suggest" feature correctly checks `PREDETERMINED_SUGGESTIONS` first, falls back to AI — but the predetermined suggestions don't match any actual question text in the assessment (keys in suggestions.ts don't match question strings in questions.ts), so **predetermined suggestions are NEVER used** and it always calls the AI.
- `handleAISuggestions` (line 265) accesses `data.text` which could be undefined if the edge function returns `generatedText` but not `text` — potential crash.

---

## Summary of Required Fixes (Priority Order)

1. **Critical**: Change `insert()` to `upsert()` in `saveResponse()` so answer changes persist
2. **Medium**: Fix "New Assessment" to actually create a new assessment
3. **Medium**: Fix BackgroundInfo to not create orphaned assessments
4. **Medium**: Fix predetermined suggestions keys to match actual question text (or remove the dead code)
5. **Low**: Fix Results navigation to auto-select latest completed assessment
6. **Low**: Replace `window.location.href` with `navigate()`
7. **Low**: Add null-safe access for `data.text` in AI suggestion handler

