/**
 * Generates test fixture JSON files for each Pebb visual state.
 * Import any of these via the Options page to test a specific state.
 *
 * Usage: node scripts/generate-test-fixtures.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { randomUUID } from "crypto";

const SEQUENCE = ["upperA", "lowerA", "upperB", "lowerB"];

function makeEx(name, sets, min, max) {
  return { id: randomUUID(), name, sets, minReps: min, maxReps: max };
}

function makeProgram() {
  const upperA = [
    makeEx("Flat Dumbbell Press", 3, 6, 10),
    makeEx("Dumbbell Chest Supported Row", 3, 8, 12),
    makeEx("Dumbbell Overhead Press", 3, 8, 15),
  ];
  const lowerA = [
    makeEx("Barbell Back Squat", 3, 6, 10),
    makeEx("Seated Leg Curls", 3, 10, 15),
    makeEx("Calf Raises", 3, 10, 15),
  ];
  const upperB = [
    makeEx("Incline Dumbbell Press", 3, 8, 10),
    makeEx("Pull-Ups", 3, 6, 10),
    makeEx("Dumbbell Lateral Raises", 3, 10, 20),
  ];
  const lowerB = [
    makeEx("Barbell Hip Thrust", 3, 10, 15),
    makeEx("Romanian Deadlift", 3, 6, 10),
    makeEx("Reverse Lunges", 3, 8, 10),
  ];

  const workouts = { upperA, lowerA, upperB, lowerB };
  return {
    id: randomUUID(),
    startedAt: "2025-10-01T10:00:00.000Z",
    workouts: { cycle1: workouts, cycle2: workouts },
  };
}

/**
 * Generates `count` finished sessions ending at `endIso`, each 2 days apart.
 */
function makeSessions(program, count, endIso) {
  const end = new Date(endIso).getTime();
  const sessions = [];

  for (let i = 0; i < count; i++) {
    // i=0 is the most recent session, i=count-1 is the oldest
    const finishedAt = new Date(end - i * 2 * 24 * 60 * 60 * 1000);
    const startedAt = new Date(finishedAt.getTime() - 50 * 60 * 1000);
    const workoutType = SEQUENCE[(count - 1 - i) % 4];
    const exercises = program.workouts.cycle1[workoutType];

    sessions.push({
      id: randomUUID(),
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      workoutType,
      cycle: "cycle1",
      programBlockId: program.id,
      exercises: exercises.map((ex) => ({
        templateId: ex.id,
        name: ex.name,
        setsCompleted: ex.sets,
        targetSets: ex.sets,
        minReps: ex.minReps,
        maxReps: ex.maxReps,
      })),
    });
  }

  // Return oldest → newest so the import looks natural
  return sessions.reverse();
}

const program = makeProgram();
const out = "docs/test-fixtures";
mkdirSync(out, { recursive: true });

// ── Level 0: no sessions (head only) ────────────────────────────────────────
writeFileSync(
  `${out}/pebb-level-0.json`,
  JSON.stringify({ programs: [program], sessions: [] }, null, 2),
);

// ── Level 1: 6 sessions (head + body) ───────────────────────────────────────
writeFileSync(
  `${out}/pebb-level-1.json`,
  JSON.stringify(
    {
      programs: [program],
      sessions: makeSessions(program, 6, "2026-04-04T18:00:00.000Z"),
    },
    null,
    2,
  ),
);

// ── Level 2: 16 sessions (head + body + arms) ───────────────────────────────
writeFileSync(
  `${out}/pebb-level-2.json`,
  JSON.stringify(
    {
      programs: [program],
      sessions: makeSessions(program, 16, "2026-04-04T18:00:00.000Z"),
    },
    null,
    2,
  ),
);

// ── Level 3: 30 sessions (head + body + arms + legs) ────────────────────────
writeFileSync(
  `${out}/pebb-level-3.json`,
  JSON.stringify(
    {
      programs: [program],
      sessions: makeSessions(program, 30, "2026-04-04T18:00:00.000Z"),
    },
    null,
    2,
  ),
);

// ── Withering: 10 sessions, last one 2026-03-08 (~4 weeks ago) ──────────────
// Base level = 1 (6 ≤ 10 < 16)
// Zero-workout rolling weeks since last session: ~3
// witherLevel = max(0, 3 − floor(10/4)) = max(0, 3 − 2) = 1
// effectiveLevel = max(0, 1 − 1) = 0 → shows level 0 with gray wither styling
writeFileSync(
  `${out}/pebb-withering.json`,
  JSON.stringify(
    {
      programs: [program],
      sessions: makeSessions(program, 10, "2026-03-08T18:00:00.000Z"),
    },
    null,
    2,
  ),
);

console.log(`Generated 5 fixture files in ${out}/`);
console.log("  pebb-level-0.json   → 0 sessions  (head only)");
console.log("  pebb-level-1.json   → 6 sessions  (head + body)");
console.log("  pebb-level-2.json   → 16 sessions (head + body + arms)");
console.log("  pebb-level-3.json   → 30 sessions (head + body + arms + legs)");
console.log(
  "  pebb-withering.json → 10 sessions, last 2026-03-08 (withering, shows as level 0)",
);
