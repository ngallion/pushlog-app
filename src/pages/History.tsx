import { useState } from "react";
import { useApp } from "../context/AppContext";
import { WorkoutTypeLabel } from "../components/WorkoutTypeLabel";
import { getWorkoutLabel } from "../lib/rotation";
import type { WorkoutType } from "../lib/types";
import { Dumbbell, Search, Trash2, X } from "lucide-react";

type FilterType = "all" | WorkoutType;

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upperA", label: "Upper A" },
  { value: "lowerA", label: "Lower A" },
  { value: "upperB", label: "Upper B" },
  { value: "lowerB", label: "Lower B" },
];

export function History() {
  const { state, dispatch } = useApp();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_SESSION", payload: id });
    setConfirmDeleteId(null);
  };

  const allSessions = [...state.sessions].reverse();
  const trimmed = searchQuery.trim().toLowerCase();
  const sessions = allSessions.filter((s) => {
    if (activeFilter !== "all" && s.workoutType !== activeFilter) return false;
    if (trimmed && !s.exercises.some((ex) => ex.name.toLowerCase().includes(trimmed))) return false;
    return true;
  });

  if (allSessions.length === 0) {
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
      <p className="text-zinc-400 text-sm mb-4">
        {state.sessions.length} workouts completed
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 no-scrollbar">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveFilter(opt.value)}
            className={`flex-shrink-0 text-sm px-3 py-1 rounded-full border transition-colors ${
              activeFilter === opt.value
                ? "bg-violet-600 border-violet-600 text-white"
                : "border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-zinc-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search exercises…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 rounded-lg pl-8 pr-8 py-2 outline-none focus:ring-1 focus:ring-violet-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {sessions.length === 0 && (
        <p className="text-zinc-500 text-sm text-center mt-12">No sessions match your filter.</p>
      )}

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
                {new Date(session.startedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {confirmDeleteId === session.id ? (
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 px-2 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(session.id)}
                  className="ml-2 text-zinc-600 hover:text-red-400 transition-colors"
                  aria-label="Delete session"
                >
                  <Trash2 size={15} />
                </button>
              )}
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
