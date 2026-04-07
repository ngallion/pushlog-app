# Feature Analysis & Improvement Opportunities

_Generated: 2026-04-06_

This document audits the current feature set of Pushlog as of April 2026 and proposes concrete improvements. See `feature-analysis.md` (March 2026) for the prior analysis; items completed since then are noted below.

---

## What's Been Built Since March 2026

The following items from the prior analysis have shipped:

| Item                                | Status                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------- |
| 1.1 PR detection                    | ✅ Done — detected on `FINISH_WORKOUT`, shown in `WorkoutSummary`         |
| 1.2 Post-workout summary screen     | ✅ Done — `WorkoutSummary.tsx` with sets delta, PRs, next workout preview |
| 1.3 Workout duration tracking       | ✅ Done — `startedAt` / `finishedAt` on `WorkoutSession`                  |
| 1.5 History filtering & search      | ✅ Done — filter pills by workout type + exercise name search             |
| 2.4 Rest timer                      | ✅ Done — `useRestTimer`, auto-starts on set log, configurable in Options |
| 3.5 Cancel workout / delete session | ✅ Done — cancel with confirmation in Today; trash icon in History        |
| 3.6 Web Share API for export        | ✅ Done — `navigator.share` with file support in Options                  |

New features shipped that were not in the prior analysis:

| Feature               | Notes                                                                        |
| --------------------- | ---------------------------------------------------------------------------- |
| Pebbs companion pet   | 15 moods, 3 levels, wither system, roll in/out, per-pebble animations        |
| AI feedback prompt    | Options → "Copy prompt" pre-loads program + recent session data              |
| Bonus sets            | Logging beyond target sets is allowed; animated with escalating glow effects |
| Program export/import | Separate from full backup; imports program without touching session history  |
| Floating save button  | ProgramEditor save is now a fixed floating button                            |

---

## Current Feature Inventory

| Area                     | Features Present                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Workout Logging**      | Start/finish/cancel session, log sets, adjust reps, track weight, bonus sets beyond target, drag-to-reorder |
| **Exercise Management**  | Add impromptu exercises, swap mid-workout (one-off), weight propagation to template                         |
| **Program Editor**       | Edit exercises per workout type + cycle, drag-to-reorder, add/delete, floating save, start new block        |
| **History**              | Filter by workout type, search by exercise name, collapsible breakdown, delete sessions                     |
| **PR Detection**         | Detected on finish by comparing weight to all previous sessions; shown in summary                           |
| **Post-Workout Summary** | Total sets, delta vs last session, new PRs, next workout preview                                            |
| **Rest Timer**           | Auto-starts on set log, configurable (Off / 60 / 90 / 120 / 180s), skip button                              |
| **Rotation**             | upperA → lowerA → upperB → lowerB; cycle alternates every 8 workouts                                        |
| **Reference Data**       | "Last time" card per exercise (matched by templateId then name)                                             |
| **Data Portability**     | Full backup export/import + program-only export/import via Web Share API or download                        |
| **AI Feedback**          | Prompt builder with program + recent sessions pre-loaded; links to Claude/ChatGPT/Gemini                    |
| **Pebbs**                | Companion pet with 15 moods, 3 size levels, wither/comeback system, roll animations                         |
| **PWA**                  | Installable, fully offline, service worker via Workbox                                                      |
| **Animations**           | Card completion, set pop, weight float-up, confetti on finish, bonus set glow, Pebbs keyframes              |

---

## Proposed Improvements

### Priority 1 — High Impact, Low Effort

---

#### 1.1 Workout Duration in History & Summary

**Problem:** `startedAt` and `finishedAt` are stored on `WorkoutSession` but duration is never displayed. The data is already there.

**Proposal:**

- Compute duration as `finishedAt - startedAt` where both exist.
- Show it on each session card in History ("47 min") alongside the set count.
- Show it in the post-workout `WorkoutSummary` below the total sets.

**Files to touch:** `History.tsx`, `WorkoutSummary.tsx`

---

#### 1.2 Per-Exercise All-Time PRs

**Problem:** PRs are detected and celebrated at workout completion but not stored or accessible after the fact. There's no way to look up "what's my bench PR?" without scanning History manually.

**Proposal:**

- Add a "Records" section to History (or a dedicated tab/sheet) showing the all-time max weight per exercise across all sessions.
- Derive entirely from `state.sessions` — no new data storage required.
- Display as a simple sorted list: exercise name + max weight + date achieved.

**Files to touch:** `History.tsx` (or a new `Records.tsx` page/component)

---

#### 1.3 Progressive Overload Nudge

**Problem:** The app tracks weight but never prompts the user to increase it. The data to detect readiness already exists.

**Proposal:**

- In `ExerciseCard`, if the last session shows `setsCompleted === targetSets` and the weight matches the current starting weight, show a subtle indicator: "You hit your target last time — consider adding weight."
- This is a hint only, no forced change.
- Derived from `useLastSession` data already available at the card level.

**Files to touch:** `ExerciseCard.tsx`

---

#### 1.4 Consistency Metric on Today Screen

**Problem:** Pebbs internally tracks streak/consistency to determine his mood, but the user has no numeric view of their training frequency.

**Proposal:**

- Below the "X total workouts" footer on the Today preview screen, show a simple weekly count: "3 workouts this week" or a 4-week sparkline of workout frequency.
- Derive from `state.sessions` dates — no new data.

**Files to touch:** `Today.tsx`

---

#### 1.5 Weight Unit Toggle (lbs / kg)

**Problem:** The app hardcodes lbs with no option to switch. Users outside the US or who think in kg can't use the app naturally.

**Proposal:**

- Add `weightUnit: "lbs" | "kg"` to a `preferences` key in `localStorage`.
- A toggle in Options applies a conversion factor to all weight displays.
- The stored values remain in lbs internally; only display and input are converted.
- Include in JSON export for portability.

**Files to touch:** `Options.tsx`, `ExerciseCard.tsx`, `WorkoutSummary.tsx`, `History.tsx`, `lib/storage.ts`

---

### Priority 2 — High Impact, Moderate Effort

---

#### 2.1 Plate Calculator

**Problem:** Users must mentally calculate barbell plate loading. Common friction point, especially mid-workout.

**Proposal:**

- Add a small "plates" indicator beneath the weight input on `ExerciseCard`.
- Given a weight (e.g., 185 lbs), show per-side plate breakdown (45, 25, 5).
- Pure calculation, no new data.
- Respects the weight unit setting (1.5) and a configurable bar weight in Options (default 45 lbs / 20 kg).

**Files to touch:** `ExerciseCard.tsx`, `Options.tsx`, a new `lib/plates.ts` utility

---

#### 2.2 Per-Set Logging

**Problem:** The data model logs only `setsCompleted` — no per-set granularity. A user who does 135/145/155 across three sets can't record that.

**Proposal:**

- Add an optional `sets: { weight: number; reps: number }[]` to `LoggedExercise`.
- Default flow unchanged; a "Log sets" toggle on the card expands to per-set inputs.
- History renders per-set breakdown when data is present.

**Files to touch:** `types.ts`, `ExerciseCard.tsx`, `AppContext.tsx`, `History.tsx`

**Note:** Most impactful data model change — design for backwards-compatibility.

---

#### 2.3 Calendar Heatmap on History

**Problem:** History is a flat reverse-chronological list. There's no spatial sense of training frequency or gaps over time.

**Proposal:**

- Add a compact GitHub-style heatmap at the top of History showing the last 16 weeks, one cell per day.
- Tapping a cell scrolls to or highlights the session from that date.
- Color intensity based on total sets logged that day.

**Files to touch:** `History.tsx`

---

#### 2.4 Pebbs Interactions & Persistence

**Problem:** Pebbs reacts to workout events but the relationship is purely one-way. There's also no persistence — his mood and level reset if state is cleared.

**Proposal:**

- **Naming:** Let the user rename Pebbs in Options. Store as `preferences.pebbsName`. The tooltip and any future text use the stored name.
- **Treats / interaction:** Add a "Give treat" action (long-press or dedicated button) that triggers a unique mood not reachable any other way — something that contributes to a treat count stored in preferences.
- **Treat count visible:** Show a small count somewhere subtle (Options → Pebbs section) so it feels like a record.

**Files to touch:** `Options.tsx`, `Pebbs.tsx`, `usePebbs.ts`, `lib/storage.ts`, `lib/types.ts`

---

#### 2.5 Program Block History & Comparison

**Problem:** There's no way to compare progress across program cycles or view what a previous block's exercises looked like.

**Proposal:**

- In History, group sessions by `programBlockId` with the block's `startedAt` as a section header.
- Allow expanding a section to view that block's exercise templates for reference.
- `ProgramBlock` data is never auto-deleted so this is purely a display change.

**Files to touch:** `History.tsx`

---

### Priority 3 — Nice to Have / Future Scope

---

#### 3.1 Exercise Notes / Cues

Add an optional `notes?: string` field to `ExerciseTemplate`. Small textarea in ProgramEditor; collapsed display on ExerciseCard.

---

#### 3.2 Bodyweight Exercise Support

Add optional `type: "barbell" | "dumbbell" | "bodyweight" | "cable" | "machine"` to `ExerciseTemplate`. Bodyweight exercises show "Added weight" label; plate calculator skips them.

---

#### 3.3 Warm-Up Set Logging

Add optional `warmupSets?: number` to `ExerciseTemplate`. Render as lighter-styled rows before working sets; not counted toward the X/Y progress indicator.

---

#### 3.4 Custom Workout Rotation

The 4-slot rotation is hardcoded in `rotation.ts`. Allow defining a custom rotation order (array of `WorkoutType`) stored in `ProgramBlock`. Update `rotation.ts` to use it.

---

#### 3.5 Notification Support for Rest Timer

The rest timer shows a notification permission prompt but doesn't appear to vibrate or alert when the countdown completes while the screen is off. Wire up `Notification` API and `navigator.vibrate` for the rest-complete event.

**Files to touch:** `useRestTimer.ts`

---

## Open Data Model Items

| Issue                                                                             | Impact                                     | Fix                                                                        |
| --------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| `duration` not derived or displayed anywhere despite both timestamps being stored | Missed UX opportunity                      | Compute and show in History + Summary (see 1.1)                            |
| PR detection is ephemeral — recalculated each session, not stored                 | Can't query "my bench PR"                  | Consider a derived `prs` index computed on load (no storage change needed) |
| No preferences key in localStorage schema                                         | Blocks unit toggle, bar weight, Pebbs name | Add `pushlog:preferences` with versioned migration path                    |
| `LoggedExercise` has no per-set granularity                                       | Limits advanced tracking                   | Design `sets[]` as optional to preserve backwards compatibility            |

---

## Quick Wins Summary

Require < 1–2 hours, no data model changes:

1. **Duration in History** — compute from existing `startedAt`/`finishedAt`, two-line addition per card
2. **Duration in WorkoutSummary** — same computation, show below total sets
3. **Progressive overload hint** — single condition in `ExerciseCard` using `useLastSession` data already in scope
4. **Consistency metric on Today** — count sessions in last 7 days from `state.sessions`, add one line to the footer
5. **Rest timer vibration** — `navigator.vibrate(200)` in `useRestTimer` when countdown hits 0

---

## Architecture Notes

All proposals above remain scoped to:

- **No backend** — everything in `localStorage` or derived from existing state
- **No new heavy dependencies** — plate calculator and heatmap are pure JS/CSS
- **Backwards-compatible data changes** — new optional fields only; existing JSON exports remain importable

Items that touch the data model: per-set logging (2.2), preferences key (1.5, 2.4). These should land together to consolidate the migration work.
