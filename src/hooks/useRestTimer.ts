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
  // Absolute timestamp when the timer should expire — used to stay accurate
  // even when the browser throttles background timers.
  const endTimeRef = useRef<number | null>(null);
  const justExpiredRef = useRef(false);

  const expire = useCallback(() => {
    // Guard against double-expiry (e.g. interval + visibilitychange racing)
    if (endTimeRef.current === null) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;
    justExpiredRef.current = true;
    setSecondsLeft(null);
  }, []);

  const recalculate = useCallback(() => {
    if (endTimeRef.current === null) return;
    const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
    if (remaining <= 0) {
      expire();
    } else {
      setSecondsLeft(remaining);
    }
  }, [expire]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;
    setSecondsLeft(null);
  }, []);

  const start = useCallback(() => {
    if (durationSeconds <= 0) return;

    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }

    justExpiredRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);

    endTimeRef.current = Date.now() + durationSeconds * 1000;
    setSecondsLeft(durationSeconds);

    // Poll at 500ms so we catch the boundary within half a second even when
    // the browser fires intervals slightly late in the foreground.
    intervalRef.current = setInterval(recalculate, 500);
  }, [durationSeconds, recalculate]);

  // When the app returns from background the interval may have been throttled
  // for a long time. Recalculate immediately on visibility restore so the
  // display jumps to the correct value (or fires the alert if already expired).
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        recalculate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [recalculate]);

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
