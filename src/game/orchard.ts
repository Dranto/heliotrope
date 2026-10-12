// The orchard and the hives (docs/game-design.md §9.8, M22): the slowest loop of the game. Fruit
// trees planted once grow over two days of real time, then bear fruit every eight hours; hives
// pollinate the garden and the trees and fill with honey, which the great works (§6.6) ask for.
// Like the garden, everything grows online and offline and nothing ever wilts. A harvest can
// give the tree's old variety, a bonus kept for good.
import { isIntroduced } from './introductions';
import { unlockAchievements } from './achievements';
import { earnWater, isBioregionOpen, waterPerSecond } from './bioregion';
import { factorOf } from './bonuses';
import { FRUIT_IDS, FRUITS, isFruitId, type FruitId } from './fruits';
import { earnLight } from './light';
import { lightPerSecond } from './production';
import { nextRandom } from './random';
import type { GameState } from './state';

export { FRUIT_IDS, FRUITS, type FruitId } from './fruits';

/** Seconds a tree takes from planting to its first fruit: two days; it flowers halfway. */
export const TREE_SECONDS = 2 * 24 * 3600;
/** Seconds between two harvests of a grown tree. */
export const FRUIT_SECONDS = 8 * 3600;
/** A harvest gives this many seconds of Light and Water production, and baskets. */
export const FRUIT_PRODUCTION_SECONDS = 3600;
export const FRUIT_BASKETS = 8;
/** Chance that a harvest gives the tree's old variety, while it is not found. */
export const FRUIT_VARIETY_CHANCE = 1 / 3;

/** Baskets each hive costs, in order. */
export const HIVE_COSTS = [15, 40] as const;
/** Seconds a hive takes to fill one jar of honey. */
export const HONEY_SECONDS = 6 * 3600;
/** Each hive makes the garden and the trees grow this much faster. */
export const HIVE_POLLINATION = 0.2;
/** Each hive adds this to the chance of a variety in the garden (§9.7). */
export const HIVE_VARIETY_CHANCE = 0.1;

export interface Tree {
  /** Seconds of growth since planting; null while not planted. */
  age: number | null;
  /** Seconds towards the next fruit, once grown. */
  fruit: number;
}

export interface OrchardState {
  trees: Record<FruitId, Tree>;
  /** Old varieties found, in order. */
  varieties: FruitId[];
  hives: number;
  /** Jars of honey kept for the great works, spent there. */
  honey: number;
  /** Seconds towards the next jar. */
  honeyTimer: number;
  /** Fruit harvests over the whole game (Milestones). */
  harvests: number;
}

export function createOrchardState(): OrchardState {
  return {
    trees: Object.fromEntries(FRUIT_IDS.map((id) => [id, { age: null, fruit: 0 }])) as Record<
      FruitId,
      Tree
    >,
    varieties: [],
    hives: 0,
    honey: 0,
    honeyTimer: 0,
    harvests: 0,
  };
}

/** The orchard opens with the Bioregion (3rd Season) and stays open once a tree is planted. */
export function isOrchardOpen(state: GameState): boolean {
  return (
    isIntroduced(state, 'orchard') &&
    (isBioregionOpen(state) || FRUIT_IDS.some((id) => state.orchard.trees[id].age !== null))
  );
}

/** How much faster the hives make things grow: ×1.2 per hive. */
export function pollination(state: Pick<GameState, 'orchard'>): number {
  return 1 + HIVE_POLLINATION * state.orchard.hives;
}

/** How fast the trees grow and bear: the hives, and the forest's rule and network (§7.6). */
export function orchardSpeed(state: GameState): number {
  return pollination(state) * factorOf(state, 'orchardGrowth');
}

export type TreeStage = 'none' | 'sapling' | 'flowering' | 'fruiting' | 'ripe';

export function treeStage(tree: Tree): TreeStage {
  if (tree.age === null) return 'none';
  if (tree.age < TREE_SECONDS / 2) return 'sapling';
  if (tree.age < TREE_SECONDS) return 'flowering';
  return tree.fruit >= FRUIT_SECONDS ? 'ripe' : 'fruiting';
}

/** Seconds of play before a tree's next step (flowers, fruit), at the speed in force now. */
export function secondsToNext(state: GameState, id: FruitId): number {
  const tree = state.orchard.trees[id];
  const speed = orchardSpeed(state);
  if (tree.age === null) return 0;
  if (tree.age < TREE_SECONDS / 2) return (TREE_SECONDS / 2 - tree.age) / speed;
  if (tree.age < TREE_SECONDS) return (TREE_SECONDS - tree.age) / speed;
  return Math.max(0, FRUIT_SECONDS - tree.fruit) / speed;
}

/** Move the orchard forward by dtSeconds: trees grow and bear, hives fill with honey. */
export function growOrchard(state: GameState, dtSeconds: number): GameState {
  const { orchard } = state;
  const growing = FRUIT_IDS.some(
    (id) => orchard.trees[id].age !== null && treeStage(orchard.trees[id]) !== 'ripe',
  );
  if (!growing && orchard.hives === 0) return state;
  const step = dtSeconds * orchardSpeed(state);
  const trees = { ...orchard.trees };
  for (const id of FRUIT_IDS) {
    const tree = trees[id];
    if (tree.age === null) continue;
    const age = Math.min(TREE_SECONDS, tree.age + step);
    // Growth left over once grown goes to the first fruit.
    const extra = Math.max(0, tree.age + step - TREE_SECONDS);
    const fruit = age >= TREE_SECONDS ? Math.min(FRUIT_SECONDS, tree.fruit + extra) : 0;
    trees[id] = { age, fruit };
  }
  const timer = orchard.honeyTimer + dtSeconds * orchard.hives;
  const jars = Math.floor(timer / HONEY_SECONDS);
  return {
    ...state,
    orchard: {
      ...orchard,
      trees,
      honey: orchard.honey + jars,
      honeyTimer: timer - jars * HONEY_SECONDS,
    },
  };
}

export function canPlant(state: GameState, id: FruitId): boolean {
  return (
    isOrchardOpen(state) &&
    state.orchard.trees[id].age === null &&
    state.garden.baskets >= FRUITS[id].baskets
  );
}

/** Player action: plant a fruit tree, once, for baskets of the garden. */
export function plant(state: GameState, id: FruitId): GameState {
  if (!canPlant(state, id)) return state;
  return {
    ...state,
    garden: { ...state.garden, baskets: state.garden.baskets - FRUITS[id].baskets },
    orchard: {
      ...state.orchard,
      trees: { ...state.orchard.trees, [id]: { age: 0, fruit: 0 } },
    },
  };
}

export interface FruitHarvest {
  state: GameState;
  light: number;
  water: number;
  /** True when this harvest found the tree's old variety. */
  variety: boolean;
}

/** Player action: pick the fruit of a ripe tree. */
export function pickFruit(state: GameState, id: FruitId): FruitHarvest | null {
  const tree = state.orchard.trees[id];
  if (treeStage(tree) !== 'ripe') return null;
  const light = lightPerSecond(state) * FRUIT_PRODUCTION_SECONDS;
  const water = waterPerSecond(state) * FRUIT_PRODUCTION_SECONDS;
  let next = earnWater(earnLight(state, light), water);
  let variety = false;
  if (!state.orchard.varieties.includes(id)) {
    const [roll, rngSeed] = nextRandom(next.rngSeed);
    next = { ...next, rngSeed };
    variety = roll < FRUIT_VARIETY_CHANCE;
  }
  next = {
    ...next,
    garden: { ...next.garden, baskets: next.garden.baskets + FRUIT_BASKETS },
    orchard: {
      ...next.orchard,
      trees: { ...next.orchard.trees, [id]: { ...tree, fruit: 0 } },
      varieties: variety ? [...next.orchard.varieties, id] : next.orchard.varieties,
      harvests: next.orchard.harvests + 1,
    },
  };
  return { state: unlockAchievements(next), light, water, variety };
}

/** The baskets the next hive costs; null once every hive is set. */
export function nextHiveCost(state: Pick<GameState, 'orchard'>): number | null {
  return HIVE_COSTS[state.orchard.hives] ?? null;
}

export function canSetHive(state: GameState): boolean {
  const cost = nextHiveCost(state);
  return isOrchardOpen(state) && cost !== null && state.garden.baskets >= cost;
}

/** Player action: set a hive in the orchard, for baskets of the garden. */
export function setHive(state: GameState): GameState {
  if (!canSetHive(state)) return state;
  const cost = nextHiveCost(state)!;
  return {
    ...state,
    garden: { ...state.garden, baskets: state.garden.baskets - cost },
    orchard: { ...state.orchard, hives: state.orchard.hives + 1 },
  };
}

/** Keep only what a save can hold. */
export function validOrchard(raw: unknown): OrchardState {
  const state = createOrchardState();
  if (typeof raw !== 'object' || raw === null) return state;
  const data = raw as Record<string, unknown>;
  const trees = data.trees as Record<string, unknown> | undefined;
  for (const id of FRUIT_IDS) {
    const tree = trees?.[id] as Record<string, unknown> | undefined;
    const age = tree?.age;
    if (typeof age !== 'number' || !Number.isFinite(age) || age < 0) continue;
    const fruit = typeof tree?.fruit === 'number' && Number.isFinite(tree.fruit) ? tree.fruit : 0;
    state.trees[id] = {
      age: Math.min(age, TREE_SECONDS),
      fruit: age >= TREE_SECONDS ? Math.min(Math.max(0, fruit), FRUIT_SECONDS) : 0,
    };
  }
  if (Array.isArray(data.varieties)) {
    state.varieties = [...new Set<FruitId>(data.varieties.filter(isFruitId))];
  }
  const count = (value: unknown, max = Infinity) =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0 ? Math.min(value, max) : 0;
  state.hives = count(data.hives, HIVE_COSTS.length);
  state.honey = count(data.honey);
  state.harvests = count(data.harvests);
  state.honeyTimer =
    typeof data.honeyTimer === 'number' && data.honeyTimer >= 0
      ? Math.min(data.honeyTimer, HONEY_SECONDS)
      : 0;
  return state;
}
