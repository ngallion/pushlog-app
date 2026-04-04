import { useApp } from "../context/AppContext";
import type { WorkoutType, Cycle, WorkoutSession } from "../lib/types";

export function useLastSession(
  workoutType: WorkoutType,
  cycle: Cycle,
): WorkoutSession | null {
  const { state } = useApp();
  const matching = state.sessions.filter(
    (s) => s.workoutType === workoutType && s.cycle === cycle,
  );
  return matching.length > 0 ? matching[matching.length - 1] : null;
}
