import type { ProgramBlock, WorkoutSession } from "./types";

const PROGRAMS_KEY = "pushlog:programs";
const SESSIONS_KEY = "pushlog:sessions";

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
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveSessions(sessions: WorkoutSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}
