# Product: Pushlog

A lightweight PWA for managing a structured 4-day/week strength training program. No account required. All data lives on your device.

---

## Core Concept

You follow a **2-week program block** with 4 workout types:

| Type    | Description        |
| ------- | ------------------ |
| Upper A | Upper body, week A |
| Upper B | Upper body, week B |
| Lower A | Lower body, week A |
| Lower B | Lower body, week B |

**Weekly pattern:** Upper → Lower → Rest → Upper → Lower → Rest → Rest

The app tracks where you are in the rotation and always shows you what's next. After 2 full weeks (2 passes through the 7-day pattern = 8 total workouts), you roll into a new program block with updated exercises.

---

## Screens

### 1. Home — "Today"

- Shows the next workout in your rotation (e.g. "Upper A")
- If today is a rest day, shows "Rest Day" with the next workout queued
- Button to start the workout

### 2. Active Workout

The main interaction surface. Shows each exercise in the day's plan with:

- Exercise name + target sets × reps
- **"Last time" reference row** — weight and reps from the most recent session that included this exercise
- Set logging: for each set, input weight + reps, then mark complete
- Swap button per exercise — replace it with a different one (one-off, doesn't affect the template)
- Finish workout button

### 3. Program Editor

- Manage the current 2-week program block
- Edit exercises for each of the 4 workout types (Upper A/B, Lower A/B)
- "Start New Block" button to roll over to a new set of exercises (copies the current structure as a starting point)
- Does NOT affect already-logged sessions

### 4. History

- Chronological list of completed workouts
- Tap into any session to see full exercise/set/weight/rep log
- Useful for reviewing trends over time

---

## Key UX Details

- **"Last time" always visible while logging** — no need to navigate away to see your previous numbers
- **Swapping an exercise mid-workout** is a one-off change; it doesn't edit the program template unless you go to the Program Editor
- **Rest days are not logged** — the rotation advances only when a workout is completed
- **No auth, no sync** — data is localStorage only. Simple export/import (JSON) can be added later as a backup mechanism

---

## Out of Scope (for now)

- Cloud sync / multi-device
- Cardio tracking
- Body weight / measurements
- Social features
- Exercise video library
