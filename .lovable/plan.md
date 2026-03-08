

## Changes

### 1. Remove "Profile Score" gauge from Results page
Remove the `ScoreGauge` component (line 458 in `src/pages/Results.tsx`) that displays "Profile Score" as a circular gauge. The Print/PDF buttons will be kept but repositioned.

### 2. Remove "Results" from top navbar
Remove `{ label: "Results", path: "/results", icon: FileText }` from the `navItems` array in `src/components/Layout/Navbar.tsx` (line 49).

### 3. Remove "Latest Results" from avatar dropdown
Remove the dropdown menu item linking to `/results` in the navbar avatar dropdown (lines 126-129).

### 4. Remove "View Results" quick action from Dashboard
Remove the "View Results" button card from the quick actions grid in `src/pages/Profile.tsx` (lines 180-196). Adjust the grid from `sm:grid-cols-3` to `sm:grid-cols-2`.

Users can still access results from the Assessment History list on the dashboard (each completed assessment has a "View" button).

