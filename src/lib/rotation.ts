import type { WorkoutType, Cycle, WorkoutSession } from "./types";

const SEQUENCE: WorkoutType[] = ["upperA", "lowerA", "upperB", "lowerB"];

export function getNextWorkoutType(sessions: WorkoutSession[]): WorkoutType {
  return SEQUENCE[sessions.length % 4];
}

export function getCurrentCycle(sessions: WorkoutSession[]): Cycle {
  return Math.floor(sessions.length / 8) % 2 === 0 ? "cycle1" : "cycle2";
}

export function getWorkoutLabel(type: WorkoutType): string {
  const labels: Record<WorkoutType, string> = {
    upperA: "Upper A",
    upperB: "Upper B",
    lowerA: "Lower A",
    lowerB: "Lower B",
  };
  return labels[type];
}

export function getCycleLabel(cycle: Cycle): string {
  return cycle === "cycle1" ? "Cycle 1" : "Cycle 2";
}
