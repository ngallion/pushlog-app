import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import type {
  ProgramBlock,
  WorkoutSession,
  WorkoutType,
  DaySet,
  ExerciseTemplate,
  LoggedExercise,
} from "../lib/types";
import {
  loadPrograms,
  savePrograms,
  loadSessions,
  saveSessions,
} from "../lib/storage";
import { createDefaultProgram } from "../lib/defaultProgram";
import { randomUUID } from "../lib/uuid";

const DAYS: DaySet[] = ["day1", "day2"];
const TYPES: WorkoutType[] = ["upperA", "upperB", "lowerA", "lowerB"];

function setTemplateWeight(
  program: ProgramBlock,
  templateId: string,
  startingWeight: number | undefined,
): ProgramBlock {
  for (const day of DAYS) {
    for (const type of TYPES) {
      const idx = program.workouts[day][type].findIndex(
        (t) => t.id === templateId,
      );
      if (idx === -1) continue;
      return {
        ...program,
        workouts: {
          ...program.workouts,
          [day]: {
            ...program.workouts[day],
            [type]: program.workouts[day][type].map((t, i) =>
              i === idx ? { ...t, startingWeight } : t,
            ),
          },
        },
      };
    }
  }
  return program;
}

interface AppState {
  programs: ProgramBlock[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
}

type AppAction =
  | {
      type: "START_WORKOUT";
      payload: {
        workoutType: WorkoutType;
        daySet: DaySet;
        programBlockId: string;
        exercises: LoggedExercise[];
      };
    }
  | {
      type: "LOG_EXERCISE";
      payload: {
        exerciseIndex: number;
        setsCompleted: number;
        minReps: number;
        maxReps: number;
      };
    }
  | {
      type: "SWAP_EXERCISE";
      payload: { exerciseIndex: number; newExercise: ExerciseTemplate };
    }
  | { type: "FINISH_WORKOUT" }
  | { type: "SAVE_PROGRAM"; payload: ProgramBlock }
  | { type: "DELETE_PROGRAM"; payload: string }
  | {
      type: "IMPORT_STATE";
      payload: { programs: ProgramBlock[]; sessions: WorkoutSession[] };
    }
  | {
      type: "UPDATE_WEIGHT";
      payload: { exerciseIndex: number; startingWeight: number | undefined };
    };

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "START_WORKOUT": {
      const session: WorkoutSession = {
        id: randomUUID(),
        date: new Date().toISOString(),
        workoutType: action.payload.workoutType,
        daySet: action.payload.daySet,
        programBlockId: action.payload.programBlockId,
        exercises: action.payload.exercises,
      };
      return { ...state, activeSession: session };
    }
    case "LOG_EXERCISE": {
      if (!state.activeSession) return state;
      const exercises = state.activeSession.exercises.map((ex, ei) => {
        if (ei !== action.payload.exerciseIndex) return ex;
        return {
          ...ex,
          setsCompleted: action.payload.setsCompleted,
          minReps: action.payload.minReps,
          maxReps: action.payload.maxReps,
        };
      });
      return { ...state, activeSession: { ...state.activeSession, exercises } };
    }
    case "SWAP_EXERCISE": {
      if (!state.activeSession) return state;
      const { exerciseIndex, newExercise } = action.payload;
      const exercises = state.activeSession.exercises.map((ex, ei) => {
        if (ei !== exerciseIndex) return ex;
        return {
          templateId: newExercise.id,
          name: newExercise.name,
          setsCompleted: 0,
          targetSets: newExercise.sets,
          minReps: newExercise.minReps,
          maxReps: newExercise.maxReps,
        };
      });
      return { ...state, activeSession: { ...state.activeSession, exercises } };
    }
    case "FINISH_WORKOUT": {
      if (!state.activeSession) return state;
      const sessions = [...state.sessions, state.activeSession];
      return { ...state, sessions, activeSession: null };
    }
    case "SAVE_PROGRAM": {
      const exists = state.programs.find((p) => p.id === action.payload.id);
      const programs = exists
        ? state.programs.map((p) =>
            p.id === action.payload.id ? action.payload : p,
          )
        : [...state.programs, action.payload];
      return { ...state, programs };
    }
    case "DELETE_PROGRAM": {
      return {
        ...state,
        programs: state.programs.filter((p) => p.id !== action.payload),
      };
    }
    case "IMPORT_STATE": {
      return {
        ...state,
        programs: action.payload.programs,
        sessions: action.payload.sessions,
        activeSession: null,
      };
    }
    case "UPDATE_WEIGHT": {
      if (!state.activeSession) return state;
      const { exerciseIndex, startingWeight } = action.payload;
      const templateId =
        state.activeSession.exercises[exerciseIndex].templateId;
      const exercises = state.activeSession.exercises.map((ex, ei) =>
        ei !== exerciseIndex ? ex : { ...ex, startingWeight },
      );
      const programs = state.programs.map((p) =>
        p.id !== state.activeSession!.programBlockId
          ? p
          : setTemplateWeight(p, templateId, startingWeight),
      );
      return {
        ...state,
        activeSession: { ...state.activeSession, exercises },
        programs,
      };
    }
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const storedPrograms = loadPrograms();
  const initialPrograms =
    storedPrograms.length > 0 ? storedPrograms : [createDefaultProgram()];

  const [state, dispatch] = useReducer(reducer, {
    programs: initialPrograms,
    sessions: loadSessions(),
    activeSession: null,
  });

  useEffect(() => {
    savePrograms(state.programs);
  }, [state.programs]);

  useEffect(() => {
    saveSessions(state.sessions);
  }, [state.sessions]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
