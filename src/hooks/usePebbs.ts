import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkoutSession } from "../lib/types";

export type PebbsMood =
  | "idle"
  | "watching"
  | "hype"
  | "pumped"
  | "struggling"
  | "celebrate"
  | "pr"
  | "comeback"
  | "streak"
  | "excited"
  | "sleepy"
  | "bored"
  | "zoomies"
  | "shy"
  | "wither";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const AMBIENT_MOODS = new Set<PebbsMood>(["idle", "sleepy", "streak", "excited", "wither"]);

function getLevel(finishedCount: number): number {
  if (finishedCount >= 16) return 2;
  if (finishedCount >= 6) return 1;
  return 0;
}

function getWitherLevel(sessions: WorkoutSession[]): number {
  const finished = sessions.filter((s) => s.finishedAt);
  if (finished.length === 0) return 0;
  const finishedCount = finished.length;
  const now = Date.now();
  const earliest = Math.min(...finished.map((s) => new Date(s.finishedAt!).getTime()));
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
  return Math.max(0, zeroWeekCount - Math.floor(finishedCount / 4));
}

function computeAmbientMood(sessions: WorkoutSession[], withering: boolean): PebbsMood {
  if (withering) return "wither";

  const hour = new Date().getHours();
  if (hour >= 22 || hour < 5) return "sleepy";

  const finished = sessions.filter((s) => s.finishedAt);
  const weekAgo = Date.now() - WEEK_MS;
  const recentCount = finished.filter(
    (s) => new Date(s.finishedAt!).getTime() > weekAgo,
  ).length;
  if (recentCount >= 3) return "streak";

  const last = finished.at(-1);
  if (last) {
    const daysSince =
      (Date.now() - new Date(last.finishedAt!).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= 2 && daysSince < 7) return "excited";
  }

  return "idle";
}

export function usePebbs(sessions: WorkoutSession[]) {
  const finished = sessions.filter((s) => s.finishedAt);
  const finishedCount = finished.length;
  const witherLevel = getWitherLevel(sessions);
  const baseLevel = getLevel(finishedCount);
  const level = Math.max(0, baseLevel - witherLevel);
  const withering = witherLevel > 0;

  const ambientRef = useRef<PebbsMood>(computeAmbientMood(sessions, withering));
  ambientRef.current = computeAmbientMood(sessions, withering);

  const prevWitheringRef = useRef(withering);
  const inTransientRef = useRef(false);
  const needsComebackRef = useRef(false);

  const [mood, setMood] = useState<PebbsMood>(withering ? "wither" : "watching");

  // Run a transient mood then return to ambient (or comeback if queued)
  const transient = useCallback((newMood: PebbsMood, duration: number) => {
    inTransientRef.current = true;
    setMood(newMood);
    setTimeout(() => {
      inTransientRef.current = false;
      if (needsComebackRef.current) {
        needsComebackRef.current = false;
        setMood("comeback");
        setTimeout(() => setMood(ambientRef.current), 2000);
      } else {
        setMood(ambientRef.current);
      }
    }, duration);
  }, []);

  // On mount: watching → ambient after 2s
  useEffect(() => {
    if (withering) return;
    const t = setTimeout(() => setMood(ambientRef.current), 2000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Wither change detection + ambient updates when sessions change
  useEffect(() => {
    const was = prevWitheringRef.current;
    prevWitheringRef.current = withering;

    if (withering) {
      setMood("wither");
      return;
    }

    if (was && !withering) {
      // Wither just cleared — queue comeback after any in-progress transient
      if (inTransientRef.current) {
        needsComebackRef.current = true;
      } else {
        setMood("comeback");
        setTimeout(() => setMood(ambientRef.current), 2000);
      }
      return;
    }

    // Ambient may have changed (e.g., streak just achieved after a workout)
    setMood((prev) => (AMBIENT_MOODS.has(prev) ? ambientRef.current : prev));
  }, [withering, finishedCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic ambient refresh for time-based changes (sleepy kicks in at 10pm)
  useEffect(() => {
    const id = setInterval(() => {
      setMood((prev) => (AMBIENT_MOODS.has(prev) ? ambientRef.current : prev));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Zoomies: random occurrence every ~4 minutes when in an ambient state
  useEffect(() => {
    const id = setInterval(() => {
      if (inTransientRef.current) return;
      setMood((prev) => {
        if (!AMBIENT_MOODS.has(prev) || prev === "wither") return prev;
        setTimeout(() => {
          if (!inTransientRef.current) setMood(ambientRef.current);
        }, 1500);
        return "zoomies";
      });
    }, 4 * 60_000);
    return () => clearInterval(id);
  }, []);

  const triggerHype = useCallback(() => {
    if (!withering) transient("hype", 700);
  }, [withering, transient]);

  const triggerPumped = useCallback(() => {
    if (!withering) transient("pumped", 1200);
  }, [withering, transient]);

  const triggerStruggling = useCallback(() => {
    if (!withering) transient("struggling", 1500);
  }, [withering, transient]);

  const triggerCelebrate = useCallback(() => {
    transient("celebrate", 3000);
  }, [transient]);

  const triggerPR = useCallback(() => {
    transient("pr", 3500);
  }, [transient]);

  const triggerBored = useCallback(() => {
    if (!inTransientRef.current) setMood("bored");
  }, []);

  const triggerShy = useCallback(() => {
    transient("shy", 1500);
  }, [transient]);

  return {
    level,
    witherLevel,
    mood,
    withering,
    triggerHype,
    triggerPumped,
    triggerStruggling,
    triggerCelebrate,
    triggerPR,
    triggerBored,
    triggerShy,
  };
}
