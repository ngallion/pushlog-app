import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useNextWorkout } from "../hooks/useNextWorkout";
import { useLastSession } from "../hooks/useLastSession";
import { WorkoutTypeLabel } from "../components/WorkoutTypeLabel";
import { ExerciseCard } from "../components/ExerciseCard";
import { getWorkoutLabel, getDaySetLabel } from "../lib/rotation";
import type {
  ExerciseTemplate,
  LoggedExercise,
  WorkoutSession,
} from "../lib/types";
import { Dumbbell, CheckCircle, Plus, XCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { randomUUID } from "../lib/uuid";
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

function SortableExerciseCard({
  exercise,
  exerciseIndex,
  lastSession,
  onChange,
  onSwap,
  onWeightChange,
}: {
  exercise: LoggedExercise;
  exerciseIndex: number;
  lastSession: WorkoutSession | null;
  onChange: (i: number, sets: number, min: number, max: number) => void;
  onSwap: (i: number, name: string) => void;
  onWeightChange: (i: number, weight: number | undefined) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.templateId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <ExerciseCard
        exercise={exercise}
        exerciseIndex={exerciseIndex}
        lastSession={lastSession}
        onChange={onChange}
        onSwap={onSwap}
        onWeightChange={onWeightChange}
        dragHandleAttributes={attributes as unknown as Record<string, unknown>}
        dragHandleListeners={listeners as unknown as Record<string, unknown>}
      />
    </div>
  );
}

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

  const [addingExercise, setAddingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

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

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = session.exercises.findIndex(
        (e) => e.templateId === active.id,
      );
      const newIndex = session.exercises.findIndex(
        (e) => e.templateId === over.id,
      );
      dispatch({
        type: "REORDER_EXERCISES",
        payload: arrayMove(session.exercises, oldIndex, newIndex),
      });
    };

    const handleAddExercise = () => {
      if (!newExerciseName.trim()) return;
      dispatch({
        type: "ADD_EXERCISE",
        payload: {
          templateId: `impromptu-${randomUUID()}`,
          name: newExerciseName.trim(),
          setsCompleted: 0,
          targetSets: 3,
          minReps: 8,
          maxReps: 12,
        },
      });
      setNewExerciseName("");
      setAddingExercise(false);
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
          {new Date(session.startedAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <div className="text-xs text-zinc-500 mb-6">
          {completedExercises}/{totalExercises} exercises complete
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={session.exercises.map((e) => e.templateId)}
            strategy={verticalListSortingStrategy}
          >
            {session.exercises.map((exercise, ei) => (
              <SortableExerciseCard
                key={exercise.templateId}
                exercise={exercise}
                exerciseIndex={ei}
                lastSession={lastSessionForType}
                onChange={handleChange}
                onSwap={handleSwap}
                onWeightChange={handleWeightChange}
              />
            ))}
          </SortableContext>
        </DndContext>

        {addingExercise ? (
          <div className="flex gap-2 items-center mt-3">
            <input
              autoFocus
              type="text"
              placeholder="Exercise name"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddExercise();
                if (e.key === "Escape") {
                  setAddingExercise(false);
                  setNewExerciseName("");
                }
              }}
              className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <button
              onClick={handleAddExercise}
              className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded-lg text-sm"
            >
              Add
            </button>
            <button
              onClick={() => {
                setAddingExercise(false);
                setNewExerciseName("");
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingExercise(true)}
            className="w-full border border-dashed border-zinc-600 rounded-xl py-3 text-zinc-400 hover:text-zinc-300 hover:border-zinc-500 flex items-center justify-center gap-2 transition-colors mt-3"
          >
            <Plus size={16} /> Add Exercise
          </button>
        )}

        <button
          onClick={handleFinish}
          className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-4 font-bold text-lg flex items-center justify-center gap-2 transition-colors mt-3"
        >
          <CheckCircle size={22} />
          Finish Workout
        </button>

        {confirmCancel ? (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => dispatch({ type: "CANCEL_WORKOUT" })}
              className="flex-1 bg-red-700 hover:bg-red-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <XCircle size={18} />
              Discard Workout
            </button>
            <button
              onClick={() => setConfirmCancel(false)}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-xl py-3 font-semibold transition-colors"
            >
              Keep Going
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmCancel(true)}
            className="w-full text-zinc-500 hover:text-zinc-400 text-sm py-2 mt-1 transition-colors"
          >
            Cancel Workout
          </button>
        )}
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
