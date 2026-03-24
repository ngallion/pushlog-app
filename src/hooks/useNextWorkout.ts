import { useApp } from "../context/AppContext";
import { getNextWorkoutType, getCurrentDaySet } from "../lib/rotation";
import type { WorkoutType, DaySet } from "../lib/types";

export function useNextWorkout(): { workoutType: WorkoutType; daySet: DaySet } {
  const { state } = useApp();
  return {
    workoutType: getNextWorkoutType(state.sessions),
    daySet: getCurrentDaySet(state.sessions),
  };
}
