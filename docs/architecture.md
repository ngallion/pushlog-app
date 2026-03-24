# Architecture: Pushlog

## Tech Stack

| Layer       | Choice                     | Why                                                     |
| ----------- | -------------------------- | ------------------------------------------------------- |
| Framework   | React 18 + Vite            | Fast dev experience, lightweight prod bundle            |
| Language    | TypeScript                 | Catches data model mistakes early                       |
| Styling     | Tailwind CSS               | Mobile-first, no stylesheet bloat                       |
| Routing     | React Router v6            | Simple, well-known                                      |
| State       | React Context + useReducer | No library needed at this scale                         |
| Persistence | localStorage               | Zero cost, no backend                                   |
| PWA         | vite-plugin-pwa (Workbox)  | Service worker + manifest, installable on mobile        |
| Hosting     | S3 + CloudFront            | ~$0.50–1/month for personal use, HTTPS required for PWA |

---

## Data Model

All data is stored in localStorage under namespaced keys.

### `pushlog:programs` — `ProgramBlock[]`

A program block is a 2-week set of workout templates.

```ts
interface ProgramBlock {
  id: string;
  startedAt: string; // ISO date string
  workouts: {
    upperA: ExerciseTemplate[];
    upperB: ExerciseTemplate[];
    lowerA: ExerciseTemplate[];
    lowerB: ExerciseTemplate[];
  };
}

interface ExerciseTemplate {
  id: string;
  name: string;
  sets: number;
  targetReps: string; // e.g. "8-10" or "5"
}
```

### `pushlog:sessions` — `WorkoutSession[]`

One entry per completed workout.

```ts
interface WorkoutSession {
  id: string;
  date: string; // ISO date string
  workoutType: WorkoutType; // 'upperA' | 'upperB' | 'lowerA' | 'lowerB'
  programBlockId: string;
  exercises: LoggedExercise[];
}

interface LoggedExercise {
  templateId: string; // matches ExerciseTemplate.id (or null if swapped in)
  name: string; // stored directly in case template changes later
  sets: LoggedSet[];
}

interface LoggedSet {
  setNumber: number;
  weight: number; // lbs (unit display can be added later)
  reps: number;
  completed: boolean;
}
```

### Derived state (not stored)

- **Next workout type** — determined by scanning session history in order against the rotation sequence
- **"Last time" data** — queried from sessions: most recent session containing a given exercise name

---

## Rotation Logic

The 7-day weekly pattern maps to workout types like this:

```
Sequence: [upperA, lowerA, upperB, lowerB] — repeating
Rest days: managed by the user (they just don't open the app)
Block rollover: after 8 completed workouts (2 full cycles of the 4-type sequence)
```

The app does not track calendar dates for rotation purposes — it only looks at completed sessions. The next workout is always the next item in the sequence after the last completed session's type.

**Block rollover:** When session count within the current block reaches 8, the "Start New Block" prompt appears on the home screen. The user kicks off the new block manually (to allow them to update exercises first).

---

## File Structure

```
src/
  components/       # Reusable UI components (Button, SetRow, ExerciseCard, etc.)
  pages/            # Top-level route components (Today, ActiveWorkout, ProgramEditor, History)
  context/          # AppContext — wraps program + session state, localStorage sync
  hooks/            # useNextWorkout, useLastSession, useProgramBlock, etc.
  lib/
    storage.ts      # localStorage read/write helpers
    rotation.ts     # Next workout calculation logic
    types.ts        # Shared TypeScript types
  App.tsx
  main.tsx
```

---

## Hosting on AWS

### Option A: S3 + CloudFront (recommended)

- Build output (`dist/`) uploaded to S3 bucket
- CloudFront distribution in front for HTTPS (required for service workers / PWA install)
- Cost: ~$0.50–1/month for personal traffic levels
- Deploy: `npm run build` → `aws s3 sync dist/ s3://your-bucket --delete`

### Option B: S3 Static Website Only

- Cheaper (no CloudFront) but **no HTTPS** — PWA install and service workers won't work
- Not recommended given the PWA requirement

### CI/CD (optional)

A simple GitHub Actions workflow can automate `build → s3 sync` on push to main.

---

## PWA Configuration

- Manifest: app name, icons, `display: standalone`, `start_url: /`
- Service worker strategy: **cache-first for assets**, network-first for nothing (no network calls)
- vite-plugin-pwa handles manifest generation and Workbox setup automatically
