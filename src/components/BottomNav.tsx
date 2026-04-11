import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { Home, ClipboardList, History, Settings } from "lucide-react";

const tabs = [
  { to: "/", label: "Today", icon: Home, end: true },
  { to: "/program", label: "Program", icon: ClipboardList, end: false },
  { to: "/history", label: "History", icon: History, end: false },
  { to: "/options", label: "Options", icon: Settings, end: false },
];

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

  return (
    <nav
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pb-safe pointer-events-none"
    >
      <div className="pointer-events-auto bg-opacity-95 flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-2 shadow-xl">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-2 rounded-full transition-colors ${
                isActive
                  ? "bg-zinc-700/70 text-white"
                  : "text-violet-400 hover:text-violet-300"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
                <span className="text-[10px] font-medium leading-none">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
