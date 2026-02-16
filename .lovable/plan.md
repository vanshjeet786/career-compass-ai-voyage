

## Comprehensive Bug Fix, Pre-Assessment Page, and Layer 6 Enhancement Plan

### Critical Bugs Found

1. **Runtime Error: `Y.includes is not a function`** -- In `nextLayer()` (Assessment.tsx line 258-263), `Object.values(layerData).flat()` for Layer 6 flattens objects like `{instructions, questions}` into the array. Then on line 275, `q.includes("Passion_Practicality")` fails because `q` is an object, not a string. The Layer 6 flattening logic is broken for both branches.

2. **Missing `background_info` column** -- `BackgroundInfo.tsx` inserts `background_info` into the `assessments` table, but this column does not exist in the database schema. This causes a silent insert failure.

3. **`assessment_results` join issue** -- `useAssessmentHistory.ts` queries `assessment_results` as a nested relation of `assessments`, which should work if the FK exists, but results may not be populated since nothing writes to `assessment_results`.

4. **Layer 6 question type detection is incomplete** -- The `isOpenEndedQuestion` function uses regex patterns that don't match all Layer 6 open-ended questions. For example, "How confident do you feel in your current career direction? (1-5)" is NOT open-ended but matches no special case, so it falls through to the wrong input type.

5. **Confidence Check "1-5" question** -- "How confident do you feel in your current career direction? (1-5)" should use a Likert scale, not a text box, but the current code treats it as open-ended since it's in Layer 6 and doesn't match Likert logic.

---

### Implementation Plan

#### 1. Database Migration: Add `background_info` column
- Add a `background_info JSONB` column to the `assessments` table so BackgroundInfo.tsx can save data properly.

#### 2. Fix Assessment.tsx - Layer 6 Flattening Bug
- Rewrite `nextLayer()` validation to properly handle Layer 6's mixed structure (arrays and `{instructions, questions}` objects).
- Ensure `actualQuestions` is always an array of strings for all layers.
- Use the same flattening logic for both Layer 6 and other layers.

#### 3. Fix Layer 6 Question Type Detection
- Create a proper classification system for Layer 6 questions:
  - **Open-ended (textarea)**: Questions ending with `(open-ended)`
  - **Likert scale**: Passion Practicality questions, Career Clustering questions, and "How confident..." (1-5)
  - **Multi-input**: "My top 3 career interest areas are:" (3 text boxes)
- Replace the regex-based `isOpenEndedQuestion` with a deterministic lookup or clearer logic.

#### 4. Create Pre-Assessment BackgroundInfo Page
- Enhance the existing `BackgroundInfo.tsx` with additional fields:
  - Age range, education level, location preference
  - Career goals summary
  - Previous career counseling experience
- Fix the data flow: after submitting, navigate to `/assessment` properly
- Add the route link from the Index page ("Start Your Journey" should go to `/background-info` for new users)

#### 5. Layer 6 Mandatory Validation with Scroll-to-Missing
- When a user tries to advance but has unanswered questions, scroll to the first unanswered question instead of just showing a toast.
- Add visual indicators (red border) on unanswered mandatory questions.
- Skip Passion Practicality validation if career interests are not filled.

#### 6. Layer 6 Question Rendering Overhaul
Close reading of every Layer 6 question and its correct input type:

**Self_Synthesis (7 questions):**
- Q1-5, Q7: Open-ended textarea (marked with `(open-ended)`)
- Q6 "My top 3 career interest areas are:": 3 text input boxes (already implemented)

**Passion_Practicality (15 questions):**
- All: Likert scale (already implemented correctly)

**Confidence_Check (4 questions):**
- Q1 "How confident... (1-5)": Likert scale (NOT open-ended)
- Q2-4: Open-ended textarea (marked with `(open-ended)`)

**Career_Clustering (8 questions):**
- Q1-7: Likert scale rating
- Q8 "Other (Please specify...)": Likert + text box for custom cluster

**Action_Plan (1 question):**
- Q1: Open-ended textarea

---

### Technical Details

**Files to modify:**
- `src/pages/Assessment.tsx` -- Fix flattening bug, question type detection, scroll-to-missing validation
- `src/pages/BackgroundInfo.tsx` -- Enhance with more fields, fix navigation flow
- `src/pages/Index.tsx` -- Route new users to `/background-info` instead of directly to `/assessment`
- `src/App.tsx` -- Ensure routes are correct
- `supabase/migrations/` -- Add `background_info` column to `assessments`

**Key logic changes:**
- Replace `isOpenEndedQuestion()` with a deterministic function that checks: (a) ends with `(open-ended)` = textarea, (b) is "My top 3 career interest areas" = multi-input, (c) is in Passion_Practicality or Career_Clustering sections = Likert, (d) contains "(1-5)" = Likert, (e) everything else in Layer 6 defaults to Likert
- Fix `nextLayer()` to properly flatten all layer data structures before validation
- Add `scrollIntoView` for first missing question element

