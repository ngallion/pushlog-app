# Pushlog

A PWA for tracking a structured 4-day strength training program. No account. No server.

---

## What it is

You follow a rotating 4-workout program across two week-sets:

```
Upper A → Lower A → Upper B → Lower B → repeat
```

The app always knows where you are in the rotation. It shows you your last numbers while you log, tracks your PRs, and gets out of the way. Every bit of data lives in `localStorage` — nothing leaves your device.

**Pebbs** is the app mascot: a small sentient rock who grows as you complete workouts, reacts to your PRs, and wiggles when you pet him. He is very important.

---

## Features

- **Active workout logging** — sets, reps, and weight per exercise
- **"Last time" reference** — previous session's numbers visible while logging
- **Rest timer** — countdown with vibration + notification when the screen is off
- **Exercise swap** — one-off mid-workout substitution that doesn't touch your template
- **Impromptu exercises** — add something not on the plan, tracked but not saved to the program
- **Program editor** — drag-to-reorder, add/remove exercises per workout type and day-set
- **History** — reverse-chronological session log with a 16-week heatmap, workout type filters, and exercise search
- **Records** — all-time per-exercise weight PRs, searchable
- **Pebbs** — grows with your streak, celebrates your PRs, has a crown

---

## Tech stack

| Layer       | Choice                    | Why                                         |
| ----------- | ------------------------- | ------------------------------------------- |
| Framework   | React 19 + Vite 8         | Fast dev, tiny prod bundle                  |
| Language    | TypeScript (strict)       | Catch data model bugs before they catch you |
| Styling     | Tailwind CSS 3            | Mobile-first, no stylesheet sprawl          |
| Routing     | React Router 7            | Simple, client-side only                    |
| State       | Context + `useReducer`    | No library needed at this scale             |
| Persistence | `localStorage`            | Zero cost, zero backend                     |
| PWA         | vite-plugin-pwa + Workbox | Installable, works offline                  |
| Drag & Drop | @dnd-kit                  | Pointer + touch sensor support              |
| Icons       | lucide-react              | Clean, consistent                           |
| Confetti    | canvas-confetti           | For the moments that deserve it             |

---

## Data model

Everything lives in two `localStorage` keys:

**`pushlog:programs`** — array of `ProgramBlock`, each covering two week-sets of four workout types.

**`pushlog:sessions`** — array of `WorkoutSession`, one per completed workout. Sessions store a snapshot of the exercises at log time, so editing the program later doesn't rewrite history.

```ts
type WorkoutType = "upperA" | "upperB" | "lowerA" | "lowerB";
type DaySet = "day1" | "day2";

interface WorkoutSession {
  id: string;
  startedAt: string; // ISO timestamp
  finishedAt?: string; // ISO timestamp — set on completion
  workoutType: WorkoutType;
  daySet: DaySet;
  programBlockId: string;
  exercises: LoggedExercise[];
}
```

Schema version is tracked under `pushlog:schemaVersion` (currently **2**) and migrations run automatically on load.

---

## Dev setup

Requires Node 22. If you use Nix + direnv:

```bash
direnv allow   # loads flake.nix env automatically
```

Otherwise install Node 22 however you like, then:

```bash
npm install
npm run dev      # dev server at localhost:5173 (LAN accessible via --host)
npm run build    # tsc + vite → dist/
npm run preview  # preview prod build locally
npm run lint     # ESLint
```

A pre-commit hook runs Prettier on staged files automatically.

---

## Deployment

Build output is a fully static site. Deploy `dist/` anywhere that serves HTTPS — required for PWA install and service workers.

**Recommended: S3 + CloudFront**

```bash
npm run build
aws s3 sync dist/ s3://your-bucket --delete
```

Cost: ~$0.50–1/month for personal traffic. CloudFront provides the HTTPS termination.

---

## Architecture notes

- **No network calls** — ever. The app is intentionally offline-first and backend-free.
- **Rotation is session-count-based**, not calendar-based. The next workout is always the next item in the sequence after the last completed session — you can take as many rest days as you want.
- **Block rollover** happens after 8 completed workouts (two full cycles). The user triggers it manually so they can update exercises before the new block starts.
- **Weight updates propagate** — changing the weight during an active session updates both the session log and the exercise template for future sessions.
- **Impromptu exercises** use `id: "impromptu-<uuid>"` and are not written back to the program template.

---

## Project structure

```
src/
  components/       # Reusable UI (ExerciseCard, Pebbs, WorkoutSummary, …)
  context/          # AppContext — global state, localStorage sync, reducer
  hooks/            # useNextWorkout, useLastSession, useRestTimer
  lib/
    types.ts        # Source of truth for all TypeScript types
    rotation.ts     # Workout sequence + day-set logic
    storage.ts      # localStorage helpers
    defaultProgram.ts
    uuid.ts
  pages/            # Today, ProgramEditor, History, Settings
  index.css         # Global styles + Pebbs keyframe animations
docs/
  architecture.md   # Technical decisions and rationale
  product.md        # Product spec and screen descriptions
  my-program.json   # Sample program JSON for import testing
```
