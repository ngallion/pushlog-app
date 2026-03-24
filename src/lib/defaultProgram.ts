import type { ProgramBlock, ExerciseTemplate } from "./types";
import { randomUUID } from "./uuid";

function ex(
  name: string,
  sets: number,
  minReps: number,
  maxReps: number,
): ExerciseTemplate {
  return { id: randomUUID(), name, sets, minReps, maxReps };
}

export function createDefaultProgram(): ProgramBlock {
  return {
    id: randomUUID(),
    startedAt: new Date().toISOString(),
    workouts: {
      day1: {
        upperA: [
          ex("Bench Press", 3, 6, 8),
          ex("Barbell Row", 3, 6, 8),
          ex("Overhead Press", 3, 8, 10),
          ex("Bicep Curl", 3, 10, 12),
        ],
        upperB: [
          ex("Incline Press", 3, 8, 10),
          ex("Lat Pulldown", 3, 8, 10),
          ex("Face Pull", 3, 15, 20),
          ex("Tricep Pushdown", 3, 10, 12),
        ],
        lowerA: [
          ex("Squat", 3, 5, 8),
          ex("Romanian Deadlift", 3, 8, 10),
          ex("Leg Press", 3, 10, 12),
          ex("Calf Raise", 4, 15, 20),
        ],
        lowerB: [
          ex("Deadlift", 3, 3, 5),
          ex("Leg Curl", 3, 10, 12),
          ex("Bulgarian Split Squat", 3, 8, 10),
          ex("Leg Extension", 3, 12, 15),
        ],
      },
      day2: {
        upperA: [
          ex("Bench Press", 4, 8, 10),
          ex("Cable Row", 4, 10, 12),
          ex("Lateral Raise", 3, 12, 15),
          ex("Hammer Curl", 3, 10, 12),
        ],
        upperB: [
          ex("Dumbbell Press", 4, 10, 12),
          ex("Pull-up", 3, 6, 10),
          ex("Rear Delt Fly", 3, 15, 20),
          ex("Skull Crusher", 3, 10, 12),
        ],
        lowerA: [
          ex("Front Squat", 3, 6, 8),
          ex("Stiff-Leg Deadlift", 3, 10, 12),
          ex("Walking Lunge", 3, 12, 15),
          ex("Seated Calf Raise", 4, 15, 20),
        ],
        lowerB: [
          ex("Trap Bar Deadlift", 3, 5, 8),
          ex("Leg Curl", 4, 12, 15),
          ex("Goblet Squat", 3, 10, 12),
          ex("Leg Extension", 3, 15, 20),
        ],
      },
    },
  };
}
