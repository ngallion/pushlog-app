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
    `flex items-center justify-center w-12 h-12 rounded-full transition-colors ${isActive ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`;

  return (
    <nav ref={navRef} className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pb-safe pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-full px-3 py-2 shadow-xl">
        <NavLink to="/" end className={navClass}>
          <Home size={22} />
        </NavLink>
        <NavLink to="/program" className={navClass}>
          <ClipboardList size={22} />
        </NavLink>
        <NavLink to="/history" className={navClass}>
          <History size={22} />
        </NavLink>
        <NavLink to="/settings" className={navClass}>
          <Settings size={22} />
        </NavLink>
      </div>
    </nav>
  );
}
