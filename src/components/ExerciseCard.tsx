import { useState, useEffect, useRef } from "react";
import type { LoggedExercise, WorkoutSession } from "../lib/types";
import { RefreshCw, Minus, Plus, Search, GripVertical } from "lucide-react";

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
  dragHandleAttributes?: Record<string, unknown>;
  dragHandleListeners?: Record<string, unknown>;
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  lastSession,
  onChange,
  onSwap,
  onWeightChange,
  dragHandleAttributes,
  dragHandleListeners,
}: Props) {
  const [swapping, setSwapping] = useState(false);
  const [swapName, setSwapName] = useState("");
  const [justCompleted, setJustCompleted] = useState(false);
  const [weightBump, setWeightBump] = useState<number | null>(null);
  const prevSets = useRef(exercise.setsCompleted);
  const prevWeight = useRef(exercise.startingWeight);

  const allDone = exercise.setsCompleted === exercise.targetSets;

  useEffect(() => {
    if (exercise.setsCompleted > prevSets.current && allDone) {
      setJustCompleted(true);
      const t = setTimeout(() => setJustCompleted(false), 700);
      return () => clearTimeout(t);
    }
    prevSets.current = exercise.setsCompleted;
  }, [exercise.setsCompleted, allDone]);

  const weightDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (weightDebounce.current) clearTimeout(weightDebounce.current);
    const next = exercise.startingWeight;
    weightDebounce.current = setTimeout(() => {
      const prev = prevWeight.current;
      if (next != null && prev != null && next > prev) {
        setWeightBump(next - prev);
        setTimeout(() => setWeightBump(null), 900);
      }
      prevWeight.current = next;
    }, 600);
    return () => {
      if (weightDebounce.current) clearTimeout(weightDebounce.current);
    };
  }, [exercise.startingWeight]);

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
          <div className="flex items-center gap-2">
            {dragHandleAttributes && (
              <button
                {...dragHandleAttributes}
                {...dragHandleListeners}
                className="text-zinc-500 hover:text-zinc-300 touch-none cursor-grab active:cursor-grabbing"
              >
                <GripVertical size={14} />
              </button>
            )}
            <h3 className="font-semibold text-zinc-100">{exercise.name}</h3>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(exercise.name + " exercise form")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Search size={13} />
            </a>
          </div>
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

      <div className="flex items-start gap-2">
        {/* Sets stepper */}
        <div className="flex flex-col">
          <div className="text-xs text-zinc-500 mb-1">sets</div>
          <div className="flex items-center gap-1.5 mt-[2px]">
            <button
              onClick={() => adjustSets(-1)}
              disabled={exercise.setsCompleted === 0}
              className="w-7 h-7 rounded-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 flex items-center justify-center transition-colors"
            >
              <Minus size={12} />
            </button>
            <div
              key={exercise.setsCompleted}
              style={{ animation: "pop 0.25s ease-out" }}
              className={`text-base font-bold min-w-[44px] text-center ${allDone ? "text-green-400" : "text-zinc-100"}`}
            >
              {exercise.setsCompleted}
              <span className="text-zinc-500 text-xs font-normal">
                /{exercise.targetSets}
              </span>
            </div>
            <button
              onClick={() => adjustSets(1)}
              disabled={exercise.setsCompleted === exercise.targetSets}
              className="w-7 h-7 rounded-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 flex items-center justify-center transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Reps inputs */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-zinc-500 mb-1">reps</div>
          <div className="flex items-center bg-zinc-700 rounded overflow-hidden focus-within:ring-1 focus-within:ring-violet-500">
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
              className="w-full min-w-0 bg-transparent px-2 py-1.5 text-sm text-zinc-100 focus:outline-none text-center"
            />
            <span className="text-zinc-400 text-sm select-none">–</span>
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
              className="w-full min-w-0 bg-transparent px-2 py-1.5 text-sm text-zinc-100 focus:outline-none text-center"
            />
          </div>
        </div>

        {/* Weight input */}
        <div className="w-16 relative">
          {weightBump != null && (
            <div
              style={{ animation: "float-up 0.9s ease-out forwards" }}
              className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-bold text-green-400 pointer-events-none whitespace-nowrap"
            >
              +{weightBump} lbs
            </div>
          )}
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
            className="w-full bg-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>
    </div>
  );
}
