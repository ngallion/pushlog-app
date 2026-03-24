import { useApp } from "../context/AppContext";
import type { WorkoutType, DaySet, WorkoutSession } from "../lib/types";

export function useLastSession(
  workoutType: WorkoutType,
  daySet: DaySet,
): WorkoutSession | null {
  const { state } = useApp();
  const matching = state.sessions.filter(
    (s) => s.workoutType === workoutType && s.daySet === daySet,
  );
  return matching.length > 0 ? matching[matching.length - 1] : null;
}
