import { useApp } from "../context/AppContext";
import { getNextWorkoutType, getCurrentCycle } from "../lib/rotation";
import type { WorkoutType, Cycle } from "../lib/types";

export function useNextWorkout(): { workoutType: WorkoutType; cycle: Cycle } {
  const { state } = useApp();
  return {
    workoutType: getNextWorkoutType(state.sessions),
    cycle: getCurrentCycle(state.sessions),
  };
}
