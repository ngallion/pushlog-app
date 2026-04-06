# Pebbs — In-App Companion

Pebbs is a small animated pebble creature that lives in the bottom-right corner of the app. It reacts to your workout activity and grows over time as you build consistency.

---

## Appearance

Pebbs is rendered as a stack of rounded pebble shapes. Its visual form grows with your total completed workouts:

| Level | Workouts Completed | Form                               |
| ----- | ------------------ | ---------------------------------- |
| 0     | 0–5                | Single pebble                      |
| 1     | 6–15               | Head + body (two pebbles)          |
| 2     | 16+                | Head + body + base (three pebbles) |

Withering reduces the effective level (see below), so a level-2 Pebbs with `witherLevel = 1` displays at level 1.

Pebbs is visible on the **Today** screen (both the pre-workout preview and during an active session) and on the **post-workout summary**. Clicking or tapping Pebbs directly triggers the `pet` mood.

---

## Moods

Pebbs has 15 mood states split into two categories:

### Transient moods

These override the ambient mood for a fixed duration, then return to ambient.

| Mood         | Eyes                 | Trigger                                               | Duration | Animation                  |
| ------------ | -------------------- | ----------------------------------------------------- | -------- | -------------------------- |
| `watching`   | Full open circles    | On page load                                          | 2 s      | None                       |
| `pumped`     | Extra-large circles  | Very first set of a session                           | 1.2 s    | Big spring jump            |
| `hype`       | Caret `^^`           | Any subsequent set logged                             | 0.7 s    | Bounce with squash/stretch |
| `struggling` | Worried inward ovals | Tap minus below target (set decremented)              | 1.5 s    | Side-to-side shake         |
| `celebrate`  | Gold stars `★★`      | Workout finished (no PRs)                             | 3 s      | Spin + scale wiggle        |
| `pr`         | Gold diamonds `✦✦`   | Workout finished with at least one weight PR          | 3.5 s    | Bigger spin + scale wiggle |
| `comeback`   | Wide green circles   | Wither just cleared; queued to play after celebrate   | 2 s      | Springs up from below      |
| `zoomies`    | Spiral `@@`          | Automatic, random ~every 4 min while in ambient state | 1.5 s    | Chaotic spin and scale     |
| `pet`        | Pink hearts `♥♥`   | Pebbs is tapped/clicked directly                      | 1.5 s    | Happy wobbly wiggle        |

### Ambient moods

These are persistent background states derived from session data or time of day. They are active whenever no transient mood is running.

| Mood      | Eyes                  | Condition                                | Animation                                 |
| --------- | --------------------- | ---------------------------------------- | ----------------------------------------- |
| `idle`    | Half-closed           | Default                                  | Gentle Y float (3.5 s loop)               |
| `streak`  | Warm orange circles   | 3+ workouts completed in the last 7 days | Warm brightness pulse (2.5 s loop)        |
| `excited` | Violet sparkles `✸✸`  | 2–6 days since last workout              | Energetic bounce (1.2 s loop)             |
| `sleepy`  | Thin horizontal lines | Hour is 22:00–04:59                      | Slow tilted float (5 s loop)              |
| `bored`   | Tiny sideways dots    | 30 s idle on pre-workout preview screen  | Slow lean to the side (4 s loop)          |
| `wither`  | Droopy dashes         | Withering (see below)                    | Opacity + desaturation pulse (2.5 s loop) |

The ambient mood is recalculated every minute (for time-based changes like `sleepy`) and whenever the completed session count changes (for `streak` / `excited`).

---

## Withering

Withering is a severity score computed from rolling 7-day windows in session history. Each consecutive week with zero completed workouts increments the score; every 4 completed workouts decrease it by 1.

| Effect          | Behaviour                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Visual          | Colors desaturate and darken; level decreases by `witherLevel`                                                                                  |
| Mood            | Ambient mood locked to `wither`                                                                                                                 |
| `triggerHype()` | Suppressed — logging a set does not animate Pebbs while withering                                                                               |
| Recovery        | Completing a workout reduces `witherLevel`; when it reaches 0, Pebbs queues a `comeback` mood to play after the celebrate/PR animation finishes |

---

## Hook API

Pebbs is driven by the `usePebbs` hook (`src/hooks/usePebbs.ts`):

```typescript
const {
  level,
  witherLevel,
  mood,
  withering,
  triggerHype,
  triggerPumped,
  triggerStruggling,
  triggerCelebrate,
  triggerPR,
  triggerBored,
  triggerPet,
} = usePebbs(sessions);
```

| Value / method        | Type          | Description                                                                    |
| --------------------- | ------------- | ------------------------------------------------------------------------------ |
| `level`               | `0 \| 1 \| 2` | Visual growth level (already adjusted for wither)                              |
| `witherLevel`         | `number`      | Wither severity (0 = healthy)                                                  |
| `mood`                | `PebbsMood`   | Current mood state                                                             |
| `withering`           | `boolean`     | `witherLevel > 0`                                                              |
| `triggerHype()`       | `() => void`  | Subsequent set logged; no-op if withering                                      |
| `triggerPumped()`     | `() => void`  | First set of the session; no-op if withering                                   |
| `triggerStruggling()` | `() => void`  | Set decremented below target; no-op if withering                               |
| `triggerCelebrate()`  | `() => void`  | Workout finished without PRs                                                   |
| `triggerPR()`         | `() => void`  | Workout finished with at least one PR                                          |
| `triggerBored()`      | `() => void`  | Called after 30 s on pre-workout preview; stays until cleared by any transient |
| `triggerPet()`        | `() => void`  | Pebbs tapped — shows heart eyes and happy wiggle                               |

`zoomies` and `comeback` are managed entirely inside the hook and have no external trigger.

---

## Call Sites

| File                                | What it calls                                                                                                                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/Today.tsx`               | `triggerPumped` / `triggerHype` on set logged; `triggerStruggling` on set decremented; `triggerPR` or `triggerCelebrate` on finish (PR check happens inline); `triggerBored` after 30 s idle; `triggerPet` passed as `onTap` |
| `src/components/WorkoutSummary.tsx` | Receives `onPebbsTap` → `triggerPet`                                                                                                                                                                                         |
| `src/components/ExerciseCard.tsx`   | Calls `onSetLogged()` and `onSetDecremented()` callbacks (passed in from Today)                                                                                                                                              |

---

## Implementation Files

| File                                | Role                                                                 |
| ----------------------------------- | -------------------------------------------------------------------- |
| `src/components/Pebbs.tsx`          | CSS rendering, eye expressions per mood, level shapes, `onTap` prop  |
| `src/hooks/usePebbs.ts`             | All state logic: ambient system, transient triggers, wither, zoomies |
| `src/index.css`                     | 14 keyframe animations (`pebbs-*`)                                   |
| `src/pages/Today.tsx`               | Mounts Pebbs on preview + active workout screens                     |
| `src/components/WorkoutSummary.tsx` | Mounts Pebbs on the post-workout summary screen                      |
| `src/components/ExerciseCard.tsx`   | Fires `onSetLogged` / `onSetDecremented` callbacks                   |

---

## Design Notes

- Pebbs is fixed to the bottom-right, above the bottom nav bar (`z-index: 30`).
- Colors are intentionally muted stone grays to stay unobtrusive. Accent colors are used only for specific moods: gold for celebrate/PR eyes, orange for streak, green for comeback, violet for excited.
- Level is computed from all completed workouts across all program blocks, not just the current one.
- Ambient mood priority order (highest to lowest): `wither` → `sleepy` → `streak` → `excited` → `idle`.
