import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { AVAILABLE_PLATES } from "../lib/plates";

const PRESET_BARS = [
  { label: "45 lb", weight: 45 },
  { label: "35 lb", weight: 35 },
];

const ANIM_DURATION = 280;

interface Props {
  onConfirm: (weight: number) => void;
  onClose: () => void;
}

export function PlateCalculator({ onConfirm, onClose }: Props) {
  const [barWeight, setBarWeight] = useState(45);
  const [customBar, setCustomBar] = useState("");
  const [plates, setPlates] = useState<number[]>([]);
  const [closing, setClosing] = useState(false);

  const dismiss = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, ANIM_DURATION);
  }, [onClose]);

  const effectiveBar =
    customBar !== "" ? parseFloat(customBar) || 0 : barWeight;
  const perSideTotal = plates.reduce((s, p) => s + p, 0);
  const total = effectiveBar + perSideTotal * 2;

  const addPlate = (plate: number) =>
    setPlates((prev) => [...prev, plate].sort((a, b) => b - a));
  const removeLast = () => setPlates((prev) => prev.slice(0, -1));

  const grouped = plates.reduce<Record<number, number>>((acc, p) => {
    acc[p] = (acc[p] ?? 0) + 1;
    return acc;
  }, {});

  const selectPreset = (weight: number) => {
    setBarWeight(weight);
    setCustomBar("");
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{
        animation: `${closing ? "backdrop-out" : "backdrop-in"} ${ANIM_DURATION}ms ease both`,
        backgroundColor: "rgba(0,0,0,0.6)",
      }}
      onClick={dismiss}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-t-2xl w-full max-w-lg px-5 pt-5 pb-10"
        style={{
          animation: `${closing ? "sheet-out" : "sheet-in"} ${ANIM_DURATION}ms cubic-bezier(0.32,0.72,0,1) both`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-zinc-100">Plate Calculator</h2>
          <button
            onClick={dismiss}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Bar selector */}
        <div className="flex gap-2 mb-4">
          {PRESET_BARS.map((opt) => (
            <button
              key={opt.weight}
              onClick={() => selectPreset(opt.weight)}
              className={`py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                customBar === "" && barWeight === opt.weight
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="flex items-center gap-1.5 flex-1">
            <input
              type="number"
              min={0}
              placeholder="Custom"
              value={customBar}
              onChange={(e) => setCustomBar(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-zinc-600"
            />
            <span className="text-zinc-500 text-xs shrink-0">lb bar</span>
          </div>
        </div>

        {/* Total */}
        <div className="text-center mb-3">
          <span className="text-4xl font-bold tabular-nums text-zinc-100">
            {total}
          </span>
          <span className="text-zinc-500 text-lg ml-1">lbs</span>
          <div className="flex flex-wrap gap-1.5 justify-center mt-2 min-h-[24px]">
            {plates.length > 0 ? (
              <>
                {Object.entries(grouped)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([plate, count]) => (
                    <span
                      key={plate}
                      className="text-xs bg-zinc-700 text-zinc-300 rounded-full px-2.5 py-0.5 font-mono"
                    >
                      {count > 1 ? `${count}×` : ""}
                      {plate}
                    </span>
                  ))}
                <span className="text-xs text-zinc-600 self-center">
                  each side
                </span>
              </>
            ) : (
              <span className="text-xs text-zinc-600">bar only</span>
            )}
          </div>
        </div>

        {/* Plate buttons */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {AVAILABLE_PLATES.map((plate) => (
            <button
              key={plate}
              onClick={() => addPlate(plate)}
              className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-semibold py-3 rounded-xl text-sm transition-all"
            >
              +{plate}
            </button>
          ))}
        </div>

        <button
          onClick={removeLast}
          disabled={plates.length === 0}
          className="w-full py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors mb-3"
        >
          Remove last plate
        </button>

        <button
          onClick={() => {
            onConfirm(total);
            dismiss();
          }}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Use {total} lbs
        </button>
      </div>
    </div>
  );
}
