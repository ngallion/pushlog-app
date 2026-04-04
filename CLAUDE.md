# CLAUDE.md — Pushlog App

AI assistant context for the `pushlog-app` repository. Read this before making changes.

---

## Project Overview

**Pushlog** is a client-side PWA for strength training. It tracks a rotating 4-workout program (Upper A/B, Lower A/B) across two day-sets, persisting all data in `localStorage`. There is no backend — the entire app is static HTML/CSS/JS.

---

## Tech Stack

| Layer       | Technology                                                    |
| ----------- | ------------------------------------------------------------- |
| Framework   | React 19 + Vite 8                                             |
| Language    | TypeScript 5 (strict mode)                                    |
| Styling     | Tailwind CSS 3 (utility-first, no separate stylesheets)       |
| Routing     | React Router 7 (client-side only)                             |
| State       | Context API + `useReducer`                                    |
| Persistence | `localStorage` (keys: `pushlog:programs`, `pushlog:sessions`) |
| PWA         | `vite-plugin-pwa` with Workbox auto-update                    |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable`                         |
| Icons       | `lucide-react`                                                |
| Animations  | `canvas-confetti` + custom Tailwind keyframes                 |

---

## Repository Structure

```
pushlog-app/
├── src/
│   ├── components/         # Presentational/reusable UI
│   │   ├── BottomNav.tsx       — 4-tab nav bar (Today, Program, History, Settings)
│   │   ├── ExerciseCard.tsx    — Set/rep/weight logging card with animations
│   │   └── WorkoutTypeLabel.tsx — Color-coded badge (Upper A/B, Lower A/B)
│   ├── context/
│   │   └── AppContext.tsx      — Global reducer + localStorage sync
│   ├── hooks/
│   │   ├── useLastSession.ts   — Previous session stats for a workout type
│   │   └── useNextWorkout.ts   — Determines next workout in rotation
│   ├── lib/
│   │   ├── types.ts            — All TypeScript types (source of truth)
│   │   ├── storage.ts          — localStorage read/write helpers
│   │   ├── rotation.ts         — Workout rotation and day-set logic
│   │   ├── defaultProgram.ts   — Factory for new program blocks
│   │   └── uuid.ts             — UUID generation with crypto fallback
│   ├── pages/
│   │   ├── Today.tsx           — Active workout logging (main screen)
│   │   ├── ProgramEditor.tsx   — Edit exercises by workout type + day set
│   │   ├── History.tsx         — Read-only completed workout log
│   │   └── Settings.tsx        — JSON export / import
│   ├── App.tsx                 — Router setup, wraps app in AppProvider
│   ├── main.tsx                — ReactDOM entry point
│   └── index.css               — Global styles + keyframe animations
├── docs/
│   ├── architecture.md         — Tech decisions, data model, hosting notes
│   ├── product.md              — Product spec, screen descriptions, scope
│   └── my-program.json         — Sample program JSON
├── public/                     — Static assets (icons, favicon)
├── scripts/
│   └── generate-icons.mjs      — Icon generation utility
├── flake.nix                   — Nix dev environment (Node 22)
└── index.html                  — Vite HTML entry point
```

---

## Data Model

All types live in `src/lib/types.ts`. Do not duplicate type definitions elsewhere.

```typescript
type WorkoutType = "upperA" | "upperB" | "lowerA" | "lowerB";
type DaySet = "day1" | "day2";

interface ExerciseTemplate {
  id: string;
  name: string;
  sets: number;
  minReps: number;
  maxReps: number;
  startingWeight?: number;
}

interface ProgramBlock {
  id: string;
  startedAt: string; // ISO date string
  workouts: {
    day1: Record<WorkoutType, ExerciseTemplate[]>;
    day2: Record<WorkoutType, ExerciseTemplate[]>;
  };
}

interface LoggedExercise {
  templateId: string;
  name: string;
  setsCompleted: number;
  targetSets: number;
  minReps: number;
  maxReps: number;
  startingWeight?: number;
}

interface WorkoutSession {
  id: string;
  date: string; // ISO date string
  workoutType: WorkoutType;
  daySet: DaySet;
  programBlockId: string;
  exercises: LoggedExercise[];
}
```

**localStorage keys:**

- `pushlog:programs` — `ProgramBlock[]`
- `pushlog:sessions` — `WorkoutSession[]`

---

## State Management

State lives in `src/context/AppContext.tsx`. Use the `useApp()` hook to access `state` and `dispatch`.

**Reducer actions:**

| Action              | Effect                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| `START_WORKOUT`     | Begins a new session                                                       |
| `LOG_EXERCISE`      | Updates exercise in active session                                         |
| `SWAP_EXERCISE`     | Replaces an exercise mid-workout (one-off, non-persisted)                  |
| `FINISH_WORKOUT`    | Saves session to history                                                   |
| `SAVE_PROGRAM`      | Persists a program block                                                   |
| `DELETE_PROGRAM`    | Removes a program block                                                    |
| `UPDATE_WEIGHT`     | Updates weight in active session and template                              |
| `ADD_EXERCISE`      | Adds exercise to active workout (non-persisted, `id: "impromptu-${uuid}"`) |
| `REORDER_EXERCISES` | Reorders exercises in active session                                       |
| `IMPORT_STATE`      | Replaces all programs and sessions (used by Settings import)               |

State changes trigger `useEffect` to sync to `localStorage`.

---

## Workout Rotation Logic

Sequence (from `src/lib/rotation.ts`):

```
upperA → lowerA → upperB → lowerB → (repeat)
```

- **DaySet** alternates every 8 completed workouts (2 full cycles).
- After 8 workouts, the UI prompts the user to start a new `ProgramBlock`.
- "Start New Block" copies the current program structure as the new baseline.

---

## Development Commands

```bash
npm run dev       # Vite dev server with --host (hot reload)
npm run build     # tsc -b && vite build (output: /dist)
npm run lint      # ESLint on entire project
npm run preview   # Preview production build locally
```

**Node version:** 22 (see `flake.nix`). If using Nix + direnv, run `direnv allow` to auto-load the environment.

No test framework is configured. Do not add tests without discussing the approach first.

---

## Code Conventions

### Naming

- `camelCase` — variables, functions, hooks
- `PascalCase` — React components, TypeScript interfaces/types
- `UPPER_CASE` — module-level constants (e.g., `PROGRAMS_KEY`, `SEQUENCE`, `TYPES`)
- File names match the component/hook they export (e.g., `ExerciseCard.tsx`)

### React Patterns

- **Functional components only** — no class components
- **Controlled inputs** — always use `value` + `onChange`
- **Custom hooks** for shared domain logic; pages handle complex orchestration
- **Context + useReducer** for global state — do not introduce external state libraries (Redux, Zustand, etc.) without explicit approval
- **No prop drilling past 2 levels** — lift to context if needed

### Styling

- **Tailwind utility classes only** — do not write custom CSS unless adding keyframe animations to `index.css`
- Keep component class lists readable; extract repeated patterns to variables if repeated 3+ times

### TypeScript

- **Strict mode is enabled** — no `any`, no `@ts-ignore` without justification
- All new types go in `src/lib/types.ts` unless they are purely component-local
- Use union types and discriminated unions for reducer actions (see `AppContext.tsx`)

### Immutability

- State updates always use spread operators or `Array.prototype` methods that return new arrays
- Never mutate state objects directly

### Drag & Drop

- Use `PointerSensor` for mouse, `TouchSensor` with `{ delay: 200, tolerance: 5 }` for touch
- Both `Today.tsx` and `ProgramEditor.tsx` use `@dnd-kit` — keep patterns consistent between them

---

## Key Behaviors to Preserve

1. **Exercise swap is one-off** — swapping mid-workout does not affect the saved program template.
2. **"Last time" reference** matches by `templateId` first, then by `name` (to handle swapped exercises).
3. **Weight update propagates** — changing weight during an active session also updates the exercise template for future sessions.
4. **Impromptu exercises** added mid-workout have `id: "impromptu-${uuid}"` and are not persisted to the program.
5. **Confetti fires** on `FINISH_WORKOUT` using `canvas-confetti` (violet/purple/white/teal palette).
6. **No rest day logging** — the app never prompts or records rest days.
7. **PWA installability** — do not break the service worker or manifest configuration.

---

## Architecture Constraints

- **No backend, no network calls** — all data is local. Do not introduce API calls, fetch, or axios.
- **No auth** — single-user app, no login flow.
- **No external CSS frameworks** beyond Tailwind — no Bootstrap, Material UI, etc.
- **Avoid heavy dependencies** — the app intentionally has a small bundle. Justify any new `dependencies` addition.

---

## Docs

- `docs/product.md` — Product spec; review before changing UX or adding features.
- `docs/architecture.md` — Technical decisions and rationale; update when making significant architecture changes.
- `docs/my-program.json` — Sample data for testing imports.

---

## Branch & Commit Guidelines

- Develop on feature branches; current active branch pattern: `claude/<description>-<id>`
- Commit messages are imperative, lowercase: `"add drag-to-reorder to program editor"`
- Keep commits focused — one logical change per commit
