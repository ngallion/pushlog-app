import type {
  WorkoutType,
  Cycle,
  WorkoutSession,
  RotationAnchor,
} from "./types";

export const SEQUENCE: WorkoutType[] = ["upperA", "lowerA", "upperB", "lowerB"];

function sessionTime(s: WorkoutSession): number {
  return Date.parse(s.finishedAt ?? s.startedAt ?? s.date ?? "");
}

/** Position of the next workout in the rotation (0 = Upper A, Cycle 1, workout 1 of 8). */
export function getRotationIndex(
  sessions: WorkoutSession[],
  anchor: RotationAnchor | null,
): number {
  if (!anchor) return sessions.length;
  const anchorTime = Date.parse(anchor.setAt);
  const sinceAnchor = sessions.filter((s) => sessionTime(s) > anchorTime);
  return anchor.position + sinceAnchor.length;
}

/** Anchor that restarts the rotation at `type`'s slot in week 1 of `cycle`. */
export function createRotationAnchor(
  type: WorkoutType,
  cycle: Cycle,
): RotationAnchor {
  return {
    position: SEQUENCE.indexOf(type) + (cycle === "cycle2" ? 8 : 0),
    setAt: new Date().toISOString(),
  };
}

/** Anchor that moves the rotation one slot past `index`, skipping that workout. */
export function createSkipAnchor(index: number): RotationAnchor {
  return { position: index + 1, setAt: new Date().toISOString() };
}

export function getNextWorkoutType(index: number): WorkoutType {
  return SEQUENCE[index % 4];
}

export function getCurrentCycle(index: number): Cycle {
  return Math.floor(index / 8) % 2 === 0 ? "cycle1" : "cycle2";
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
