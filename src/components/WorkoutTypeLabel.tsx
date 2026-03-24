import type { WorkoutType, DaySet } from "../lib/types";
import { getWorkoutLabel, getDaySetLabel } from "../lib/rotation";

interface Props {
  type: WorkoutType;
  daySet: DaySet;
  className?: string;
}

export function WorkoutTypeLabel({ type, daySet, className = "" }: Props) {
  const colorMap: Record<WorkoutType, string> = {
    upperA: "bg-violet-700 text-violet-100",
    upperB: "bg-purple-700 text-purple-100",
    lowerA: "bg-blue-700 text-blue-100",
    lowerB: "bg-indigo-700 text-indigo-100",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${colorMap[type]} ${className}`}
    >
      {getWorkoutLabel(type)}
      <span className="opacity-70">·</span>
      {getDaySetLabel(daySet)}
    </span>
  );
}
