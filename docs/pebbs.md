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

Pebbs is always visible on the **Today** screen and on the **post-workout summary**.

---

## Moods

Pebbs has five mood states, each with distinct eye expressions and animations:

| Mood        | Eyes              | Trigger                              | Animation                                 |
| ----------- | ----------------- | ------------------------------------ | ----------------------------------------- |
| `idle`      | Half-closed       | Default after 2 s of inactivity      | Float (gentle Y oscillation, 3.5 s loop)  |
| `watching`  | Full open circles | Workout view loads                   | None                                      |
| `hype`      | Caret `^^`        | A set is logged                      | Bounce with squash/stretch (0.65 s)       |
| `celebrate` | Gold stars `★★`   | Workout finished                     | Spin + scale pulse (3 s)                  |
| `wither`    | Closed/sad dashes | 7+ days without completing a workout | Opacity + desaturation pulse (2.5 s loop) |

Moods transition back to `idle` automatically after their animation completes (2 s for `watching`, 700 ms for `hype`, 3 s for `celebrate`). The `wither` mood persists until a workout is completed.

---

## Withering

If 7 or more days pass without finishing a workout, Pebbs enters a **withered** state:

- Visual colors desaturate and darken.
- The `pebbs-wither` animation pulses opacity and saturation continuously.
- `triggerHype()` is suppressed — logging a set will not animate Pebbs while it is withering.
- Completing a workout ends the withered state immediately.

---

## Interaction Points

Pebbs is driven by the `usePebbs` hook (`src/hooks/usePebbs.ts`), which reads from the full session history to compute level and withering status. The hook exposes:

```typescript
const { level, mood, withering, triggerHype, triggerCelebrate } =
  usePebbs(sessions);
```

| Hook value / method  | Type          | Description                                     |
| -------------------- | ------------- | ----------------------------------------------- |
| `level`              | `0 \| 1 \| 2` | Visual growth level                             |
| `mood`               | `PebbsMood`   | Current eye/animation state                     |
| `withering`          | `boolean`     | Whether Pebbs is in the withered state          |
| `triggerHype()`      | `() => void`  | Called when a set is logged; no-op if withering |
| `triggerCelebrate()` | `() => void`  | Called when the workout is finished             |

`Today.tsx` calls `triggerHype()` each time a set is logged and `triggerCelebrate()` when `FINISH_WORKOUT` is dispatched.

---

## Implementation Files

| File                                | Role                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `src/components/Pebbs.tsx`          | SVG rendering, eye expressions, level shapes                                           |
| `src/hooks/usePebbs.ts`             | State logic: level, mood transitions, withering                                        |
| `src/index.css`                     | Keyframe animations (`pebbs-float`, `pebbs-bounce`, `pebbs-celebrate`, `pebbs-wither`) |
| `src/pages/Today.tsx`               | Mounts Pebbs; calls `triggerHype` / `triggerCelebrate`                                 |
| `src/components/WorkoutSummary.tsx` | Displays Pebbs on the post-workout summary screen                                      |

---

## Design Notes

- Pebbs is decorative and non-interactive beyond the hover tooltip showing its name.
- It is fixed to the bottom-right, above the bottom nav bar (`z-index: 30`).
- Colors are intentionally muted grays (`#9e9891`, `#8a8580`, `#7c7873`) to stay unobtrusive; celebration eyes use gold (`#92701a`) as the only accent.
- The level system is tied to `sessions` from the global state — it counts all completed workouts across all program blocks, not just the current one.
