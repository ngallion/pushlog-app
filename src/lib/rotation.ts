import type { WorkoutType, DaySet, WorkoutSession } from "./types";

const SEQUENCE: WorkoutType[] = ["upperA", "lowerA", "upperB", "lowerB"];

export function getNextWorkoutType(sessions: WorkoutSession[]): WorkoutType {
  return SEQUENCE[sessions.length % 4];
}

export function getCurrentDaySet(sessions: WorkoutSession[]): DaySet {
  return Math.floor(sessions.length / 8) % 2 === 0 ? "day1" : "day2";
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

export function getDaySetLabel(daySet: DaySet): string {
  return daySet === "day1" ? "Day 1" : "Day 2";
}
