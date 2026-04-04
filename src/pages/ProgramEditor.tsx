import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useApp } from "../context/AppContext";
import { WorkoutTypeLabel } from "../components/WorkoutTypeLabel";
import type {
  WorkoutType,
  Cycle,
  ExerciseTemplate,
  ProgramBlock,
} from "../lib/types";
import { getWorkoutLabel, getCycleLabel } from "../lib/rotation";
import { randomUUID } from "../lib/uuid";
import { Plus, Trash2, Save, GripVertical, Info, X } from "lucide-react";

const WORKOUT_TYPES: WorkoutType[] = ["upperA", "upperB", "lowerA", "lowerB"];
const CYCLES: Cycle[] = ["cycle1", "cycle2"];

type WorkoutsState = Record<Cycle, Record<WorkoutType, ExerciseTemplate[]>>;

interface SortableExerciseCardProps {
  ex: ExerciseTemplate;
  idx: number;
  onUpdate: (
    idx: number,
    field: keyof ExerciseTemplate,
    value: string | number,
  ) => void;
  onDelete: (idx: number) => void;
}

function SortableExerciseCard({
  ex,
  idx,
  onUpdate,
  onDelete,
}: SortableExerciseCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ex.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-zinc-800 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="text-zinc-500 hover:text-zinc-300 touch-none p-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
        <input
          type="text"
          placeholder="Exercise name"
          value={ex.name}
          onChange={(e) => onUpdate(idx, "name", e.target.value)}
          className="flex-1 bg-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <button
          onClick={() => onDelete(idx)}
          className="text-red-400 hover:text-red-300 p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-2 pl-7">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-zinc-400">Sets</label>
          <input
            type="number"
            value={ex.sets}
            onChange={(e) => onUpdate(idx, "sets", Number(e.target.value))}
            className="w-14 bg-zinc-700 rounded px-2 py-1 text-sm text-center text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-zinc-400">Reps</label>
          <div className="flex items-center bg-zinc-700 rounded overflow-hidden focus-within:ring-1 focus-within:ring-violet-500">
            <input
              type="number"
              value={ex.minReps}
              onChange={(e) => onUpdate(idx, "minReps", Number(e.target.value))}
              className="w-10 bg-transparent px-1.5 py-1 text-sm text-center text-zinc-100 focus:outline-none"
            />
            <span className="text-zinc-400 text-sm select-none shrink-0">
              –
            </span>
            <input
              type="number"
              value={ex.maxReps}
              onChange={(e) => onUpdate(idx, "maxReps", Number(e.target.value))}
              className="w-10 bg-transparent px-1.5 py-1 text-sm text-center text-zinc-100 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-zinc-400">Start wt.</label>
          <input
            type="number"
            placeholder="—"
            value={ex.startingWeight ?? ""}
            onChange={(e) =>
              onUpdate(
                idx,
                "startingWeight",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            className="w-16 bg-zinc-700 rounded px-2 py-1 text-sm text-center text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>
    </div>
  );
}

export function ProgramEditor() {
  const { state, dispatch } = useApp();
  const currentProgram = state.programs[state.programs.length - 1];

  const [workouts, setWorkouts] = useState<WorkoutsState>(
    currentProgram?.workouts ?? {
      cycle1: { upperA: [], upperB: [], lowerA: [], lowerB: [] },
      cycle2: { upperA: [], upperB: [], lowerA: [], lowerB: [] },
    },
  );
  const [activeCycle, setActiveCycle] = useState<Cycle>("cycle1");
  const [activeTab, setActiveTab] = useState<WorkoutType>("upperA");
  const [saved, setSaved] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const updateExercise = (
    idx: number,
    field: keyof ExerciseTemplate,
    value: string | number,
  ) => {
    setWorkouts((prev) => ({
      ...prev,
      [activeCycle]: {
        ...prev[activeCycle],
        [activeTab]: prev[activeCycle][activeTab].map((ex, i) =>
          i === idx ? { ...ex, [field]: value } : ex,
        ),
      },
    }));
  };

  const addExercise = () => {
    const newEx: ExerciseTemplate = {
      id: randomUUID(),
      name: "",
      sets: 3,
      minReps: 8,
      maxReps: 10,
    };
    setWorkouts((prev) => ({
      ...prev,
      [activeCycle]: {
        ...prev[activeCycle],
        [activeTab]: [...prev[activeCycle][activeTab], newEx],
      },
    }));
  };

  const deleteExercise = (idx: number) => {
    setWorkouts((prev) => ({
      ...prev,
      [activeCycle]: {
        ...prev[activeCycle],
        [activeTab]: prev[activeCycle][activeTab].filter((_, i) => i !== idx),
      },
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWorkouts((prev) => {
      const items = prev[activeCycle][activeTab];
      const oldIndex = items.findIndex((ex) => ex.id === active.id);
      const newIndex = items.findIndex((ex) => ex.id === over.id);
      return {
        ...prev,
        [activeCycle]: {
          ...prev[activeCycle],
          [activeTab]: arrayMove(items, oldIndex, newIndex),
        },
      };
    });
  };

  const handleSave = () => {
    const program: ProgramBlock = currentProgram
      ? { ...currentProgram, workouts }
      : { id: randomUUID(), startedAt: new Date().toISOString(), workouts };
    dispatch({ type: "SAVE_PROGRAM", payload: program });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exercises = workouts[activeCycle][activeTab];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-bold">Program Editor</h1>
        <button
          onClick={() => setShowInfo(true)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors mt-0.5"
          aria-label="How the rotation works"
        >
          <Info size={18} />
        </button>
      </div>
      <p className="text-zinc-400 text-sm mb-5">Edit your training program</p>

      {showInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-zinc-100">How the rotation works</h2>
              <button
                onClick={() => setShowInfo(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm text-zinc-300">
              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-wide font-medium mb-2">Workout sequence</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["upperA", "lowerA", "upperB", "lowerB"] as WorkoutType[]).map((t, i, arr) => (
                    <span key={t} className="flex items-center gap-1.5">
                      <span className="bg-zinc-800 rounded px-2 py-0.5 text-zinc-200 font-medium">{getWorkoutLabel(t)}</span>
                      {i < arr.length - 1 && <span className="text-zinc-600">→</span>}
                    </span>
                  ))}
                  <span className="text-zinc-600">→ repeat</span>
                </div>
                <p className="mt-2 text-zinc-400">Every workout cycles through these four types in order.</p>
              </div>

              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-wide font-medium mb-2">Cycles</p>
                <p>Each workout type has two exercise lists — <span className="text-zinc-200 font-medium">Cycle 1</span> and <span className="text-zinc-200 font-medium">Cycle 2</span>. After every 8 workouts (two full cycles), the active cycle flips, giving you natural variation without changing the structure.</p>
              </div>

              <div>
                <p className="text-zinc-400 text-xs uppercase tracking-wide font-medium mb-2">Program blocks</p>
                <p>After 8 workouts you'll be prompted to start a new block. <span className="text-zinc-200 font-medium">Start New Block</span> copies your current program as the new baseline so you can tweak weights and exercises each cycle.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day selector */}
      <div className="flex gap-2 mb-4">
        {CYCLES.map((day) => (
          <button
            key={day}
            onClick={() => setActiveCycle(day)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeCycle === day
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {getCycleLabel(day)}
          </button>
        ))}
      </div>

      {/* Workout type tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {WORKOUT_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === type
                ? "bg-zinc-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {getWorkoutLabel(type)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <WorkoutTypeLabel type={activeTab} cycle={activeCycle} />
        <span className="font-semibold">{getWorkoutLabel(activeTab)}</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={exercises.map((ex) => ex.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 mb-5">
            {exercises.map((ex, idx) => (
              <SortableExerciseCard
                key={ex.id}
                ex={ex}
                idx={idx}
                onUpdate={updateExercise}
                onDelete={deleteExercise}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={addExercise}
        className="w-full border border-dashed border-zinc-600 rounded-xl py-3 text-zinc-400 hover:text-zinc-300 hover:border-zinc-500 flex items-center justify-center gap-2 transition-colors mb-6"
      >
        <Plus size={16} /> Add Exercise
      </button>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Save size={18} />
          {saved ? "Saved!" : "Save Program"}
        </button>
      </div>
    </div>
  );
}
