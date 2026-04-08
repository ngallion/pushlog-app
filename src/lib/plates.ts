export const AVAILABLE_PLATES = [45, 35, 25, 10, 5, 2.5] as const;
export const DEFAULT_BAR_WEIGHT = 45;

const BAR_WEIGHT_KEY = "pushlog:barWeight";

export function loadBarWeight(): number {
  const raw = localStorage.getItem(BAR_WEIGHT_KEY);
  if (raw === null) return DEFAULT_BAR_WEIGHT;
  const n = parseFloat(raw);
  return isNaN(n) ? DEFAULT_BAR_WEIGHT : n;
}

export function saveBarWeight(lbs: number): void {
  localStorage.setItem(BAR_WEIGHT_KEY, String(lbs));
}

/**
 * Returns the per-side plate breakdown for a given total weight and bar weight.
 * Returns an empty array if the weight is at or below bar weight.
 */
export function calcPlates(totalWeight: number, barWeight: number): number[] {
  const perSide = Math.round(((totalWeight - barWeight) / 2) * 100) / 100;
  if (perSide <= 0) return [];

  const plates: number[] = [];
  let remaining = perSide;

  for (const plate of AVAILABLE_PLATES) {
    while (remaining >= plate - 0.001) {
      plates.push(plate);
      remaining = Math.round((remaining - plate) * 100) / 100;
    }
  }

  return plates;
}
