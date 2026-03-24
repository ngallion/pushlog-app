import { useState, useEffect, useRef } from "react";
import type { LoggedExercise, WorkoutSession } from "../lib/types";
import { RefreshCw, Minus, Plus } from "lucide-react";

interface Props {
  exercise: LoggedExercise;
  exerciseIndex: number;
  lastSession: WorkoutSession | null;
  onChange: (
    exerciseIndex: number,
    setsCompleted: number,
    minReps: number,
    maxReps: number,
  ) => void;
  onSwap: (exerciseIndex: number, newName: string) => void;
  onWeightChange: (exerciseIndex: number, weight: number | undefined) => void;
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  lastSession,
  onChange,
  onSwap,
  onWeightChange,
}: Props) {
  const [swapping, setSwapping] = useState(false);
  const [swapName, setSwapName] = useState("");
  const [justCompleted, setJustCompleted] = useState(false);
  const prevSets = useRef(exercise.setsCompleted);

  const allDone = exercise.setsCompleted === exercise.targetSets;

  useEffect(() => {
    if (exercise.setsCompleted > prevSets.current && allDone) {
      setJustCompleted(true);
      const t = setTimeout(() => setJustCompleted(false), 700);
      return () => clearTimeout(t);
    }
    prevSets.current = exercise.setsCompleted;
  }, [exercise.setsCompleted, allDone]);

  const lastExercise = lastSession?.exercises.find(
    (e) => e.templateId === exercise.templateId || e.name === exercise.name,
  );

  const handleSwapConfirm = () => {
    if (swapName.trim()) {
      onSwap(exerciseIndex, swapName.trim());
      setSwapping(false);
      setSwapName("");
    }
  };

  const adjustSets = (delta: number) => {
    const next = Math.max(
      0,
      Math.min(exercise.targetSets, exercise.setsCompleted + delta),
    );
    onChange(exerciseIndex, next, exercise.minReps, exercise.maxReps);
  };

  return (
    <div
      style={
        justCompleted ? { animation: "card-complete 0.7s ease-out" } : undefined
      }
      className={`bg-zinc-800 rounded-xl p-4 mb-3 transition-opacity ${allDone ? "opacity-60" : ""}`}
    >
      {swapping ? (
        <div className="flex gap-2 items-center mb-3">
          <input
            autoFocus
            type="text"
            placeholder="New exercise name"
            value={swapName}
            onChange={(e) => setSwapName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSwapConfirm();
              if (e.key === "Escape") setSwapping(false);
            }}
            className="flex-1 bg-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <button
            onClick={handleSwapConfirm}
            className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded text-sm"
          >
            Confirm
          </button>
          <button
            onClick={() => setSwapping(false)}
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-3 py-1.5 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-zinc-100">{exercise.name}</h3>
          <button
            onClick={() => setSwapping(true)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RefreshCw size={12} /> Swap
          </button>
        </div>
      )}

      {lastExercise && (
        <div className="mb-3 text-xs text-zinc-400 bg-zinc-700/50 rounded px-3 py-2">
          <span className="text-zinc-500 mr-1">Last time:</span>
          {lastExercise.setsCompleted} sets · {lastExercise.minReps}-
          {lastExercise.maxReps} reps
          {lastExercise.startingWeight != null &&
            ` · ${lastExercise.startingWeight} lbs`}
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Sets stepper */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustSets(-1)}
            disabled={exercise.setsCompleted === 0}
            className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 flex items-center justify-center transition-colors"
          >
            <Minus size={14} />
          </button>
          <div className="text-center min-w-[60px]">
            <div
              key={exercise.setsCompleted}
              style={{ animation: "pop 0.25s ease-out" }}
              className={`text-xl font-bold ${allDone ? "text-green-400" : "text-zinc-100"}`}
            >
              {exercise.setsCompleted}
              <span className="text-zinc-500 text-sm font-normal">
                /{exercise.targetSets}
              </span>
            </div>
            <div className="text-xs text-zinc-500">sets</div>
          </div>
          <button
            onClick={() => adjustSets(1)}
            disabled={exercise.setsCompleted === exercise.targetSets}
            className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 flex items-center justify-center transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Reps inputs */}
        <div className="flex gap-2 flex-1">
          <div className="flex-1">
            <div className="text-xs text-zinc-500 mb-1">min reps</div>
            <input
              type="number"
              value={exercise.minReps}
              onChange={(e) =>
                onChange(
                  exerciseIndex,
                  exercise.setsCompleted,
                  Number(e.target.value),
                  exercise.maxReps,
                )
              }
              className="w-full bg-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div className="flex-1">
            <div className="text-xs text-zinc-500 mb-1">max reps</div>
            <input
              type="number"
              value={exercise.maxReps}
              onChange={(e) =>
                onChange(
                  exerciseIndex,
                  exercise.setsCompleted,
                  exercise.minReps,
                  Number(e.target.value),
                )
              }
              className="w-full bg-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Weight input */}
        <div className="w-20">
          <div className="text-xs text-zinc-500 mb-1">lbs</div>
          <input
            type="number"
            placeholder="—"
            value={exercise.startingWeight ?? ""}
            onChange={(e) =>
              onWeightChange(
                exerciseIndex,
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
            className="w-full bg-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>
    </div>
  );
}
