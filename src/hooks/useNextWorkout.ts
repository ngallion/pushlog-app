import { useApp } from "../context/AppContext";
import {
  getNextWorkoutType,
  getCurrentCycle,
  getRotationIndex,
} from "../lib/rotation";
import type { WorkoutType, Cycle } from "../lib/types";

export function useNextWorkout(): {
  workoutType: WorkoutType;
  cycle: Cycle;
  rotationIndex: number;
} {
  const { state } = useApp();
  const rotationIndex = getRotationIndex(state.sessions, state.rotationAnchor);
  return {
    workoutType: getNextWorkoutType(rotationIndex),
    cycle: getCurrentCycle(rotationIndex),
    rotationIndex,
  };
}
