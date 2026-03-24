import { useApp } from "../context/AppContext";
import { WorkoutTypeLabel } from "../components/WorkoutTypeLabel";
import { getWorkoutLabel } from "../lib/rotation";
import { Dumbbell } from "lucide-react";

export function History() {
  const { state } = useApp();
  const sessions = [...state.sessions].reverse();

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pb-20">
        <Dumbbell size={48} className="text-zinc-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">No Workouts Yet</h2>
        <p className="text-zinc-400 text-center">
          Complete your first workout to see history here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <h1 className="text-2xl font-bold mb-1">History</h1>
      <p className="text-zinc-400 text-sm mb-5">
        {state.sessions.length} workouts completed
      </p>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="bg-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <WorkoutTypeLabel
                type={session.workoutType}
                daySet={session.daySet}
              />
              <span className="font-semibold">
                {getWorkoutLabel(session.workoutType)}
              </span>
              <span className="ml-auto text-zinc-400 text-sm">
                {new Date(session.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="space-y-1.5">
              {session.exercises.map((ex, ei) => (
                <div
                  key={ei}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-300">{ex.name}</span>
                  <span className="text-zinc-500">
                    {ex.setsCompleted}/{ex.targetSets} sets · {ex.minReps}-
                    {ex.maxReps} reps
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
