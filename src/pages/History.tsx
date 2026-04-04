import { useState } from "react";
import { useApp } from "../context/AppContext";
import { WorkoutTypeLabel } from "../components/WorkoutTypeLabel";
import { getWorkoutLabel } from "../lib/rotation";
import type { WorkoutType } from "../lib/types";
import {
  ChevronDown,
  ChevronRight,
  Dumbbell,
  Search,
  Trash2,
  X,
} from "lucide-react";

type FilterType = "all" | WorkoutType;

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upperA", label: "Upper A" },
  { value: "lowerA", label: "Lower A" },
  { value: "upperB", label: "Upper B" },
  { value: "lowerB", label: "Lower B" },
];

const ACCENT_MAP: Record<WorkoutType, string> = {
  upperA: "border-l-violet-500",
  upperB: "border-l-purple-500",
  lowerA: "border-l-blue-500",
  lowerB: "border-l-indigo-500",
};

export function History() {
  const { state, dispatch } = useApp();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_SESSION", payload: id });
    setConfirmDeleteId(null);
  };

  const allSessions = [...state.sessions].reverse();
  const trimmed = searchQuery.trim().toLowerCase();
  const sessions = allSessions.filter((s) => {
    if (activeFilter !== "all" && s.workoutType !== activeFilter) return false;
    return !(
      trimmed &&
      !s.exercises.some((ex) => ex.name.toLowerCase().includes(trimmed))
    );
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
      <p className="text-zinc-500 text-sm mb-4">
        {state.sessions.length} workout{state.sessions.length !== 1 ? "s" : ""}{" "}
        completed
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 no-scrollbar">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveFilter(opt.value)}
            className={`flex-shrink-0 text-sm px-3 py-1 rounded-full border transition-colors ${
              activeFilter === opt.value
                ? "bg-violet-600 border-violet-600 text-white"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="relative mb-5">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search exercises…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 rounded-xl pl-8 pr-8 py-2.5 outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
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
        <p className="text-zinc-500 text-sm text-center mt-12">
          No sessions match your filter.
        </p>
      )}

      <div className="space-y-3">
        {sessions.map((session) => {
          const totalSets = session.exercises.reduce(
            (sum, ex) => sum + ex.setsCompleted,
            0,
          );
          const accentClass = ACCENT_MAP[session.workoutType];
          return (
            <div
              key={session.id}
              className={`bg-zinc-900 border border-zinc-800 border-l-2 ${accentClass} rounded-2xl overflow-hidden`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between px-4 pt-4 pb-3">
                <div className="flex flex-col gap-1.5">
                  <WorkoutTypeLabel
                    type={session.workoutType}
                    cycle={session.cycle}
                  />
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-zinc-100">
                      {getWorkoutLabel(session.workoutType)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {session.exercises.length} exercises · {totalSets} sets
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-zinc-500 whitespace-nowrap">
                    {new Date(session.startedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {confirmDeleteId === session.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(session.id)}
                      className="text-zinc-700 hover:text-red-400 transition-colors"
                      aria-label="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible toggle */}
              <button
                onClick={() => toggleExpanded(session.id)}
                className="w-full flex items-center gap-1 px-4 py-2 border-t border-zinc-800 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {expandedIds.has(session.id) ? (
                  <ChevronDown size={13} />
                ) : (
                  <ChevronRight size={13} />
                )}
                Exercises
              </button>

              {/* Exercise list */}
              {expandedIds.has(session.id) && (
                <div className="px-4 pb-3 space-y-2">
                  {session.exercises.map((ex, ei) => {
                    const partial = ex.setsCompleted < ex.targetSets;
                    return (
                      <div key={ei} className="flex flex-col gap-0.5 text-sm">
                        <span
                          className={
                            partial ? "text-zinc-400" : "text-zinc-200"
                          }
                        >
                          {ex.name}
                        </span>
                        <span
                          className={`tabular-nums text-xs ${partial ? "text-amber-500/80" : "text-zinc-500"}`}
                        >
                          {partial
                            ? `${ex.setsCompleted}/${ex.targetSets} sets · ${ex.minReps}–${ex.maxReps} reps`
                            : `${ex.targetSets} sets · ${ex.minReps}–${ex.maxReps} reps`}
                          {ex.startingWeight != null &&
                            ` · ${ex.startingWeight} lbs`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
