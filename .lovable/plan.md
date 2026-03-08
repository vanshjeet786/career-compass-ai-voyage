

# Navbar and Dashboard Redesign

## What's Wrong with "Profile Score"

The "Average Score" on the Profile page computes the mean of all raw Likert response values (1-5) across every completed assessment. This number is meaningless — a 3.2/5 tells you nothing about career fit, strengths, or progress. It will be removed and replaced with actionable metrics.

## Plan

### 1. Redesign Navbar
- Add mobile hamburger menu (currently hidden on mobile with `hidden md:flex`)
- Add assessment quick-start button directly in navbar
- Show user avatar/initials instead of plain text
- Add dropdown menu on avatar: Profile, Settings, Sign Out
- Highlight active route properly

### 2. Redesign Profile Dashboard (`/profile`)
Replace the current 4 stat cards with more meaningful content:

**Remove:**
- "Average Score" card (meaningless metric)

**Replace with:**
- **Top Strength** — show the user's highest-scoring category from their latest completed assessment (e.g., "Logical-Mathematical: 4.2/5")
- **Top Career Match** — show their #1 career recommendation with compatibility %
- **Progress Tracker** — visual showing assessment completion (completed vs in-progress)
- **Last Activity** — keep but improve formatting

**Add new sections:**
- **Quick Actions** row: "Start New Assessment", "View Latest Results", "Talk to AI Counselor"
- **Assessment History** — keep but add a mini score summary per completed assessment (top strength + top career match)
- **Strength Snapshot** — small radar chart from their latest assessment (reuse OverviewTab's radar logic)

### 3. Better Navigation Options
Add these routes/links to the navbar dropdown and profile page:
- Quick link to latest results
- Quick link to start a new assessment
- Link to background info update

## Files to Modify
- `src/components/Layout/Navbar.tsx` — Mobile menu, avatar dropdown, better nav items
- `src/pages/Profile.tsx` — Complete redesign with meaningful stats, quick actions, strength snapshot

## Files to Create
- None needed — reuse existing components and utilities

