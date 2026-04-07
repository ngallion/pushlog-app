import { useState, useEffect, useRef, useCallback } from "react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export { formatTime };

function fireRestCompleteAlert() {
  if (
    typeof Notification !== "undefined" &&
    Notification.permission === "granted"
  ) {
    new Notification("Rest time's up!", {
      body: "Time for your next set.",
      silent: false,
      tag: "rest-timer",
      requireInteraction: true,
    });
  }

  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 400]);
  }
}

export function useRestTimer(durationSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracks whether the timer just expired so we can fire alerts in an effect
  const justExpiredRef = useRef(false);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSecondsLeft(null);
  }, []);

  const start = useCallback(() => {
    if (durationSeconds <= 0) return;

    // Request notification permission on first use (non-blocking)
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }

    justExpiredRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(durationSeconds);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          justExpiredRef.current = true;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [durationSeconds]);

  // Fire notification + vibrate outside the setState updater so browser APIs
  // are called in a normal execution context, not inside React's batching.
  useEffect(() => {
    if (secondsLeft === null && justExpiredRef.current) {
      justExpiredRef.current = false;
      fireRestCompleteAlert();
    }
  }, [secondsLeft]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    secondsLeft,
    isRunning: secondsLeft !== null,
    start,
    stop,
    formatTime,
  };
}
