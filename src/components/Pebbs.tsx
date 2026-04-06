import type { PebbsMood } from "../hooks/usePebbs";

interface PebbsProps {
  level: number;
  mood: PebbsMood;
  witherLevel: number;
  onTap?: () => void;
}

function Eyes({ mood }: { mood: PebbsMood }) {
  const dot = (w: number, h: number, color: string, style?: React.CSSProperties) => (
    <div className="rounded-full" style={{ width: w, height: h, backgroundColor: color, ...style }} />
  );
  const char = (ch: string, color: string, size = 9) => (
    <span className="font-black leading-none select-none" style={{ color, fontSize: size }} >{ch}</span>
  );

  switch (mood) {
    case "pumped":
      // O_O — large wide open circles
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {dot(10, 10, "#3d3b39")}
          {dot(10, 10, "#3d3b39")}
        </div>
      );
    case "hype":
      // ^ ^ excited
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {char("^", "#3d3b39")}
          {char("^", "#3d3b39")}
        </div>
      );
    case "struggling":
      // worried inward-tilted eyes
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {dot(7, 5, "#3d3b39", { transform: "rotate(15deg) translateY(-1px)" })}
          {dot(7, 5, "#3d3b39", { transform: "rotate(-15deg) translateY(-1px)" })}
        </div>
      );
    case "celebrate":
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {char("★", "#92701a")}
          {char("★", "#92701a")}
        </div>
      );
    case "pr":
      // ✦ gold diamond — distinct from celebrate
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {char("✦", "#b8860b", 10)}
          {char("✦", "#b8860b", 10)}
        </div>
      );
    case "streak":
      // warm orange fire eyes
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {dot(8, 8, "#c45e00")}
          {dot(8, 8, "#c45e00")}
        </div>
      );
    case "comeback":
      // relieved wide eyes in warm green
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {dot(9, 9, "#2d7a4f")}
          {dot(9, 9, "#2d7a4f")}
        </div>
      );
    case "sleepy":
      // thin horizontal lines — very drowsy
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {dot(10, 2, "#3d3b39")}
          {dot(10, 2, "#3d3b39")}
        </div>
      );
    case "excited":
      // ✸ sparkle eyes in violet
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {char("✸", "#7c3aed", 10)}
          {char("✸", "#7c3aed", 10)}
        </div>
      );
    case "bored":
      // tiny sideways dots — looking away
      return (
        <div className="flex gap-[8px] items-center justify-center">
          {dot(4, 4, "#3d3b39", { marginLeft: 3 })}
          {dot(4, 4, "#3d3b39", { marginLeft: 3 })}
        </div>
      );
    case "zoomies":
      // @ spiral eyes
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {char("@", "#3d3b39")}
          {char("@", "#3d3b39")}
        </div>
      );
    case "shy":
      // v downward-looking eyes
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {char("v", "#3d3b39", 8)}
          {char("v", "#3d3b39", 8)}
        </div>
      );
    case "wither":
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {dot(6, 2, "#5a5755", { transform: "rotate(20deg) translateY(1px)" })}
          {dot(6, 2, "#5a5755", { transform: "rotate(-20deg) translateY(1px)" })}
        </div>
      );
    case "watching":
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {dot(7, 7, "#3d3b39")}
          {dot(7, 7, "#3d3b39")}
        </div>
      );
    default: // idle
      return (
        <div className="flex gap-[5px] items-center justify-center">
          {dot(7, 4, "#3d3b39")}
          {dot(7, 4, "#3d3b39")}
        </div>
      );
  }
}

interface PebbleStyle {
  bg: string;
  shadow: string;
  borderRadius: string;
  w: number;
  h: number;
}

// Each array is ordered top (head) to bottom (base)
const PEBBLE_STYLES: PebbleStyle[][] = [
  [
    { bg: "#9e9891", shadow: "#706d69", borderRadius: "55% 45% 48% 52% / 50% 52% 48% 50%", w: 44, h: 36 },
  ],
  [
    { bg: "#a09b95", shadow: "#706d69", borderRadius: "55% 45% 48% 52% / 50% 54% 46% 50%", w: 38, h: 30 },
    { bg: "#8a8580", shadow: "#605d59", borderRadius: "48% 52% 55% 45% / 52% 48% 50% 50%", w: 50, h: 40 },
  ],
  [
    { bg: "#a8a39d", shadow: "#706d69", borderRadius: "55% 45% 50% 50% / 48% 54% 46% 52%", w: 34, h: 27 },
    { bg: "#8a8580", shadow: "#605d59", borderRadius: "50% 50% 54% 46% / 52% 48% 50% 50%", w: 44, h: 35 },
    { bg: "#7c7873", shadow: "#565350", borderRadius: "46% 54% 48% 52% / 50% 52% 48% 50%", w: 54, h: 43 },
  ],
];

const WITHER_BG = "#6b6865";
const WITHER_SHADOW = "#4a4846";

function getAnimationClass(mood: PebbsMood): string {
  switch (mood) {
    case "idle":       return "animate-pebbs-float";
    case "watching":   return "";
    case "hype":       return "animate-pebbs-bounce";
    case "pumped":     return "animate-pebbs-pumped";
    case "struggling": return "animate-pebbs-struggling";
    case "celebrate":  return "animate-pebbs-celebrate";
    case "pr":         return "animate-pebbs-pr";
    case "streak":     return "animate-pebbs-streak";
    case "comeback":   return "animate-pebbs-comeback";
    case "sleepy":     return "animate-pebbs-sleepy";
    case "excited":    return "animate-pebbs-excited";
    case "bored":      return "animate-pebbs-bored";
    case "zoomies":    return "animate-pebbs-zoomies";
    case "shy":        return "animate-pebbs-shy";
    case "wither":     return "animate-pebbs-wither";
  }
}

export function Pebbs({ level, mood, witherLevel, onTap }: PebbsProps) {
  const pebbles = PEBBLE_STYLES[level] ?? PEBBLE_STYLES[0];
  const animClass = getAnimationClass(mood);
  const withering = witherLevel > 0;

  return (
    <div
      className="fixed z-30 group"
      style={{
        right: "1rem",
        bottom: "calc(5.5rem + env(safe-area-inset-bottom))",
      }}
    >
      {/* Name tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-zinc-800 border border-zinc-700 rounded-full px-2.5 py-0.5 text-xs text-zinc-400 whitespace-nowrap">
          Pebbs
        </div>
      </div>

      <div
        className={`flex flex-col items-center cursor-pointer ${animClass}`}
        onClick={onTap}
      >
        {pebbles.map((pebble, i) => (
          <div
            key={i}
            style={{
              width: `${pebble.w}px`,
              height: `${pebble.h}px`,
              backgroundColor: withering ? WITHER_BG : pebble.bg,
              borderRadius: pebble.borderRadius,
              boxShadow: `inset -3px -4px 0 0 ${withering ? WITHER_SHADOW : pebble.shadow}`,
              marginTop: i > 0 ? "-6px" : 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: pebbles.length - i,
            }}
          >
            {i === 0 && <Eyes mood={mood} />}
          </div>
        ))}
      </div>
    </div>
  );
}
