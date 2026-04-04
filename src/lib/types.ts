export type WorkoutType = "upperA" | "upperB" | "lowerA" | "lowerB";
export type Cycle = "cycle1" | "cycle2";

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
    cycle1: Record<WorkoutType, ExerciseTemplate[]>;
    cycle2: Record<WorkoutType, ExerciseTemplate[]>;
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
  startedAt: string;   // ISO timestamp — when the workout was started
  finishedAt?: string; // ISO timestamp — when the workout was finished
  date?: string;       // kept for backwards-compatibility with pre-v2 exports
  workoutType: WorkoutType;
  cycle: Cycle;
  programBlockId: string;
  exercises: LoggedExercise[];
}
