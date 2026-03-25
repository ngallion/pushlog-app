# Feature Analysis & Improvement Opportunities

_Generated: 2026-03-25_

This document audits the current feature set of Pushlog and proposes concrete improvements, organized by priority and effort.

---

## Current Feature Inventory

| Area | Features Present |
|------|-----------------|
| **Workout Logging** | Start/finish session, log sets completed, adjust reps, track weight, drag-to-reorder exercises |
| **Exercise Management** | Add impromptu exercises, swap exercises mid-workout (one-off), weight propagation to template |
| **Program Editor** | Edit exercises per workout type + day set, drag-to-reorder, add/delete exercises, save / start new block |
| **History** | Read-only list of completed sessions with exercise breakdown |
| **Rotation** | Auto-advance through upperA → lowerA → upperB → lowerB; day set alternates every 8 workouts |
| **Reference Data** | "Last time" card for each exercise (matched by templateId then name) |
| **Data Portability** | JSON export/import via Settings |
| **PWA** | Installable, fully offline, service worker via Workbox |
| **Animations** | Card completion, set pop, weight float-up, confetti on finish |

---

## Proposed Improvements

### Priority 1 — High Impact, Low Effort

---

#### 1.1 Personal Records (PRs) Detection

**Problem:** There is no acknowledgement when a user lifts more weight or completes more reps than ever before. This is a primary motivator in strength training.

**Proposal:**
- On `FINISH_WORKOUT` (or on each `LOG_EXERCISE`), compare the current session's weight × reps against all historical sessions for the same `templateId`.
- If a new max is detected, show a "New PR!" badge on the exercise card and include it in the post-workout summary.
- Store no additional data — derive PRs from `state.sessions` on demand.

**Files to touch:** `ExerciseCard.tsx`, `useLastSession.ts` (or a new `usePR.ts` hook), `Today.tsx`

---

#### 1.2 Post-Workout Summary Screen

**Problem:** After finishing a workout, the user sees nothing — the app returns to the pre-workout "Next Workout" view. There is no feedback on what was accomplished.

**Proposal:**
- After `FINISH_WORKOUT` dispatches, show a brief summary modal or screen:
  - Total sets completed
  - Any new PRs flagged
  - "Compared to last time" delta (more/fewer sets, heavier/lighter)
  - Next workout preview
- The confetti already fires — this extends that celebratory moment.

**Files to touch:** `Today.tsx`, possibly a new `WorkoutSummary.tsx` component

---

#### 1.3 Workout Duration Tracking

**Problem:** `WorkoutSession` has a `date` field (start date as ISO string) but no end time. Duration is never captured.

**Proposal:**
- Add `startedAt: string` and `finishedAt: string` (ISO timestamps) to `WorkoutSession` in `types.ts`.
- `START_WORKOUT` sets `startedAt`; `FINISH_WORKOUT` sets `finishedAt`.
- Display duration in the History list ("47 min").
- Show a running timer on the active workout screen.

**Files to touch:** `types.ts`, `AppContext.tsx`, `History.tsx`, `Today.tsx`

**Note:** The existing `date` field should be kept for backwards-compatibility with exported data.

---

#### 1.4 Plate Calculator / Weight Helper

**Problem:** Users must mentally calculate barbell plate loading. This is a common friction point.

**Proposal:**
- Add a small "plates" tooltip or inline display beneath the weight input on `ExerciseCard`.
- Given a weight (e.g., 185 lbs), show the plate breakdown per side (e.g., 45, 25, 5).
- Pure calculation, no new data needed.
- Support configurable bar weight (45 lb Olympic default) in Settings.

**Files to touch:** `ExerciseCard.tsx`, `Settings.tsx`, a new `lib/plates.ts` utility

---

#### 1.5 History Filtering & Search

**Problem:** The History page shows all sessions in reverse order with no way to filter by workout type or search by exercise name. This becomes unusable as the log grows.

**Proposal:**
- Add filter pills at the top of `History.tsx` for workout type (All, Upper A, Lower A, Upper B, Lower B).
- Add a search input to find sessions containing a specific exercise by name.
- Pure UI filtering over existing `state.sessions` — no new data needed.

**Files to touch:** `History.tsx`

---

#### 1.6 Settings: Configurable Bar Weight & Unit System

**Problem:** Settings currently only supports JSON export/import. There are no user preferences. The app hardcodes assumptions (lbs, 45 lb bar) with no way to change them.

**Proposal:**
- Add a `preferences` key to `localStorage` (separate from programs/sessions).
- Preferences: `weightUnit: "lbs" | "kg"`, `barWeight: number` (default 45).
- Propagate through `ExerciseCard` weight display and the plate calculator.
- Include in JSON export for portability.

**Files to touch:** `Settings.tsx`, `types.ts`, `storage.ts`, `ExerciseCard.tsx`

---

### Priority 2 — High Impact, Moderate Effort

---

#### 2.1 Progressive Overload Suggestions

**Problem:** The app tracks weight but never prompts the user to increase it. A key principle of strength training (progressive overload) is entirely manual.

**Proposal:**
- After a session where all target sets were completed at or above `maxReps`, show a suggestion on the next session's exercise card: "You hit the top of your rep range last time — consider adding weight."
- Trigger: `setsCompleted === targetSets` AND last session's implied reps ≥ `maxReps`.
- This is a hint, not a forced change — the user still controls their weight.

**Files to touch:** `useLastSession.ts`, `ExerciseCard.tsx`

---

#### 2.2 Streak & Consistency Tracking

**Problem:** There is no view of training frequency or consistency over time. Users have no way to see if they're hitting their goals.

**Proposal:**
- Add a simple "streak" indicator to the Today screen: consecutive weeks with ≥ N workouts.
- Add a weekly workout count to the Today or History screen.
- Derive entirely from `state.sessions` dates — no new data storage.
- A small calendar heatmap on History could be a longer-term addition.

**Files to touch:** `Today.tsx`, `History.tsx`, possibly a new `useStreak.ts` hook

---

#### 2.3 Per-Set Weight & Rep Logging

**Problem:** The current data model logs only `setsCompleted`, `minReps`, and `maxReps` — there is no per-set granularity. A user who does 3 sets at 135/145/155 lbs can't record that progression within a session.

**Proposal:**
- Add an optional `sets: { weight: number; reps: number }[]` array to `LoggedExercise`.
- The UI can expand to show per-set inputs when the user taps a "Log sets" toggle on the card.
- Keep the existing simplified flow as the default (no breaking change to existing data).
- Update `History.tsx` to render per-set breakdown when data is present.

**Files to touch:** `types.ts`, `ExerciseCard.tsx`, `AppContext.tsx`, `History.tsx`

**Note:** This is the most impactful data model change — design carefully to maintain backwards-compatibility with existing exported JSON.

---

#### 2.4 Rest Timer

**Problem:** Rest periods between sets are a critical training variable with no current support. Users must use a separate timer app.

**Proposal:**
- Add an optional rest timer that starts automatically when a set is logged (i.e., when sets completed increments).
- Configurable duration (default: 90s) in Settings.
- Show a countdown in a small persistent banner or bottom sheet.
- Use the Web Notifications API for a vibration/alert when time is up (requires permission).

**Files to touch:** `ExerciseCard.tsx`, `Today.tsx`, `Settings.tsx`, a new `useRestTimer.ts` hook

---

#### 2.5 Program Block History & Comparison

**Problem:** Old `ProgramBlock` data is deleted when the user starts a new block. There's no way to compare progress across program cycles.

**Proposal:**
- Retain all program blocks (they are never deleted today unless explicitly via `DELETE_PROGRAM`). Confirm this is the current behavior — it appears they are only deleted manually.
- On the History page, group sessions by `programBlockId` and show the program block start date as a section header.
- Allow the user to view any historical block's exercise templates for reference.

**Files to touch:** `History.tsx`, `ProgramEditor.tsx`

---

### Priority 3 — Nice to Have / Future Scope

---

#### 3.1 Exercise Notes / Cues

**Problem:** Users often have form cues or personal notes tied to an exercise. These can't be stored anywhere.

**Proposal:**
- Add an optional `notes?: string` field to `ExerciseTemplate` and `LoggedExercise`.
- Small textarea in `ProgramEditor.tsx` for per-exercise notes.
- Display notes (collapsed by default) on the `ExerciseCard`.

---

#### 3.2 Bodyweight Exercise Support

**Problem:** Exercises like pull-ups, push-ups, and dips are tracked with a weight field that doesn't apply. The app has no concept of bodyweight + added load.

**Proposal:**
- Add an optional `type: "barbell" | "dumbbell" | "bodyweight" | "cable" | "machine"` to `ExerciseTemplate`.
- For bodyweight exercises, the weight field becomes "Added weight" (0 = bodyweight only).
- The plate calculator skips bodyweight exercises.

---

#### 3.3 Warm-Up Set Logging

**Problem:** Warm-up sets are part of every serious strength session but can't be logged separately from working sets.

**Proposal:**
- Add optional warm-up sets to `ExerciseTemplate` (`warmupSets?: number`).
- Shown as distinct (lighter-styled) rows on the exercise card before working sets.
- Not counted toward the "X/Y sets complete" progress indicator.

---

#### 3.4 Custom Workout Rotation

**Problem:** The 4-workout rotation (upperA → lowerA → upperB → lowerB) is hardcoded in `rotation.ts`. Users running different splits (push/pull/legs, full body, etc.) can't adapt the app to their program.

**Proposal:**
- Allow the user to define their rotation order in `ProgramEditor.tsx` or `Settings.tsx`.
- Store rotation as an ordered array of `WorkoutType` in the `ProgramBlock`.
- Update `rotation.ts` to use the program's rotation instead of the hardcoded `SEQUENCE` constant.

---

#### 3.5 Archive / Delete Sessions

**Problem:** There is no way to delete a mistakenly completed session or an accidentally started workout from History.

**Proposal:**
- Add a delete button (with confirmation) to each session card in `History.tsx`.
- Dispatch a new `DELETE_SESSION` reducer action.
- Also allow discarding an in-progress workout (not just finishing it) via a "Cancel Workout" option on the Today screen.

---

#### 3.6 iCloud / Google Drive Export Integration

**Problem:** The JSON export goes to the device's Downloads folder. On mobile PWA, this is not always easy to find or auto-backup.

**Proposal:**
- Add a "Share" button using the Web Share API (`navigator.share`) to share the JSON file.
- This allows the user to AirDrop, send to Files, or share to Google Drive directly from the browser.
- Progressive enhancement: show only if `navigator.share` is supported.

**Files to touch:** `Settings.tsx`

---

## Data Model Debt

| Issue | Impact | Fix |
|-------|--------|-----|
| `architecture.md` describes `LoggedSet[]` per exercise; actual code uses flat `setsCompleted` | Confusing for contributors | Update `architecture.md` to match current schema |
| `date` field on `WorkoutSession` is ambiguous (start? end? calendar date?) | Blocks duration tracking | Rename to `startedAt`, add `finishedAt` |
| Settings import only validates `programs` and `sessions` exist, not their schema | Silent data corruption risk | Add deeper validation (at minimum check array item shapes) |
| No migration layer for localStorage schema changes | Breaking changes will corrupt existing data | Add a schema version field and basic migration utility in `storage.ts` |

---

## Quick Wins Summary

These require < 1 hour of work each and have no data model changes:

1. **History filters** — filter chips by workout type on the History page
2. **Share button** — `navigator.share` for JSON export on mobile
3. **Cancel workout** — allow discarding an active session without saving
4. **Progressive overload hint** — single condition check in `ExerciseCard` using existing `useLastSession` data
5. **Session count on History** — already shown on Today; add to History header (it's already there per the code analysis)

---

## Architecture Notes

All proposals above are intentionally scoped to:
- **No backend** — everything stays in `localStorage` or is derived from existing state
- **No new heavy dependencies** — the rest timer, plate calculator, and streak logic are all pure JS utilities
- **Backwards-compatible data changes** — new optional fields preserve existing exported JSON files

The only proposals that touch the data model are: workout duration (1.3), per-set logging (2.3), and exercise notes (3.1). These should be coordinated to land together if possible to minimize schema migration work.
