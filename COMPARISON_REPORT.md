# Career Compass AI Voyage vs. Bolt Career Compass: Deep Comparison Report

## 1. Executive Summary

**Bolt-career-compass** represents a significant architectural evolution and simplification of the original **career-compass-ai-voyage**. The transition marks a move from a complex, library-heavy stack (Shadcn UI, React Query, React Hook Form, Gemini) to a streamlined, performance-focused implementation (Custom Tailwind Components, Service Layer, Groq AI).

**Key Differentiators:**
*   **AI Provider Shift:** Moved from **Google Gemini** (Voyage) to **Groq/Qwen-32b** (Bolt) for faster inference.
*   **Logic Decoupling:** Business logic moved from Backend Edge Functions (Voyage) to a Frontend Service Layer (Bolt), treating the backend as a "dumb proxy".
*   **Feature Expansion:** Bolt adds **Progress Tracking** (history comparison), **Detailed Analysis Tabs**, **AI-Enhanced Roadmap**, and **PDF Generation**.
*   **UI Philosophy:** Shifted from a generic component library (Shadcn/Radix) to custom-built, feature-specific components with a distinct visual identity (Dynamic Backgrounds, Animated Gradients).

---

## 2. Architecture & Configuration

| Aspect | Voyage (Original) | Bolt (New/Target) | Significance |
| :--- | :--- | :--- | :--- |
| **Framework** | React + Vite (`plugin-react-swc`) | React + Vite (`plugin-react`) | Minor build tool difference. |
| **TypeScript** | `strict: false`, `noImplicitAny: false` | `strict: true` | **Bolt has stricter type safety**, reducing runtime errors. |
| **Path Aliases** | Uses `@/*` for imports | Uses relative imports (`../../`) | Voyage is easier to refactor; Bolt is more "standard". |
| **Dependencies** | Heavy (`@radix-ui/*`, `react-hook-form`, `zod`, `@tanstack/react-query`) | Minimalist (`react-router-dom`, `recharts`, `lucide-react`) | **Bolt is significantly lighter** and has fewer dependencies to maintain. |
| **Testing** | Full Suite (`vitest`, `playwright`, `@testing-library`) | Minimal (`test_comprehensive.js` script) | Voyage has better test infrastructure; Bolt relies on ad-hoc scripts. |

---

## 3. Database & Data Model

### Data Typing
*   **Voyage:** Relies heavily on **Supabase-generated types** (`src/integrations/supabase/types.ts`). Complex data (scores, insights) is stored as generic `Json` blobs, leading to weak typing in the frontend.
*   **Bolt:** Defines **explicit TypeScript interfaces** (`src/types/index.ts`) like `User`, `Assessment`, `Question`. This ensures better developer experience and data validation.

### Schema Changes
*   **Bolt** introduces new fields to the `Assessment` model:
    *   `backgroundInfo`: Stores user context (Professional, Student, etc.).
    *   `mlPrediction`: Placeholder for future ML integration.
    *   `completedAt`: Explicit timestamp for progress tracking.
*   **Voyage** stores `intelligence_scores`, `personality_insights` as separate columns in `assessment_results`. Bolt aggregates these into a unified `scores` record in the `Assessment` object.

---

## 4. AI Integration

**This is the most significant divergence.**

### Voyage (Gemini)
*   **Backend-Coupled Logic:** The `supabase/functions/gemini-assist` function contains business logic. It calculates scores, parses context, and formats the prompt inside the Edge Function.
*   **Model:** Uses `gemini-2.5-flash`.
*   **Implementation:**
    *   Has specific modes (`explain`, `suggest`, `chat`).
    *   Hardcoded "Persona" prompt in the backend.

### Bolt (Groq)
*   **Frontend-Driven Logic:** The `supabase/functions/groq-ai-service` is a **dumb proxy** that forwards messages to Groq.
*   **Service Layer:** All prompt engineering, context building, and response parsing happens in `src/services/aiService.ts`.
*   **Model:** Uses `qwen/qwen3-32b` via Groq (optimized for speed).
*   **Resilience:**
    *   **Robust Fallback System:** Bolt includes hardcoded `FALLBACK_EXPLANATIONS` and `FALLBACK_SUGGESTIONS` (thousands of lines of text) to ensure the app works even if the AI is down.
    *   **Safety:** Implements `_safeParseJSON` to handle LLM hallucinations.
*   **New Features:**
    *   `generateEnhancedResults`: Synthesizes quantitative (Layers 1-5) and qualitative (Layer 6) data into a structured JSON report with a "Roadmap".
    *   `suggestAnswer`: AI helps users write open-ended responses based on their previous answers.

---

## 5. Scoring & Assessment Logic

### Voyage
*   **Complex Weighting:** Uses a weighted scoring system (`INTELLIGENCE_WEIGHTS`, `PERSONALITY_WEIGHTS`) defined in `src/utils/userProfile.ts`.
*   **Limited Recommendations:**
    *   Hardcoded list of **only 5 careers** (`Data Scientist`, `UX Designer`, `Project Manager`, `Software Engineer`, `Marketing Specialist`).
    *   Calculates a "Compatibility Score" using specific formula weights for each of those 5 careers.
    *   *Result:* Very limited career discovery.

### Bolt
*   **Simplified Scoring:** Calculates simple averages per category in `src/services/assessmentService.ts`.
*   **Broad Recommendations:**
    *   Uses a `CAREER_MAPPING` constant (implied to be large).
    *   Matches high-scoring categories (`>= 3.5`) to potential careers.
    *   **Fallback:** Pads recommendations with a generic list if fewer than 8 matches are found.
    *   *Result:* Much broader, though mathematically simpler, career suggestions.

### Open-Ended Layer (Layer 6)
*   **Voyage:** Treated as a special case in `Assessment.tsx`.
*   **Bolt:** Defined data-driven in `ASSESSMENT_LAYERS` with `isOpenEnded: true`. Bolt's AI explicitly uses these answers ("Qualitative Insights") to refine the final report.

---

## 6. Feature Comparison

| Feature | Voyage | Bolt |
| :--- | :--- | :--- |
| **Progress Tracking** | No. Each assessment is standalone. | **Yes.** Compares current vs previous assessment. Shows "Areas Improved" and "Declines". |
| **Results Dashboard** | Single Scroll Page. | **Tabbed Interface:** Overview, Detailed Analysis, Progress. |
| **PDF Export** | Client-side (`html2canvas` + `jspdf`). | Service-based (`pdfService.ts`). |
| **Chat** | Simple embedded chat widget. | **Context-Aware Sidebar:** Chat knows your scores and previous answers. |
| **User Profile** | Basic Page. | Integrated `BackgroundInfo` collection (Student vs Professional context). |
| **Filtering** | Basic Sort. | **Advanced Filters:** High Growth, High Salary, Best Match. |

---

## 7. UI/UX & Component Structure

### Voyage
*   **Library:** **Shadcn UI** (Radix Primitives + Tailwind).
*   **Structure:** Flat `src/components/ui` directory.
*   **Visuals:** Clean, standard "SaaS" look. Static gradients.
*   **Charts:** Recharts (Bar, Radar).

### Bolt
*   **Library:** **Custom Tailwind Components** (`Card`, `Button`, `Modal`).
*   **Structure:** Feature-based organization (`src/components/Assessment`, `src/components/Results`).
*   **Visuals:** More expressive. Uses `DynamicBackground` with animated blobs (`animate-blob`).
*   **Typography:** Custom font classes (`font-heading`, `font-sans`).
*   **Modals:** Heavy use of Modals for "AI Analysis" and "Profile", making the app feel more like a Single Page Application (SPA).

---

## 8. Conclusion

**Bolt-career-compass is the superior, production-ready evolution.**

While Voyage has a more robust testing setup and uses industry-standard UI libraries (Shadcn), **Bolt** offers:
1.  **Better User Value:** Progress tracking, broader career matching, and detailed AI roadmaps.
2.  **Better Architecture:** Decoupled AI logic (Service pattern) and a cleaner, stricter TypeScript codebase.
3.  **Better Performance:** Lighter dependency footprint and faster AI inference (Groq).
4.  **Resilience:** The fallback mechanisms in Bolt make it much more reliable for real-world use.

**Recommendation:** Continue development on **Bolt**. Consider porting over the automated testing infrastructure (Vitest/Playwright) from Voyage to Bolt to ensure long-term stability.
