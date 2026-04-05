import type { PebbsMood } from "../hooks/usePebbs";

interface PebbsProps {
  level: number;
  mood: PebbsMood;
  witherLevel: number;
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

// Each array is ordered top (head) to bottom (body)
// Levels 2 and 3 share the same pebble stack — arms/legs are added separately
const PEBBLE_STYLES: PebbleStyle[][] = [
  // level 0 — head only
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
  // level 2 — head + body (arms rendered separately)
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
  // level 3 — head + body (arms + legs rendered separately)
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

export function Pebbs({ level, mood, witherLevel }: PebbsProps) {
  const pebbles = PEBBLE_STYLES[level] ?? PEBBLE_STYLES[0];
  const animClass = getAnimationClass(mood);
  const withering = witherLevel > 0;

  // Body pebble colors (used for arms/legs)
  const bodyStyle = pebbles.length > 1 ? pebbles[1] : pebbles[0];
  const armBg = withering ? WITHER_BG : bodyStyle.bg;
  const armShadow = withering ? WITHER_SHADOW : bodyStyle.shadow;

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
        {pebbles.map((pebble, i) => {
          const isBody = i === pebbles.length - 1 && pebbles.length > 1;
          return (
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

              {/* Arms — rendered inside body pebble at level 2+ */}
              {isBody && level >= 2 && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      left: -9,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 11,
                      height: 9,
                      backgroundColor: armBg,
                      borderRadius: "50% 30% 40% 60% / 50% 50% 50% 50%",
                      boxShadow: `inset -2px -3px 0 0 ${armShadow}`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: -9,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 11,
                      height: 9,
                      backgroundColor: armBg,
                      borderRadius: "30% 50% 60% 40% / 50% 50% 50% 50%",
                      boxShadow: `inset 2px -3px 0 0 ${armShadow}`,
                    }}
                  />
                </>
              )}
            </div>
          );
        })}

        {/* Legs — rendered below body at level 3+ */}
        {level >= 3 && (
          <div
            className="flex gap-[8px]"
            style={{ marginTop: -4, zIndex: 0 }}
          >
            <div
              style={{
                width: 11,
                height: 14,
                backgroundColor: armBg,
                borderRadius: "40% 30% 50% 50% / 0% 0% 100% 100%",
                boxShadow: `inset -2px -4px 0 0 ${armShadow}`,
              }}
            />
            <div
              style={{
                width: 11,
                height: 14,
                backgroundColor: armBg,
                borderRadius: "30% 40% 50% 50% / 0% 0% 100% 100%",
                boxShadow: `inset 2px -4px 0 0 ${armShadow}`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
