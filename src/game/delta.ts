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
  // Opens the challenge Cycles (cycleChallenges.ts).
  floodArm: { id: 'floodArm', costs: [2] },
  // The Seeds ripen sooner: 15 min, then 12, then 10 (§7).
  seedArm: { id: 'seedArm', costs: [3, 6] },
  // Half of each collector and of each site level stays after a Cycle.
  memoryArm: { id: 'memoryArm', costs: [5] },
  // Starts the next Cycle by itself at the level the player chose (cycles.ts).
  lockKeeper: { id: 'lockKeeper', costs: [8] },
};

/** Seconds a Season lasts before its Seeds are ripe, by level of the seed arm. */
export const RIPENING_SECONDS = [15 * 60, 12 * 60, 10 * 60] as const;

/** Share of each collector and site level a Cycle keeps with the memory arm. */
export const MEMORY_KEPT = 0.5;

/** The lock keeper's settings: start the Cycle once its Sources multiply the ones owned. */
export const LOCK_FACTORS = [1.25, 1.5, 2, 3] as const;
export const DEFAULT_LOCK_FACTOR = 1.5;

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
}

export function createDeltaState(): DeltaState {
  return {
    levels: Object.fromEntries(DELTA_IDS.map((id) => [id, 0])) as Record<DeltaId, number>,
    lockFactor: 0,
    lockCycles: 0,
  };
}

export function isDeltaId(value: unknown): value is DeltaId {
  return typeof value === 'string' && Object.hasOwn(DELTA, value);
}

/** The delta opens with the first Cycle of water, once Sources exist to spend. */
export function isDeltaOpen(state: Pick<GameState, 'cycles'>): boolean {
  return state.cycles > 0;
}

export function isArmOpen(state: Pick<GameState, 'delta'>, id: DeltaId): boolean {
  return state.delta.levels[id] > 0;
}

/** Sources spent on the arms opened. */
export function deltaSourcesSpent(levels: Readonly<Record<DeltaId, number>>): number {
  let spent = 0;
  for (const id of DELTA_IDS) {
    for (let level = 0; level < levels[id]; level++) spent += DELTA[id].costs[level] ?? 0;
  }
  return spent;
}

/** Sources left to spend in the delta; the bonus of the Sources counts them all. */
export function availableSources(state: Pick<GameState, 'sources' | 'delta'>): number {
  return Math.max(0, state.sources - deltaSourcesSpent(state.delta.levels));
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

/** Levels opened over the whole delta. */
export function deltaLevels(state: Pick<GameState, 'delta'>): number {
  return DELTA_IDS.reduce((sum, id) => sum + state.delta.levels[id], 0);
}

/** Seconds a Season must last before its Seeds are ripe (§7), shorter with the seed arm. */
export function ripeningSeconds(state: Pick<GameState, 'delta'>): number {
  const level = Math.min(state.delta.levels.seedArm, RIPENING_SECONDS.length - 1);
  return RIPENING_SECONDS[level] ?? RIPENING_SECONDS[0];
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

/** Bonuses of the hillsides site at `level`: livelier clicks and more frequent visits. */
export function hillsidesBonuses(level: number): Bonus[] {
  if (level <= 0) return [];
  return [
    { kind: 'clickMultiplier', factor: 1 + HILLSIDES_CLICK_BONUS * level },
    { kind: 'visitInterval', factor: 1 / (1 + HILLSIDES_VISIT_BONUS * level) },
  ];
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
