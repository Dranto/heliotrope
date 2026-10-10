// Seeded pseudo-random numbers (mulberry32). The seed lives in GameState, so every random
// event (the Golden Butterfly, §9.2) stays a pure, reproducible state transition.

/** Draw a number in [0, 1) from a 32-bit seed; returns it with the next seed. */
export function nextRandom(seed: number): [value: number, nextSeed: number] {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** A 32-bit seed derived from a timestamp, so new games do not all share one sequence. */
export function seedFrom(value: number): number {
  return (Math.floor(value) ^ 0x9e3779b9) >>> 0;
}
