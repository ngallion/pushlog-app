import type { ProgramBlock, WorkoutSession } from "./types";

const REST_TIMER_KEY = "pushlog:restTimerDuration";
export const DEFAULT_REST_DURATION = 90;

const PROGRAMS_KEY = "pushlog:programs";
const SESSIONS_KEY = "pushlog:sessions";
const SCHEMA_VERSION_KEY = "pushlog:schemaVersion";

const CURRENT_SCHEMA_VERSION = 3;

// ---------------------------------------------------------------------------
// Migration helpers
// ---------------------------------------------------------------------------

/**
 * v1 → v2: WorkoutSession gained `startedAt`/`finishedAt` in place of `date`.
 * Existing records with only `date` get `startedAt` copied from it so that
 * all downstream code can rely on `startedAt` being present.
 */
function migrateSessionsV1ToV2(sessions: WorkoutSession[]): WorkoutSession[] {
  return sessions.map((s) => {
    if (s.startedAt) return s;
    const fallback = s.date ?? new Date(0).toISOString();
    return { ...s, startedAt: fallback };
  });
}

/**
 * v2 → v3: "DaySet" concept renamed to "Cycle".
 * Sessions: `daySet: "day1"|"day2"` field → `cycle: "cycle1"|"cycle2"`.
 */
function migrateSessionsV2ToV3(sessions: WorkoutSession[]): WorkoutSession[] {
  return sessions.map((s) => {
    const raw = s as Record<string, unknown>;
    if ("cycle" in raw) return s;
    const daySet = raw["daySet"] as string | undefined;
    const cycle = daySet === "day1" ? "cycle1" : "cycle2";
    const { daySet: _removed, ...rest } = raw;
    return { ...rest, cycle } as WorkoutSession;
  });
}

/**
 * v2 → v3: ProgramBlock `workouts` keys `day1`/`day2` → `cycle1`/`cycle2`.
 */
function migrateProgramsV2ToV3(programs: ProgramBlock[]): ProgramBlock[] {
  return programs.map((p) => {
    const raw = p.workouts as Record<string, unknown>;
    if ("cycle1" in raw) return p;
    return {
      ...p,
      workouts: { cycle1: raw["day1"], cycle2: raw["day2"] },
    } as ProgramBlock;
  });
}

function runSessionMigrations(
  sessions: WorkoutSession[],
  storedVersion: number,
): WorkoutSession[] {
  let migrated = sessions;
  if (storedVersion < 2) migrated = migrateSessionsV1ToV2(migrated);
  if (storedVersion < 3) migrated = migrateSessionsV2ToV3(migrated);
  return migrated;
}

function runProgramMigrations(
  programs: ProgramBlock[],
  storedVersion: number,
): ProgramBlock[] {
  let migrated = programs;
  if (storedVersion < 3) migrated = migrateProgramsV2ToV3(migrated);
  return migrated;
}

/**
 * Run all migrations on imported data. Since exported files have no version
 * stamp, we always apply every migration (all are idempotent).
 */
export function migrateImportedData(
  programs: ProgramBlock[],
  sessions: WorkoutSession[],
): { programs: ProgramBlock[]; sessions: WorkoutSession[] } {
  return {
    programs: runProgramMigrations(programs, 1),
    sessions: runSessionMigrations(sessions, 1),
  };
}

function getStoredSchemaVersion(): number {
  const raw = localStorage.getItem(SCHEMA_VERSION_KEY);
  if (raw === null) return 1; // no version stored → original schema
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? 1 : parsed;
}

function setStoredSchemaVersion(version: number): void {
  localStorage.setItem(SCHEMA_VERSION_KEY, String(version));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function loadPrograms(): ProgramBlock[] {
  try {
    const raw: ProgramBlock[] = JSON.parse(
      localStorage.getItem(PROGRAMS_KEY) || "[]",
    );
    const storedVersion = getStoredSchemaVersion();
    if (storedVersion < CURRENT_SCHEMA_VERSION) {
      const migrated = runProgramMigrations(raw, storedVersion);
      localStorage.setItem(PROGRAMS_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return raw;
  } catch {
    return [];
  }
}

export function savePrograms(programs: ProgramBlock[]): void {
  localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs));
}

export function loadSessions(): WorkoutSession[] {
  try {
    const raw: WorkoutSession[] = JSON.parse(
      localStorage.getItem(SESSIONS_KEY) || "[]",
    );
    const storedVersion = getStoredSchemaVersion();
    if (storedVersion < CURRENT_SCHEMA_VERSION) {
      const migrated = runSessionMigrations(raw, storedVersion);
      // Persist migrated data and bump version
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(migrated));
      setStoredSchemaVersion(CURRENT_SCHEMA_VERSION);
      return migrated;
    }
    return raw;
  } catch {
    return [];
  }
}

export function saveSessions(sessions: WorkoutSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  // Ensure the version stamp is always current after a save
  setStoredSchemaVersion(CURRENT_SCHEMA_VERSION);
}

export function loadRestTimerDuration(): number {
  const raw = localStorage.getItem(REST_TIMER_KEY);
  if (raw === null) return DEFAULT_REST_DURATION;
  const n = parseInt(raw, 10);
  return isNaN(n) ? DEFAULT_REST_DURATION : n;
}

export function saveRestTimerDuration(seconds: number): void {
  localStorage.setItem(REST_TIMER_KEY, String(seconds));
}
