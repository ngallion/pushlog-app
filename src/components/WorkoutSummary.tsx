import {
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
} from "lucide-react";
import { WorkoutTypeLabel } from "./WorkoutTypeLabel";
import { getWorkoutLabel, getCycleLabel } from "../lib/rotation";
import type {
  WorkoutSession,
  WorkoutType,
  Cycle,
  ExerciseTemplate,
} from "../lib/types";

interface Props {
  session: WorkoutSession;
  previousSession: WorkoutSession | null;
  allPreviousSessions: WorkoutSession[];
  nextWorkoutType: WorkoutType;
  nextCycle: Cycle;
  nextExercises: ExerciseTemplate[];
  onDismiss: () => void;
}

export function WorkoutSummary({
  session,
  previousSession,
  allPreviousSessions,
  nextWorkoutType,
  nextCycle,
  nextExercises,
  onDismiss,
}: Props) {
  const totalSets = session.exercises.reduce(
    (sum, e) => sum + e.setsCompleted,
    0,
  );
  const prevTotalSets = previousSession
    ? previousSession.exercises.reduce((sum, e) => sum + e.setsCompleted, 0)
    : null;

  // PR detection: any exercise with a weight higher than all previous sessions
  const prNames = new Set(
    session.exercises
      .filter((ex) => ex.startingWeight !== undefined)
      .filter((ex) => {
        const maxPrev = allPreviousSessions
          .flatMap((s) => s.exercises)
          .filter((e) => e.templateId === ex.templateId || e.name === ex.name)
          .reduce((max, e) => Math.max(max, e.startingWeight ?? 0), 0);
        return (ex.startingWeight ?? 0) > maxPrev;
      })
      .map((ex) => ex.name),
  );

  const setsDelta = prevTotalSets !== null ? totalSets - prevTotalSets : null;

  const exerciseRows = session.exercises.map((ex) => {
    const prevEx = previousSession?.exercises.find(
      (e) => e.templateId === ex.templateId || e.name === ex.name,
    );
    const weightDelta =
      prevEx?.startingWeight !== undefined && ex.startingWeight !== undefined
        ? ex.startingWeight - prevEx.startingWeight
        : null;
    return { ex, weightDelta, isPR: prNames.has(ex.name) };
  });

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-28">
      {/* Header */}
      <div className="text-center mb-8">
        <CheckCircle size={52} className="text-green-400 mx-auto mb-3" />
        <h1 className="text-3xl font-bold mb-2">Workout Complete!</h1>
        <div className="flex items-center justify-center gap-2">
          <WorkoutTypeLabel type={session.workoutType} cycle={session.cycle} />
          <span className="text-zinc-400">
            {getWorkoutLabel(session.workoutType)}
          </span>
        </div>
      </div>

      {/* Stats card */}
      <div className="bg-zinc-800 rounded-xl p-5 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-zinc-400 text-sm mb-0.5">Total Sets</p>
            <p className="text-4xl font-bold tabular-nums">{totalSets}</p>
          </div>
          {setsDelta !== null && (
            <div
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg ${
                setsDelta > 0
                  ? "bg-green-900/40 text-green-400"
                  : setsDelta < 0
                    ? "bg-red-900/40 text-red-400"
                    : "bg-zinc-700 text-zinc-400"
              }`}
            >
              {setsDelta > 0 ? (
                <TrendingUp size={14} />
              ) : setsDelta < 0 ? (
                <TrendingDown size={14} />
              ) : (
                <Minus size={14} />
              )}
              <span>
                {setsDelta > 0
                  ? `+${setsDelta}`
                  : setsDelta === 0
                    ? "Same"
                    : setsDelta}{" "}
                vs last time
              </span>
            </div>
          )}
        </div>

        {prNames.size > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-700">
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">
              New PRs
            </p>
            <div className="flex flex-wrap gap-2">
              {[...prNames].map((name) => (
                <span
                  key={name}
                  className="bg-violet-900/50 text-violet-300 text-xs font-semibold px-2.5 py-1 rounded-full"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Exercise breakdown */}
      <div className="bg-zinc-800 rounded-xl p-5 mb-4">
        <p className="text-xs text-zinc-400 uppercase tracking-wide mb-3">
          Exercises
        </p>
        <div className="space-y-3">
          {exerciseRows.map(({ ex, weightDelta, isPR }) => (
            <div
              key={ex.templateId}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-zinc-200 truncate">
                  {ex.name}
                </span>
                {isPR && (
                  <span className="text-xs bg-violet-800/60 text-violet-300 px-1.5 py-0.5 rounded font-semibold shrink-0">
                    PR
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 text-right">
                <span className="text-sm text-zinc-400">
                  {ex.setsCompleted}/{ex.targetSets} sets
                  {ex.startingWeight !== undefined
                    ? ` · ${ex.startingWeight} lbs`
                    : ""}
                </span>
                {weightDelta !== null && weightDelta !== 0 && (
                  <span
                    className={`text-xs font-semibold ${
                      weightDelta > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {weightDelta > 0 ? `+${weightDelta}` : weightDelta}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next workout preview */}
      <div className="bg-zinc-800/60 rounded-xl p-5 mb-6">
        <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">
          Up Next
        </p>
        <div className="flex items-center gap-3 mb-3">
          <WorkoutTypeLabel type={nextWorkoutType} cycle={nextCycle} />
          <span className="font-semibold">
            {getWorkoutLabel(nextWorkoutType)}
          </span>
          <span className="text-zinc-500 text-sm">
            {getCycleLabel(nextCycle)}
          </span>
        </div>
        {nextExercises.length > 0 ? (
          <div className="space-y-1">
            {nextExercises.slice(0, 4).map((ex) => (
              <div key={ex.id} className="flex justify-between text-sm">
                <span className="text-zinc-400">{ex.name}</span>
                <span className="text-zinc-600">
                  {ex.sets}×{ex.minReps}–{ex.maxReps}
                </span>
              </div>
            ))}
            {nextExercises.length > 4 && (
              <p className="text-xs text-zinc-600 pt-1">
                +{nextExercises.length - 4} more
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No exercises scheduled.</p>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 transition-colors"
      >
        Done <ChevronRight size={18} />
      </button>
    </div>
  );
}
