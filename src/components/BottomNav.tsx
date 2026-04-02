import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { Home, ClipboardList, History, Settings } from "lucide-react";

export function BottomNav() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function update() {
      const nav = navRef.current;
      if (!nav) return;
      const scale = vv!.scale;
      nav.style.transform = `scale(${1 / scale})`;
      nav.style.transformOrigin = "bottom left";
      nav.style.left = `${vv!.offsetLeft}px`;
      nav.style.right = "auto";
      nav.style.width = `${vv!.width * scale}px`;
    }

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 text-xs transition-colors ${isActive ? "text-violet-400" : "text-zinc-500 hover:text-zinc-300"}`;

  return (
    <nav ref={navRef} className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-700 z-50 pb-safe">
      <div className="max-w-lg mx-auto flex justify-around py-2">
        <NavLink to="/" end className={navClass}>
          <Home size={20} />
          <span>Today</span>
        </NavLink>
        <NavLink to="/program" className={navClass}>
          <ClipboardList size={20} />
          <span>Program</span>
        </NavLink>
        <NavLink to="/history" className={navClass}>
          <History size={20} />
          <span>History</span>
        </NavLink>
        <NavLink to="/settings" className={navClass}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </div>
    </nav>
  );
}
