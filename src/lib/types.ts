export type WorkoutType = "upperA" | "upperB" | "lowerA" | "lowerB";
export type DaySet = "day1" | "day2";

export interface ExerciseTemplate {
  id: string;
  name: string;
  sets: number;
  minReps: number;
  maxReps: number;
  startingWeight?: number;
}

export interface ProgramBlock {
  id: string;
  startedAt: string;
  workouts: {
    day1: Record<WorkoutType, ExerciseTemplate[]>;
    day2: Record<WorkoutType, ExerciseTemplate[]>;
  };
}

export interface LoggedExercise {
  templateId: string;
  name: string;
  setsCompleted: number;
  targetSets: number;
  minReps: number;
  maxReps: number;
  startingWeight?: number;
}

export interface WorkoutSession {
  id: string;
  date: string;
  workoutType: WorkoutType;
  daySet: DaySet;
  programBlockId: string;
  exercises: LoggedExercise[];
}
