import { useState, useRef } from "react";
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
  Trophy,
  X,
} from "lucide-react";

type FilterType = "all" | WorkoutType;
type View = "sessions" | "records";

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

// Returns a YYYY-MM-DD string in local time
function toLocalDateStr(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const HEATMAP_WEEKS = 16;

function buildHeatmapGrid(): string[] {
  // Align to the most recent Sunday, then go back HEATMAP_WEEKS weeks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0=Sun
  const gridEnd = new Date(today);
  gridEnd.setDate(today.getDate() + (6 - dayOfWeek)); // end of current week (Sat)
  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridEnd.getDate() - HEATMAP_WEEKS * 7 + 1);

  const days: string[] = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    days.push(
      `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`,
    );
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function heatmapColor(sets: number, isHighlighted: boolean): string {
  if (isHighlighted) return "bg-yellow-400";
  if (sets === 0) return "bg-zinc-800";
  if (sets < 8) return "bg-violet-900";
  if (sets < 16) return "bg-violet-700";
  if (sets < 24) return "bg-violet-500";
  return "bg-violet-400";
}

export function History() {
  const { state, dispatch } = useApp();
  const [view, setView] = useState<View>("sessions");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);
  const sessionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  // Compute all-time PR per exercise name: max weight and the date it was set
  const records = (() => {
    const map = new Map<string, { weight: number; date: string }>();
    for (const session of state.sessions) {
      const date = session.startedAt;
      for (const ex of session.exercises) {
        if (ex.startingWeight == null) continue;
        const prev = map.get(ex.name);
        if (!prev || ex.startingWeight > prev.weight) {
          map.set(ex.name, { weight: ex.startingWeight, date });
        }
      }
    }
    return [...map.entries()]
      .map(([name, { weight, date }]) => ({ name, weight, date }))
      .sort((a, b) => b.weight - a.weight);
  })();

  // Build sets-per-day map for heatmap
  const setsPerDay = new Map<string, number>();
  for (const session of state.sessions) {
    const day = toLocalDateStr(session.startedAt);
    const sets = session.exercises.reduce((s, ex) => s + ex.setsCompleted, 0);
    setsPerDay.set(day, (setsPerDay.get(day) ?? 0) + sets);
  }

  // Map date → session id (latest session that day, for scroll targeting)
  const sessionByDay = new Map<string, string>();
  for (const session of [...state.sessions].reverse()) {
    const day = toLocalDateStr(session.startedAt);
    sessionByDay.set(day, session.id);
  }

  const heatmapDays = buildHeatmapGrid();

  const handleCellClick = (day: string) => {
    const sessionId = sessionByDay.get(day);
    if (!sessionId) return;

    setView("sessions");
    setActiveFilter("all");
    setSearchQuery("");
    setHighlightedDate(day);

    // Expand the session and scroll to it after state settles
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(sessionId);
      return next;
    });

    setTimeout(() => {
      sessionRefs.current[sessionId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setTimeout(() => setHighlightedDate(null), 2000);
    }, 50);
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

  // Month labels for heatmap x-axis: one label per column where month changes
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  heatmapDays.forEach((day, i) => {
    const col = Math.floor(i / 7);
    const month = new Date(day + "T00:00:00").getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        col,
        label: new Date(day + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
        }),
      });
      lastMonth = month;
    }
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

      {/* Heatmap */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 pt-3 pb-4 mb-4 overflow-x-auto no-scrollbar">
        {/* Month labels */}
        <div
          className="grid mb-1"
          style={{
            gridTemplateColumns: `repeat(${HEATMAP_WEEKS}, minmax(0, 1fr))`,
            columnGap: 3,
          }}
        >
          {Array.from({ length: HEATMAP_WEEKS }, (_, col) => {
            const label = monthLabels.find((m) => m.col === col);
            return (
              <div
                key={col}
                className="text-zinc-600 text-center"
                style={{ fontSize: 9 }}
              >
                {label?.label ?? ""}
              </div>
            );
          })}
        </div>
        {/* Day cells: 7 rows × HEATMAP_WEEKS cols */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${HEATMAP_WEEKS}, minmax(0, 1fr))`,
            gridTemplateRows: "repeat(7, minmax(0, 1fr))",
            gridAutoFlow: "column",
            gap: 3,
          }}
        >
          {heatmapDays.map((day) => {
            const sets = setsPerDay.get(day) ?? 0;
            const hasSession = sessionByDay.has(day);
            const isHighlighted = highlightedDate === day;
            return (
              <button
                key={day}
                onClick={() => handleCellClick(day)}
                disabled={!hasSession}
                title={sets > 0 ? `${day}: ${sets} sets` : day}
                className={`rounded-sm aspect-square transition-opacity ${heatmapColor(sets, isHighlighted)} ${hasSession ? "cursor-pointer hover:opacity-75" : "cursor-default"}`}
                style={{ minWidth: 10, minHeight: 10 }}
              />
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-zinc-600" style={{ fontSize: 9 }}>
            Less
          </span>
          {[
            "bg-zinc-800",
            "bg-violet-900",
            "bg-violet-700",
            "bg-violet-500",
            "bg-violet-400",
          ].map((cls) => (
            <div
              key={cls}
              className={`rounded-sm ${cls}`}
              style={{ width: 10, height: 10 }}
            />
          ))}
          <span className="text-zinc-600" style={{ fontSize: 9 }}>
            More
          </span>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex bg-zinc-800 rounded-xl p-1 mb-4">
        <button
          onClick={() => setView("sessions")}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            view === "sessions"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Sessions
        </button>
        <button
          onClick={() => setView("records")}
          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            view === "records"
              ? "bg-zinc-700 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Records
        </button>
      </div>

      {view === "records" ? (
        records.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center mt-12">
            No weight data yet. Log weights during workouts to track PRs.
          </p>
        ) : (
          <>
            <div className="relative mb-4">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search records…"
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
            <div className="space-y-2">
              {records
                .filter(
                  (r) => !trimmed || r.name.toLowerCase().includes(trimmed),
                )
                .map(({ name, weight, date }) => (
                  <div
                    key={name}
                    className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Trophy size={14} className="text-violet-400 shrink-0" />
                      <span className="text-sm text-zinc-200 truncate">
                        {name}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 shrink-0 ml-3">
                      <span className="text-sm font-bold tabular-nums text-zinc-100">
                        {weight} lbs
                      </span>
                      <span className="text-xs text-zinc-500">
                        {new Date(date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )
      ) : (
        <>
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
              const durationMins = session.finishedAt
                ? Math.round(
                    (new Date(session.finishedAt).getTime() -
                      new Date(session.startedAt).getTime()) /
                      60000,
                  )
                : null;
              const accentClass = ACCENT_MAP[session.workoutType];
              const sessionDay = toLocalDateStr(session.startedAt);
              const isHighlightedSession = highlightedDate === sessionDay;
              return (
                <div
                  key={session.id}
                  ref={(el) => {
                    sessionRefs.current[session.id] = el;
                  }}
                  className={`border border-l-2 ${accentClass} rounded-2xl overflow-hidden transition-colors duration-500 ${
                    isHighlightedSession
                      ? "bg-zinc-700 border-zinc-600"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
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
                          {session.exercises.length} exercises · {totalSets}{" "}
                          sets
                          {durationMins !== null && ` · ${durationMins} min`}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(session.startedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
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
                          <div
                            key={ei}
                            className="flex flex-col gap-0.5 text-sm"
                          >
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
        </>
      )}
    </div>
  );
}
