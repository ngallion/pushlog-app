import { useEffect, useState } from "react";
import type { WorkoutSession } from "../lib/types";

export type PebbsMood = "idle" | "watching" | "hype" | "celebrate" | "wither";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getLevel(finishedCount: number): number {
  if (finishedCount >= 30) return 3;
  if (finishedCount >= 16) return 2;
  if (finishedCount >= 6) return 1;
  return 0;
}

function getWitherLevel(sessions: WorkoutSession[]): number {
  const finished = sessions.filter((s) => s.finishedAt);
  if (finished.length === 0) return 0;

  const finishedCount = finished.length;
  const now = Date.now();
  const earliest = Math.min(
    ...finished.map((s) => new Date(s.finishedAt!).getTime()),
  );

  // Count rolling 7-day windows from earliest session to now with no workouts
  let zeroWeekCount = 0;
  let windowEnd = now;
  while (windowEnd > earliest) {
    const windowStart = windowEnd - WEEK_MS;
    const hasWorkout = finished.some((s) => {
      const t = new Date(s.finishedAt!).getTime();
      return t >= windowStart && t < windowEnd;
    });
    if (!hasWorkout) zeroWeekCount++;
    windowEnd = windowStart;
  }

  // Every 4 workouts clears 1 wither level
  return Math.max(0, zeroWeekCount - Math.floor(finishedCount / 4));
}

export function usePebbs(sessions: WorkoutSession[]) {
  const finished = sessions.filter((s) => s.finishedAt);
  const finishedCount = finished.length;

  const baseLevel = getLevel(finishedCount);
  const witherLevel = getWitherLevel(sessions);
  const level = Math.max(0, baseLevel - witherLevel);
  const withering = witherLevel > 0;

  const [mood, setMood] = useState<PebbsMood>(
    withering ? "wither" : "watching",
  );

  useEffect(() => {
    if (withering) {
      setMood("wither");
      return;
    }
    setMood("watching");
    const t = setTimeout(() => setMood("idle"), 2000);
    return () => clearTimeout(t);
  }, [withering]);

  const triggerHype = () => {
    if (withering) return;
    setMood("hype");
    setTimeout(() => setMood("idle"), 700);
  };

  const triggerCelebrate = () => {
    setMood("celebrate");
    setTimeout(() => setMood("idle"), 3000);
  };

  return { level, witherLevel, mood, withering, triggerHype, triggerCelebrate };
}
