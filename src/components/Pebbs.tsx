import type { PebbsMood } from "../hooks/usePebbs";

interface PebbsProps {
  level: number;
  mood: PebbsMood;
  withering: boolean;
}

function Eyes({ mood }: { mood: PebbsMood }) {
  if (mood === "hype") {
    return (
      <div className="flex gap-[5px] items-center justify-center">
        <span
          className="text-[9px] font-black leading-none select-none"
          style={{ color: "#3d3b39" }}
        >
          ^
        </span>
        <span
          className="text-[9px] font-black leading-none select-none"
          style={{ color: "#3d3b39" }}
        >
          ^
        </span>
      </div>
    );
  }
  if (mood === "celebrate") {
    return (
      <div className="flex gap-[5px] items-center justify-center">
        <span
          className="text-[9px] font-black leading-none select-none"
          style={{ color: "#92701a" }}
        >
          ★
        </span>
        <span
          className="text-[9px] font-black leading-none select-none"
          style={{ color: "#92701a" }}
        >
          ★
        </span>
      </div>
    );
  }
  if (mood === "wither") {
    return (
      <div className="flex gap-[5px] items-center justify-center">
        <div
          className="w-[6px] h-[2px] rounded-full"
          style={{
            backgroundColor: "#5a5755",
            transform: "rotate(20deg) translateY(1px)",
          }}
        />
        <div
          className="w-[6px] h-[2px] rounded-full"
          style={{
            backgroundColor: "#5a5755",
            transform: "rotate(-20deg) translateY(1px)",
          }}
        />
      </div>
    );
  }
  if (mood === "watching") {
    return (
      <div className="flex gap-[5px] items-center justify-center">
        <div
          className="w-[7px] h-[7px] rounded-full"
          style={{ backgroundColor: "#3d3b39" }}
        />
        <div
          className="w-[7px] h-[7px] rounded-full"
          style={{ backgroundColor: "#3d3b39" }}
        />
      </div>
    );
  }
  // idle: half-closed
  return (
    <div className="flex gap-[5px] items-center justify-center">
      <div
        className="w-[7px] h-[4px] rounded-full"
        style={{ backgroundColor: "#3d3b39" }}
      />
      <div
        className="w-[7px] h-[4px] rounded-full"
        style={{ backgroundColor: "#3d3b39" }}
      />
    </div>
  );
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
  // level 0 — single pebble
  [
    {
      bg: "#9e9891",
      shadow: "#706d69",
      borderRadius: "55% 45% 48% 52% / 50% 52% 48% 50%",
      w: 44,
      h: 36,
    },
  ],
  // level 1 — head + body
  [
    {
      bg: "#a09b95",
      shadow: "#706d69",
      borderRadius: "55% 45% 48% 52% / 50% 54% 46% 50%",
      w: 38,
      h: 30,
    },
    {
      bg: "#8a8580",
      shadow: "#605d59",
      borderRadius: "48% 52% 55% 45% / 52% 48% 50% 50%",
      w: 50,
      h: 40,
    },
  ],
  // level 2 — head + body + base
  [
    {
      bg: "#a8a39d",
      shadow: "#706d69",
      borderRadius: "55% 45% 50% 50% / 48% 54% 46% 52%",
      w: 34,
      h: 27,
    },
    {
      bg: "#8a8580",
      shadow: "#605d59",
      borderRadius: "50% 50% 54% 46% / 52% 48% 50% 50%",
      w: 44,
      h: 35,
    },
    {
      bg: "#7c7873",
      shadow: "#565350",
      borderRadius: "46% 54% 48% 52% / 50% 52% 48% 50%",
      w: 54,
      h: 43,
    },
  ],
];

const WITHER_BG = "#6b6865";
const WITHER_SHADOW = "#4a4846";

function getAnimationClass(mood: PebbsMood): string {
  switch (mood) {
    case "idle":
      return "animate-pebbs-float";
    case "watching":
      return "";
    case "hype":
      return "animate-pebbs-bounce";
    case "celebrate":
      return "animate-pebbs-celebrate";
    case "wither":
      return "animate-pebbs-wither";
  }
}

export function Pebbs({ level, mood, withering }: PebbsProps) {
  const pebbles = PEBBLE_STYLES[level];
  const animClass = getAnimationClass(mood);

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

      <div className={`flex flex-col items-center cursor-default ${animClass}`}>
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
