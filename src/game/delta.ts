// The delta of the Sources (docs/game-design.md §7.5, M15): above the Cycle of water, arms of the
// river opened with Sources, like the Tree of Seasons with Seeds (§7.1). Spending Sources never
// lowers their bonus: the arms are paid from the Sources obtained, which only ever grow. Each arm
// changes a rule of the Bioregion or the Seasons rather than adding speed. Kept forever. Names
// live in src/i18n, the drawing in src/ui.
import type { Bonus } from './bonuses';
import type { GameState } from './state';

export const DELTA_IDS = ['hillsArm', 'floodArm', 'seedArm', 'memoryArm', 'lockKeeper'] as const;
export type DeltaId = (typeof DELTA_IDS)[number];

export interface DeltaDef {
  id: DeltaId;
  /** Sources asked for each level, in order; the arm has as many levels. */
  costs: readonly number[];
}

export const DELTA: Record<DeltaId, DeltaDef> = {
  // Opens the fifth site of the Bioregion, the hillsides (bioregion.ts).
  hillsArm: { id: 'hillsArm', costs: [2] },
  // Every site level of the Bioregion costs FLOOD_SITE_DISCOUNT less Water (slimming plan, lot 4).
  floodArm: { id: 'floodArm', costs: [2] },
  // The Seeds ripen sooner: 15 min, then 12, then 10 (§7).
  seedArm: { id: 'seedArm', costs: [3, 6] },
  // Half of each collector and of each site level stays after a Cycle.
  memoryArm: { id: 'memoryArm', costs: [5] },
  // Starts the next Cycle by itself at the level the player chose (cycles.ts).
  lockKeeper: { id: 'lockKeeper', costs: [8] },
};

// Widening the arms (§7.5, M19): once the whole delta is open, four arms widen level by level,
// on the model of the Canopy (§7.1), so the Sources of the late Cycles always have a use.
export const WIDE_ARM_IDS = ['seedArm', 'memoryArm', 'hillsArm', 'floodArm'] as const;
export type WideArmId = (typeof WIDE_ARM_IDS)[number];

/** Sources asked for the first widening of an arm; each next one costs WIDEN_GROWTH times more. */
export const WIDEN_BASE_COST = 5;
export const WIDEN_GROWTH = 1.5;
/** Widening levels of each arm. */
export const WIDEN_MAX = 10;

/** Each widening of the seed arm: the Seeds ripen this many seconds sooner, down to the floor. */
export const SEED_WIDEN_SECONDS = 30;
export const MIN_RIPENING_SECONDS = 5 * 60;
/** Each widening of the memory arm: this much more of each collector and site level stays. */
export const MEMORY_WIDEN_SHARE = 0.04;
/** Each widening of the hillsides or the flood arm: its effects grow by this share. */
export const WIDEN_EFFECT_SHARE = 0.1;
/** Share of the Water a site level costs that the flood arm saves, before widening. */
export const FLOOD_SITE_DISCOUNT = 0.25;

/** Seconds a Season lasts before its Seeds are ripe, by level of the seed arm. */
export const RIPENING_SECONDS = [15 * 60, 12 * 60, 10 * 60] as const;

/** Share of each collector and site level a Cycle keeps with the memory arm. */
export const MEMORY_KEPT = 0.5;

/** The lock keeper's settings: start the Cycle once its Sources multiply the ones owned. */
export const LOCK_FACTORS = [1.25, 1.5, 2, 3] as const;

/** Cycles the lock keeper started that unlock the Milestone "L'éclusier veille". */
export const LOCK_MILESTONE_CYCLES = 5;

/** Each level of the hillsides site: clicks ×(1 + this × level). */
export const HILLSIDES_CLICK_BONUS = 0.25;
/** Each level of the hillsides site: visits come 1 + this × level times as often. */
export const HILLSIDES_VISIT_BONUS = 0.1;

export interface DeltaState {
  /** Level of each arm, 0 while closed. Kept forever. */
  levels: Record<DeltaId, number>;
  /** Factor the lock keeper waits for, 0 when switched off (the default). */
  lockFactor: number;
  /** Cycles the lock keeper started (Milestone). */
  lockCycles: number;
  /** Widening levels of each wide arm (M19), 0 at first. Kept forever. */
  widths: Record<WideArmId, number>;
}

export function createWidths(): Record<WideArmId, number> {
  return Object.fromEntries(WIDE_ARM_IDS.map((id) => [id, 0])) as Record<WideArmId, number>;
}

export function createDeltaState(): DeltaState {
  return {
    levels: Object.fromEntries(DELTA_IDS.map((id) => [id, 0])) as Record<DeltaId, number>,
    lockFactor: 0,
    lockCycles: 0,
    widths: createWidths(),
  };
}

/** The delta opens with the first Cycle of water, once Sources exist to spend. */
export function isDeltaOpen(state: Pick<GameState, 'cycles'>): boolean {
  return state.cycles > 0;
}

export function isArmOpen(state: Pick<GameState, 'delta'>, id: DeltaId): boolean {
  return state.delta.levels[id] > 0;
}

/** Sources asked for the widening after `width` of an arm. */
export function widenCost(width: number): number {
  return Math.round(WIDEN_BASE_COST * WIDEN_GROWTH ** width);
}

/** Sources spent on the arms opened, and on their widenings. */
export function deltaSourcesSpent(
  levels: Readonly<Record<DeltaId, number>>,
  widths: Readonly<Record<WideArmId, number>> = createWidths(),
): number {
  let spent = 0;
  for (const id of DELTA_IDS) {
    for (let level = 0; level < levels[id]; level++) spent += DELTA[id].costs[level] ?? 0;
  }
  for (const id of WIDE_ARM_IDS) {
    for (let width = 0; width < widths[id]; width++) spent += widenCost(width);
  }
  return spent;
}

/** Sources left to spend in the delta; the bonus of the Sources counts them all. */
export function availableSources(state: Pick<GameState, 'sources' | 'delta'>): number {
  return Math.max(0, state.sources - deltaSourcesSpent(state.delta.levels, state.delta.widths));
}

/** Sources asked for the next level of an arm; null at its last level. */
export function nextArmCost(state: Pick<GameState, 'delta'>, id: DeltaId): number | null {
  return DELTA[id].costs[state.delta.levels[id]] ?? null;
}

export function canOpenArm(state: GameState, id: DeltaId): boolean {
  const cost = nextArmCost(state, id);
  return isDeltaOpen(state) && cost !== null && availableSources(state) >= cost;
}

/** Player action: open one more level of an arm of the delta, kept forever. */
export function openArm(state: GameState, id: DeltaId): GameState {
  if (!canOpenArm(state, id)) return state;
  const { levels } = state.delta;
  return { ...state, delta: { ...state.delta, levels: { ...levels, [id]: levels[id] + 1 } } };
}

/** Every arm at its last level. */
export function isDeltaComplete(state: Pick<GameState, 'delta'>): boolean {
  return DELTA_IDS.every((id) => state.delta.levels[id] >= DELTA[id].costs.length);
}

/** Sources asked for the next widening of an arm; null before the whole delta is open or at the last. */
export function nextWidenCost(state: Pick<GameState, 'delta'>, id: WideArmId): number | null {
  const width = state.delta.widths[id];
  return isDeltaComplete(state) && width < WIDEN_MAX ? widenCost(width) : null;
}

export function canWidenArm(state: GameState, id: WideArmId): boolean {
  const cost = nextWidenCost(state, id);
  return cost !== null && availableSources(state) >= cost;
}

/** Player action: widen an arm by one level, kept forever (M19). */
export function widenArm(state: GameState, id: WideArmId): GameState {
  if (!canWidenArm(state, id)) return state;
  const { widths } = state.delta;
  return { ...state, delta: { ...state.delta, widths: { ...widths, [id]: widths[id] + 1 } } };
}

/** Ripening time with the seed arm at `level` and widened `width` times. */
export function ripeningFor(level: number, width: number): number {
  const base =
    RIPENING_SECONDS[Math.min(level, RIPENING_SECONDS.length - 1)] ?? RIPENING_SECONDS[0];
  return Math.max(MIN_RIPENING_SECONDS, base - SEED_WIDEN_SECONDS * width);
}

/** Share of each collector and site level a Cycle keeps with the memory arm widened `width` times. */
export function memoryShare(width: number): number {
  return MEMORY_KEPT + MEMORY_WIDEN_SHARE * width;
}

/** Share of each collector and site level the next Cycle keeps: none without the memory arm. */
export function keptByMemory(state: Pick<GameState, 'delta'>): number {
  return isArmOpen(state, 'memoryArm') ? memoryShare(state.delta.widths.memoryArm) : 0;
}

/** How much the effects of a widened hillsides or flood arm are scaled. */
export function widenFactor(width: number): number {
  return 1 + WIDEN_EFFECT_SHARE * width;
}

/** Factor on the Water cost of every site level: lower once the flood arm is open, and widened. */
export function floodSiteFactor(state: Pick<GameState, 'delta'>): number {
  if (!isArmOpen(state, 'floodArm')) return 1;
  return 1 - FLOOD_SITE_DISCOUNT * widenFactor(state.delta.widths.floodArm);
}

/** Levels opened over the whole delta. */
export function deltaLevels(state: Pick<GameState, 'delta'>): number {
  return DELTA_IDS.reduce((sum, id) => sum + state.delta.levels[id], 0);
}

/** Seconds a Season must last before its Seeds are ripe (§7), shorter with the seed arm. */
export function ripeningSeconds(state: Pick<GameState, 'delta'>): number {
  return ripeningFor(state.delta.levels.seedArm, state.delta.widths.seedArm);
}

/** Player action: the factor the lock keeper waits for, or 0 to switch it off. */
export function setLockFactor(state: GameState, factor: number): GameState {
  if (factor !== 0 && !(LOCK_FACTORS as readonly number[]).includes(factor)) return state;
  return { ...state, delta: { ...state.delta, lockFactor: factor } };
}

/** The lock keeper works once its arm is open and the player switched it on. */
export function isLockKeeperWorking(state: Pick<GameState, 'delta'>): boolean {
  return isArmOpen(state, 'lockKeeper') && state.delta.lockFactor > 0;
}

/**
 * Bonuses of the hillsides site at `level`: livelier clicks and more frequent visits, `scale`
 * times stronger once the hillsides arm is widened.
 */
export function hillsidesBonuses(level: number, scale = 1): Bonus[] {
  if (level <= 0) return [];
  return [
    { kind: 'clickMultiplier', factor: 1 + HILLSIDES_CLICK_BONUS * scale * level },
    { kind: 'visitInterval', factor: 1 / (1 + HILLSIDES_VISIT_BONUS * scale * level) },
  ];
}

/** Keep only widening levels a save can hold. */
export function validWidths(raw: unknown): Record<WideArmId, number> {
  const widths = createWidths();
  if (typeof raw !== 'object' || raw === null) return widths;
  for (const id of WIDE_ARM_IDS) {
    const value = (raw as Record<string, unknown>)[id];
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
      widths[id] = Math.min(value, WIDEN_MAX);
    }
  }
  return widths;
}

/** Keep only arm levels a save can hold. */
export function validDeltaLevels(raw: unknown): Record<DeltaId, number> {
  const levels = createDeltaState().levels;
  if (typeof raw !== 'object' || raw === null) return levels;
  for (const id of DELTA_IDS) {
    const value = (raw as Record<string, unknown>)[id];
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
      levels[id] = Math.min(value, DELTA[id].costs.length);
    }
  }
  return levels;
}
