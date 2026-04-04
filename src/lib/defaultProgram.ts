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
      cycle1: {
        upperA: [
          ex("Flat Dumbbell Press", 3, 6, 10),
          ex("Dumbbell Chest Supported Row", 3, 8, 12),
          ex("Seated Mid-Chest Cable Fly", 3, 10, 15),
          ex("Lat Pulldowns", 3, 10, 20),
          ex("Dumbbell Overhead Press", 3, 8, 15),
          ex("Barbell Cable Curls", 3, 10, 15),
          ex("Tricep Cable Pushdowns", 3, 10, 15),
        ],
        lowerA: [
          ex("Barbell Back Squat", 3, 6, 10),
          ex("Seated Leg Curls", 3, 10, 15),
          ex("Seated Leg Extensions", 3, 10, 15),
          ex("Hyperextensions", 3, 10, 20),
          ex("Standing Weighted Calf Raises", 3, 10, 15),
        ],
        upperB: [
          ex("Low Incline Dumbbell Press", 3, 8, 10),
          ex("Pull-Ups", 3, 6, 10),
          ex("Seated Mid-Chest Cable Fly", 3, 10, 15),
          ex("Seated Cable Row", 3, 8, 12),
          ex("Dumbbell Lateral Raises", 3, 10, 20),
          ex("Incline Dumbbell Overhead Extensions", 3, 10, 15),
          ex("Incline Dumbbell Curls", 3, 10, 15),
        ],
        lowerB: [
          ex("Barbell Hip Thrust", 3, 10, 15),
          ex("Barbell Romanian Deadlift", 3, 6, 10),
          ex("Front Foot Elevated Reverse Lunges", 3, 8, 10),
          ex("Standing Weighted Calf Raises", 3, 10, 15),
        ],
      },
      cycle2: {
        upperA: [
          ex("Push-Ups", 3, 10, 20),
          ex("One Armed Rows", 3, 10, 15),
          ex("Flys", 3, 10, 15),
          ex("Lat Pullover", 3, 10, 15),
          ex("Arnold Press", 3, 10, 15),
          ex("Hammer Curls", 3, 10, 15),
          ex("One Arm Tricep Pushback", 3, 10, 15),
        ],
        lowerA: [
          ex("Sumo Squats", 3, 10, 15),
          ex("Sissy Squats", 3, 10, 15),
          ex("Kettlebell Swings", 3, 10, 15),
          ex("Calf Raises", 3, 15, 20),
        ],
        upperB: [
          ex("Legs Elevated Push-Ups", 3, 10, 15),
          ex("Body Weight Rows", 3, 10, 15),
          ex("Incline Flys", 3, 10, 15),
          ex("Bent Over Flies", 3, 10, 15),
          ex("Shrugs", 3, 10, 15),
          ex("Body Weight Curls", 3, 10, 15),
          ex("TRX Tricep", 3, 10, 15),
        ],
        lowerB: [
          ex("Bulgarian Split Squat", 3, 8, 12),
          ex("Good Mornings", 3, 10, 15),
          ex("Side Squats", 3, 10, 15),
          ex("Calf Raises", 3, 15, 20),
        ],
      },
    },
  };
}
