import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "./AppContext";
import { usePebbs } from "../hooks/usePebbs";
import { Pebbs } from "../components/Pebbs";
import type { PebbsMood } from "../hooks/usePebbs";

interface PebbsContextValue {
  mood: PebbsMood;
  triggerHype: () => void;
  triggerPumped: () => void;
  triggerStruggling: () => void;
  triggerCelebrate: () => void;
  triggerPR: () => void;
  triggerBored: () => void;
  triggerPet: () => void;
}

const PebbsContext = createContext<PebbsContextValue | null>(null);

export function usePebbsContext() {
  const ctx = useContext(PebbsContext);
  if (!ctx)
    throw new Error("usePebbsContext must be used within PebbsProvider");
  return ctx;
}

export function PebbsProvider({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const location = useLocation();
  const pebbs = usePebbs(state.sessions);

  const isToday = location.pathname === "/";
  const [rendered, setRendered] = useState(isToday);
  const [rolling, setRolling] = useState<"in" | "out" | null>(
    isToday ? "in" : null,
  );
  const prevIsToday = useRef(isToday);

  useEffect(() => {
    const was = prevIsToday.current;
    prevIsToday.current = isToday;

    if (isToday && !was) {
      // Navigated to Today — roll in
      setRendered(true);
      setRolling("in");
      const t = setTimeout(() => setRolling(null), 600);
      return () => clearTimeout(t);
    }

    if (!isToday && was) {
      // Navigated away from Today — roll out then unmount
      setRolling("out");
      const t = setTimeout(() => {
        setRendered(false);
        setRolling(null);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isToday]);

  // Initial roll-in on first mount
  useEffect(() => {
    if (isToday) {
      const t = setTimeout(() => setRolling(null), 600);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: PebbsContextValue = {
    mood: pebbs.mood,
    triggerHype: pebbs.triggerHype,
    triggerPumped: pebbs.triggerPumped,
    triggerStruggling: pebbs.triggerStruggling,
    triggerCelebrate: pebbs.triggerCelebrate,
    triggerPR: pebbs.triggerPR,
    triggerBored: pebbs.triggerBored,
    triggerPet: pebbs.triggerPet,
  };

  return (
    <PebbsContext.Provider value={value}>
      {children}
      {rendered && (
        <Pebbs
          level={pebbs.level}
          mood={pebbs.mood}
          witherLevel={pebbs.witherLevel}
          onTap={pebbs.triggerPet}
          rolling={rolling}
        />
      )}
    </PebbsContext.Provider>
  );
}
