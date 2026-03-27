import type { ProgramBlock, WorkoutSession } from "./types";

const PROGRAMS_KEY = "pushlog:programs";
const SESSIONS_KEY = "pushlog:sessions";
const SCHEMA_VERSION_KEY = "pushlog:schemaVersion";

const CURRENT_SCHEMA_VERSION = 2;

// ---------------------------------------------------------------------------
// Migration helpers
// ---------------------------------------------------------------------------

/**
 * v1 → v2: WorkoutSession gained `startedAt`/`finishedAt` in place of `date`.
 * Existing records with only `date` get `startedAt` copied from it so that
 * all downstream code can rely on `startedAt` being present.
 */
function migrateSessionsV1ToV2(
  sessions: WorkoutSession[],
): WorkoutSession[] {
  return sessions.map((s) => {
    if (s.startedAt) return s;
    const fallback = s.date ?? new Date(0).toISOString();
    return { ...s, startedAt: fallback };
  });
}

function runMigrations(
  sessions: WorkoutSession[],
  storedVersion: number,
): WorkoutSession[] {
  let migrated = sessions;
  if (storedVersion < 2) {
    migrated = migrateSessionsV1ToV2(migrated);
  }
  return migrated;
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
    return JSON.parse(localStorage.getItem(PROGRAMS_KEY) || "[]");
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
      const migrated = runMigrations(raw, storedVersion);
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
