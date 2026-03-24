import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useNextWorkout } from "../hooks/useNextWorkout";
import { useLastSession } from "../hooks/useLastSession";
import { WorkoutTypeLabel } from "../components/WorkoutTypeLabel";
import { ExerciseCard } from "../components/ExerciseCard";
import { getWorkoutLabel, getDaySetLabel } from "../lib/rotation";
import type { ExerciseTemplate, LoggedExercise } from "../lib/types";
import { Dumbbell, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { randomUUID } from "../lib/uuid";

export function Today() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { workoutType, daySet } = useNextWorkout();
  const session = state.activeSession;
  const lastSessionForType = useLastSession(
    session?.workoutType ?? workoutType,
    session?.daySet ?? daySet,
  );

  const currentProgram = state.programs[state.programs.length - 1];

  // ── Active workout view ──────────────────────────────────────────────────
  if (session) {
    const completedExercises = session.exercises.filter(
      (e) => e.setsCompleted === e.targetSets,
    ).length;
    const totalExercises = session.exercises.length;

    const handleChange = (
      exerciseIndex: number,
      setsCompleted: number,
      minReps: number,
      maxReps: number,
    ) => {
      dispatch({
        type: "LOG_EXERCISE",
        payload: { exerciseIndex, setsCompleted, minReps, maxReps },
      });
    };

    const handleSwap = (exerciseIndex: number, newName: string) => {
      const current = session.exercises[exerciseIndex];
      const newExercise: ExerciseTemplate = {
        id: randomUUID(),
        name: newName,
        sets: current.targetSets,
        minReps: current.minReps,
        maxReps: current.maxReps,
      };
      dispatch({
        type: "SWAP_EXERCISE",
        payload: { exerciseIndex, newExercise },
      });
    };

    const handleWeightChange = (
      exerciseIndex: number,
      weight: number | undefined,
    ) => {
      dispatch({
        type: "UPDATE_WEIGHT",
        payload: { exerciseIndex, startingWeight: weight },
      });
    };

    const handleFinish = () => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#7c3aed", "#a78bfa", "#ffffff", "#6ee7b7"],
      });
      dispatch({ type: "FINISH_WORKOUT" });
    };

    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-28">
        <div className="flex items-center gap-3 mb-1">
          <WorkoutTypeLabel
            type={session.workoutType}
            daySet={session.daySet}
          />
          <h1 className="text-2xl font-bold">
            {getWorkoutLabel(session.workoutType)}
          </h1>
        </div>
        <p className="text-zinc-400 text-sm mb-2">
          {new Date(session.date).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <div className="text-xs text-zinc-500 mb-6">
          {completedExercises}/{totalExercises} exercises complete
        </div>

        {session.exercises.map((exercise, ei) => (
          <ExerciseCard
            key={ei}
            exercise={exercise}
            exerciseIndex={ei}
            lastSession={lastSessionForType}
            onChange={handleChange}
            onSwap={handleSwap}
            onWeightChange={handleWeightChange}
          />
        ))}

        <button
          onClick={handleFinish}
          className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 transition-colors mt-4"
        >
          <CheckCircle size={22} />
          Finish Workout
        </button>
      </div>
    );
  }

  // ── No-program fallback ──────────────────────────────────────────────────
  if (!currentProgram) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pb-20">
        <Dumbbell size={48} className="text-violet-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">No Program Yet</h1>
        <p className="text-zinc-400 text-center mb-6">
          Create your first program to get started.
        </p>
        <button
          onClick={() => navigate("/program")}
          className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-6 py-3 font-semibold"
        >
          Create Program
        </button>
      </div>
    );
  }

  // ── Next workout preview ─────────────────────────────────────────────────
  const exercises: ExerciseTemplate[] =
    currentProgram.workouts[daySet][workoutType];

  const handleStart = () => {
    const loggedExercises: LoggedExercise[] = exercises.map((ex) => ({
      templateId: ex.id,
      name: ex.name,
      setsCompleted: 0,
      targetSets: ex.sets,
      minReps: ex.minReps,
      maxReps: ex.maxReps,
      startingWeight: ex.startingWeight,
    }));
    dispatch({
      type: "START_WORKOUT",
      payload: {
        workoutType,
        daySet,
        programBlockId: currentProgram.id,
        exercises: loggedExercises,
      },
    });
  };

  const totalSessions = state.sessions.length;
  const sessionsInCurrentBlock = (totalSessions % 8) + 1;

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <h1 className="text-3xl font-bold mb-1">Today</h1>
      <p className="text-zinc-400 mb-6">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="bg-zinc-800 rounded-xl p-6 mb-4">
        <p className="text-zinc-400 text-sm mb-2">Next Workout</p>
        <div className="flex items-center gap-3 mb-4">
          <WorkoutTypeLabel type={workoutType} daySet={daySet} />
          <span className="text-2xl font-bold">
            {getWorkoutLabel(workoutType)}
          </span>
        </div>
        <div className="space-y-1 mb-6">
          {exercises.map((ex) => (
            <div key={ex.id} className="flex justify-between text-sm">
              <span className="text-zinc-300">{ex.name}</span>
              <span className="text-zinc-500">
                {ex.sets}×{ex.minReps}-{ex.maxReps}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={handleStart}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-lg py-3 font-semibold text-lg transition-colors"
        >
          Start Workout
        </button>
      </div>

      <div className="flex justify-between text-xs text-zinc-500 px-1">
        <span>{totalSessions} total workouts</span>
        <span>
          {getDaySetLabel(daySet)} · {sessionsInCurrentBlock} of 8
        </span>
      </div>
    </div>
  );
}
