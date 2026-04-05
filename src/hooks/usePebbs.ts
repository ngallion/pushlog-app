import { useEffect, useState } from "react";
import type { WorkoutSession } from "../lib/types";

export type PebbsMood = "idle" | "watching" | "hype" | "celebrate" | "wither";

const WITHER_DAYS = 7;

function getLevel(finishedCount: number): number {
  if (finishedCount >= 16) return 2;
  if (finishedCount >= 6) return 1;
  return 0;
}

function isWithering(sessions: WorkoutSession[]): boolean {
  const finished = sessions.filter((s) => s.finishedAt);
  if (finished.length === 0) return false;
  const last = finished.at(-1)!;
  const daysSince =
    (Date.now() - new Date(last.finishedAt!).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= WITHER_DAYS;
}

export function usePebbs(sessions: WorkoutSession[]) {
  const finishedCount = sessions.filter((s) => s.finishedAt).length;
  const level = getLevel(finishedCount);
  const withering = isWithering(sessions);

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

  return { level, mood, withering, triggerHype, triggerCelebrate };
}
