// The Tree of Seasons (docs/game-design.md §7.1): permanent talents bought with Heliotrope Seeds.
// Spending Seeds never lowers their +5% bonus: the bonus counts every Seed obtained, the tree
// spends a separate balance (obtained − spent). Talents are kept across Seasons. Names live in
// src/i18n, the drawing of the tree in src/ui.
import type { Bonus } from './bonuses';
import type { CooperativeId } from './cooperatives';
import type { GameState } from './state';

export const TALENT_BRANCHES = ['roots', 'pollinators', 'memory', 'quarter'] as const;
/**
 * Racines (production), Pollinisateurs (active play), Mémoire (comfort and automation), Le
 * Quartier (the prices of the neighbourhood and the pace of the Season).
 */
export type TalentBranch = (typeof TALENT_BRANCHES)[number];

export const TALENT_IDS = [
  'mycorrhiza',
  'earlyDiversity',
  'cuttings',
  'livingSoil',
  'motherForest',
  'nectarFlowers',
  'hedgerows',
  'longBloom',
  'greatSwarm',
  'beeDance',
  'gardenersCoop',
  'nightWatch',
  'roofersCoop',
  'farmersCoop',
  'neighbourhoodCouncil',
  'forestersCoop',
  'longMemory',
  'deepSoil',
  'wildMeadow',
  'springWatch',
  'tramMarket',
  'commonWorks',
  'deepRoots',
  'landTrust',
  'openStreets',
] as const;
export type TalentId = (typeof TALENT_IDS)[number];

export interface TalentDef {
  id: TalentId;
  branch: TalentBranch;
  /** Seeds spent to learn it. */
  cost: number;
  /** Talent that must be learnt first; none for the first talent of a branch. */
  parent?: TalentId;
  bonuses: readonly Bonus[];
  /** Cooperative that starts working for the player (§7.2). */
  cooperative?: CooperativeId;
}

export const TALENT_LIST: readonly TalentDef[] = [
  // Racines: the soil remembers what grew.
  {
    id: 'mycorrhiza',
    branch: 'roots',
    cost: 1,
    bonuses: [{ kind: 'synergyFactor', factor: 1.25 }],
  },
  {
    id: 'earlyDiversity',
    branch: 'roots',
    cost: 1,
    parent: 'mycorrhiza',
    bonuses: [{ kind: 'biodiversityThreshold', threshold: 5 }],
  },
  {
    id: 'cuttings',
    branch: 'roots',
    cost: 2,
    parent: 'mycorrhiza',
    bonuses: [{ kind: 'keepGenerators', fraction: 0.1 }],
  },
  {
    id: 'livingSoil',
    branch: 'roots',
    cost: 3,
    parent: 'cuttings',
    bonuses: [{ kind: 'perSeason', bonus: 0.05 }],
  },
  {
    id: 'motherForest',
    branch: 'roots',
    cost: 5,
    parent: 'earlyDiversity',
    bonuses: [{ kind: 'globalPerType', bonus: 0.03 }],
  },
  // Pollinisateurs: rewards for the player who plays.
  {
    id: 'nectarFlowers',
    branch: 'pollinators',
    cost: 1,
    bonuses: [{ kind: 'clickMultiplier', factor: 2 }],
  },
  {
    id: 'hedgerows',
    branch: 'pollinators',
    cost: 1,
    parent: 'nectarFlowers',
    bonuses: [{ kind: 'butterflyInterval', factor: 0.85 }],
  },
  {
    id: 'longBloom',
    branch: 'pollinators',
    cost: 2,
    parent: 'hedgerows',
    bonuses: [{ kind: 'effectDuration', effect: 'bloom', factor: 1.5 }],
  },
  {
    id: 'greatSwarm',
    branch: 'pollinators',
    cost: 3,
    parent: 'hedgerows',
    bonuses: [
      { kind: 'harvestFactor', factor: 2 },
      { kind: 'effectDuration', effect: 'pollination', factor: 1.5 },
    ],
  },
  {
    id: 'beeDance',
    branch: 'pollinators',
    cost: 5,
    parent: 'longBloom',
    bonuses: [{ kind: 'clickMultiplier', factor: 3 }],
  },
  // Mémoire: the neighbourhood organises itself.
  {
    id: 'gardenersCoop',
    branch: 'memory',
    cost: 1,
    bonuses: [],
    cooperative: 'gardeners',
  },
  {
    id: 'nightWatch',
    branch: 'memory',
    cost: 1,
    parent: 'gardenersCoop',
    bonuses: [{ kind: 'offlineCap', seconds: 4 * 3600 }],
  },
  {
    id: 'roofersCoop',
    branch: 'memory',
    cost: 2,
    parent: 'gardenersCoop',
    bonuses: [],
    cooperative: 'roofers',
  },
  {
    id: 'farmersCoop',
    branch: 'memory',
    cost: 3,
    parent: 'roofersCoop',
    bonuses: [],
    cooperative: 'farmers',
  },
  {
    id: 'neighbourhoodCouncil',
    branch: 'memory',
    cost: 3,
    parent: 'roofersCoop',
    bonuses: [],
    cooperative: 'council',
  },
  {
    id: 'forestersCoop',
    branch: 'memory',
    cost: 5,
    parent: 'farmersCoop',
    bonuses: [],
    cooperative: 'foresters',
  },
  {
    id: 'longMemory',
    branch: 'memory',
    cost: 5,
    parent: 'nightWatch',
    bonuses: [{ kind: 'offlineCap', seconds: 12 * 3600 }],
  },
  // The twins of the forks (FORKS): same parent and cost as the talent they exclude.
  {
    id: 'deepSoil',
    branch: 'roots',
    cost: 2,
    parent: 'mycorrhiza',
    bonuses: [{ kind: 'ripening', seconds: 120 }],
  },
  {
    id: 'wildMeadow',
    branch: 'pollinators',
    cost: 2,
    parent: 'hedgerows',
    bonuses: [{ kind: 'gardenGrowth', factor: 1.5 }],
  },
  {
    id: 'springWatch',
    branch: 'memory',
    cost: 1,
    parent: 'gardenersCoop',
    bonuses: [{ kind: 'water', factor: 1.25 }],
  },
  // Le Quartier: the neighbourhood restores itself for less.
  {
    id: 'tramMarket',
    branch: 'quarter',
    cost: 1,
    bonuses: [{ kind: 'clickMultiplier', factor: 2 }],
  },
  {
    id: 'commonWorks',
    branch: 'quarter',
    cost: 2,
    parent: 'tramMarket',
    bonuses: [{ kind: 'projectDiscount', fraction: 0.25 }],
  },
  {
    id: 'deepRoots',
    branch: 'quarter',
    cost: 3,
    parent: 'tramMarket',
    bonuses: [{ kind: 'discount', fraction: 0.1 }],
  },
  {
    id: 'landTrust',
    branch: 'quarter',
    cost: 3,
    parent: 'commonWorks',
    bonuses: [{ kind: 'landDiscount', fraction: 0.25 }],
  },
  {
    id: 'openStreets',
    branch: 'quarter',
    cost: 5,
    parent: 'deepRoots',
    bonuses: [{ kind: 'visitInterval', factor: 0.75 }],
  },
];

export const TALENTS = Object.fromEntries(TALENT_LIST.map((t) => [t.id, t])) as Record<
  TalentId,
  TalentDef
>;

/**
 * The forks of the tree (slimming plan, lot 8): two talents with the same parent and cost, of
 * which only one can be learnt. A learnt one can be swapped for its twin once per Cycle of water.
 */
export const FORKS = {
  soil: ['cuttings', 'deepSoil'],
  bloom: ['longBloom', 'wildMeadow'],
  watch: ['nightWatch', 'springWatch'],
} as const satisfies Record<string, readonly [TalentId, TalentId]>;
export type ForkId = keyof typeof FORKS;
export const FORK_IDS = Object.keys(FORKS) as ForkId[];

/** Talents of a whole tree: one of each fork. */
export const TREE_SIZE = TALENT_LIST.length - FORK_IDS.length;

/** The fork a talent belongs to, if any. */
export function forkOf(id: TalentId): ForkId | undefined {
  return FORK_IDS.find((fork) => (FORKS[fork] as readonly TalentId[]).includes(id));
}

/** The talent a fork's talent excludes. */
export function twinOf(id: TalentId): TalentId | undefined {
  const fork = forkOf(id);
  if (!fork) return undefined;
  const [a, b] = FORKS[fork];
  return id === a ? b : a;
}

export function isTalentId(value: unknown): value is TalentId {
  return typeof value === 'string' && Object.hasOwn(TALENTS, value);
}

/** Seeds spent on the talents of the tree. */
export function seedsSpent(talents: readonly TalentId[]): number {
  return talents.reduce((sum, id) => sum + TALENTS[id].cost, 0);
}

// The Canopy (§7.1 "La Canopée", M13): above the crown, levelled talents that open once the whole
// tree is learnt, so the Seeds of the late Seasons always have a use.

export const CANOPY_IDS = [
  'rootsBough',
  'pollinatorsBough',
  'memoryBough',
  'nursery',
  'sower',
  'fountaineers',
  'assembly',
  'growers',
  'laurels',
] as const;
export type CanopyId = (typeof CANOPY_IDS)[number];

export interface CanopyDef {
  id: CanopyId;
  /** Seeds of the first level; each next level costs `growth` times more. */
  baseCost: number;
  growth: number;
  maxLevel: number;
  /** Bonuses in force at `level` (1 or more). */
  bonuses: (level: number) => readonly Bonus[];
  /** Cooperative that starts working for the player at level 1 (§7.2). */
  cooperative?: CooperativeId;
}

export const CANOPY_LIST: readonly CanopyDef[] = [
  {
    id: 'rootsBough',
    baseCost: 5,
    growth: 1.5,
    maxLevel: 10,
    bonuses: (level) => [{ kind: 'synergyFactor', factor: 1 + 0.05 * level }],
  },
  {
    id: 'pollinatorsBough',
    baseCost: 5,
    growth: 1.5,
    maxLevel: 10,
    bonuses: (level) => [{ kind: 'butterflyInterval', factor: 1 - 0.03 * level }],
  },
  {
    id: 'memoryBough',
    baseCost: 5,
    growth: 1.5,
    maxLevel: 10,
    bonuses: (level) => [{ kind: 'visitInterval', factor: 1 - 0.03 * level }],
  },
  {
    id: 'nursery',
    baseCost: 10,
    growth: 2,
    maxLevel: 4,
    // Replaces the 10% of the Boutures: the best share in force is kept.
    bonuses: (level) => [{ kind: 'keepGenerators', fraction: 0.1 + 0.1 * level }],
  },
  { id: 'sower', baseCost: 15, growth: 1, maxLevel: 1, bonuses: () => [] },
  {
    id: 'fountaineers',
    baseCost: 15,
    growth: 1,
    maxLevel: 1,
    bonuses: () => [],
    cooperative: 'fountaineers',
  },
  // M36: the council of the neighbourhood carries out the projects too (read in cooperatives.ts).
  { id: 'assembly', baseCost: 15, growth: 1, maxLevel: 1, bonuses: () => [] },
  {
    id: 'growers',
    baseCost: 15,
    growth: 1,
    maxLevel: 1,
    bonuses: () => [],
    cooperative: 'growers',
  },
  // M37: the laurels count the families of Milestones complete (§9.16).
  {
    id: 'laurels',
    baseCost: 10,
    growth: 2,
    maxLevel: 3,
    bonuses: (level) => [{ kind: 'perMilestoneFamily', bonus: 0.03 * level }],
  },
];

export const CANOPY = Object.fromEntries(CANOPY_LIST.map((c) => [c.id, c])) as Record<
  CanopyId,
  CanopyDef
>;

/** The sower's settings: relaunch the Season once its ripe Seeds multiply the ones owned. */
export const SOWER_FACTORS = [1.5, 2, 3, 5] as const;

export interface CanopyState {
  /** Level of each canopy talent, 0 when not sown. Kept across Seasons and Cycles. */
  levels: Record<CanopyId, number>;
  /** Factor the sower waits for, 0 when the player switched it off (the default). */
  sowerFactor: number;
  /** Seasons the sower started (Milestone "Semis spontané"). */
  sowerSeasons: number;
}

export function createCanopyState(): CanopyState {
  return {
    levels: Object.fromEntries(CANOPY_IDS.map((id) => [id, 0])) as Record<CanopyId, number>,
    sowerFactor: 0,
    sowerSeasons: 0,
  };
}

/** Seeds asked for the level after `level` of a canopy talent. */
export function canopyLevelCost(id: CanopyId, level: number): number {
  const { baseCost, growth } = CANOPY[id];
  return Math.round(baseCost * growth ** level);
}

/** Seeds spent on the levels reached in the canopy. */
export function canopySeedsSpent(levels: Readonly<Record<CanopyId, number>>): number {
  let spent = 0;
  for (const id of CANOPY_IDS) {
    for (let level = 0; level < levels[id]; level++) spent += canopyLevelCost(id, level);
  }
  return spent;
}

/** Bonuses of the canopy levels reached. */
export function canopyBonuses(levels: Readonly<Record<CanopyId, number>>): Bonus[] {
  return CANOPY_LIST.flatMap((c) => (levels[c.id] > 0 ? c.bonuses(levels[c.id]) : []));
}

/** Levels reached over the whole canopy. */
export function canopyLevels(state: Pick<GameState, 'canopy'>): number {
  return CANOPY_IDS.reduce((sum, id) => sum + state.canopy.levels[id], 0);
}

/** Every canopy talent at its last level. */
export function isCanopyComplete(state: Pick<GameState, 'canopy'>): boolean {
  return CANOPY_LIST.every((c) => state.canopy.levels[c.id] >= c.maxLevel);
}

/** Seeds spent in the whole tree, talents and canopy. */
export function treeSeedsSpent(state: Pick<GameState, 'talents' | 'canopy'>): number {
  return seedsSpent(state.talents) + canopySeedsSpent(state.canopy.levels);
}

/**
 * Seeds left to spend in the tree. The +5% bonus still counts every Seed obtained. The talents
 * and canopy levels learnt before a Cycle of water (§7.4) are rooted: their Seeds are not asked
 * for again.
 */
export function availableSeeds(state: GameState): number {
  return Math.max(0, state.seeds + state.rootedSeeds - treeSeedsSpent(state));
}

export function hasTalent(state: GameState, id: TalentId): boolean {
  return state.talents.includes(id);
}

/** A talent's parent, or the parent's twin, is learnt (a fork's two talents both lead on). */
function hasParent(talents: readonly TalentId[], id: TalentId): boolean {
  const { parent } = TALENTS[id];
  if (parent === undefined) return true;
  const twin = twinOf(parent);
  return talents.includes(parent) || (twin !== undefined && talents.includes(twin));
}

/** A talent learnt excludes its twin (FORKS). */
function isExcluded(talents: readonly TalentId[], id: TalentId): boolean {
  const twin = twinOf(id);
  return twin !== undefined && talents.includes(twin);
}

/** The twin of a learnt talent is learnt instead: it cannot be learnt beside it. */
export function isTalentExcluded(state: GameState, id: TalentId): boolean {
  return isExcluded(state.talents, id);
}

/** A talent can be learnt once its parent is: the next ring of the tree. */
export function isTalentReachable(state: GameState, id: TalentId): boolean {
  return !hasTalent(state, id) && !isTalentExcluded(state, id) && hasParent(state.talents, id);
}

export function canLearnTalent(state: GameState, id: TalentId): boolean {
  return isTalentReachable(state, id) && availableSeeds(state) >= TALENTS[id].cost;
}

/** Player action: learn a talent of the Tree of Seasons, kept in every later Season. */
export function learnTalent(state: GameState, id: TalentId): GameState {
  if (!canLearnTalent(state, id)) return state;
  return { ...state, talents: [...state.talents, id] };
}

/** Player action: learn a fork's other talent instead of the learnt one, once per Cycle. */
export function swapTalent(state: GameState, id: TalentId): GameState {
  if (!canSwapTalent(state, id)) return state;
  const fork = forkOf(id)!;
  const twin = twinOf(id)!;
  return {
    ...state,
    talents: state.talents.map((learnt) => (learnt === twin ? id : learnt)),
    talentSwaps: { ...state.talentSwaps, [fork]: state.cycles },
  };
}

/** The twin of `id` is learnt and its fork was not swapped in this Cycle yet. */
export function canSwapTalent(state: GameState, id: TalentId): boolean {
  const fork = forkOf(id);
  return fork !== undefined && isTalentExcluded(state, id) && !isForkSwapped(state, fork);
}

/** The fork was swapped in this Cycle: it waits for the next Cycle of water. */
export function isForkSwapped(state: GameState, fork: ForkId): boolean {
  return state.talentSwaps[fork] === state.cycles;
}

/** The canopy opens once the whole tree is learnt (one talent per fork), and stays open. */
export function isCanopyOpen(state: { talents: readonly TalentId[] }): boolean {
  return state.talents.length >= TREE_SIZE;
}

/** Seeds asked for the next level of a canopy talent; null at its last level. */
export function nextCanopyCost(state: GameState, id: CanopyId): number | null {
  const level = state.canopy.levels[id];
  return level >= CANOPY[id].maxLevel ? null : canopyLevelCost(id, level);
}

export function canRaiseCanopy(state: GameState, id: CanopyId): boolean {
  const cost = nextCanopyCost(state, id);
  return isCanopyOpen(state) && cost !== null && availableSeeds(state) >= cost;
}

/** Player action: sow one more level of a canopy talent, kept in every later Season and Cycle. */
export function raiseCanopy(state: GameState, id: CanopyId): GameState {
  if (!canRaiseCanopy(state, id)) return state;
  const { levels } = state.canopy;
  return { ...state, canopy: { ...state.canopy, levels: { ...levels, [id]: levels[id] + 1 } } };
}

/** Player action: the factor the sower waits for, or 0 to switch it off. */
export function setSowerFactor(state: GameState, factor: number): GameState {
  if (factor !== 0 && !(SOWER_FACTORS as readonly number[]).includes(factor)) return state;
  return { ...state, canopy: { ...state.canopy, sowerFactor: factor } };
}

/** The sower works once sown and switched on. */
export function isSowerWorking(state: GameState): boolean {
  return state.canopy.levels.sower > 0 && state.canopy.sowerFactor > 0;
}

/**
 * Keep only canopy levels a save can legitimately hold: within each talent's levels, with the
 * whole tree learnt, and paid for by the Seeds left after the talents.
 */
export function validCanopyLevels(
  raw: unknown,
  talents: readonly TalentId[],
  seeds: number,
): Record<CanopyId, number> {
  const levels = createCanopyState().levels;
  if (typeof raw !== 'object' || raw === null || !isCanopyOpen({ talents })) return levels;
  const data = raw as Record<string, unknown>;
  for (const id of CANOPY_IDS) {
    const value = data[id];
    if (Number.isInteger(value) && (value as number) > 0) {
      levels[id] = Math.min(value as number, CANOPY[id].maxLevel);
    }
  }
  return canopySeedsSpent(levels) + seedsSpent(talents) <= seeds
    ? levels
    : createCanopyState().levels;
}

/**
 * Keep only talents a save can legitimately hold: known, learnt after their parent, not beside
 * their twin, and paid for by the Seeds obtained.
 */
export function validTalents(ids: readonly unknown[], seeds: number): TalentId[] {
  const kept: TalentId[] = [];
  let spent = 0;
  for (const id of ids) {
    if (!isTalentId(id) || kept.includes(id)) continue;
    const { cost } = TALENTS[id];
    if (!hasParent(kept, id) || isExcluded(kept, id)) continue;
    if (spent + cost > seeds) continue;
    kept.push(id);
    spent += cost;
  }
  return kept;
}

/** Keep only fork swaps a save can hold: the Cycle of each fork's last swap. */
export function validTalentSwaps(raw: unknown): Partial<Record<ForkId, number>> {
  const swaps: Partial<Record<ForkId, number>> = {};
  if (typeof raw !== 'object' || raw === null) return swaps;
  for (const fork of FORK_IDS) {
    const cycle = (raw as Record<string, unknown>)[fork];
    if (Number.isInteger(cycle) && (cycle as number) >= 0) swaps[fork] = cycle as number;
  }
  return swaps;
}

/** Something in the tree can be sown now: a talent, or a level of the canopy. */
export function canSowInTree(state: GameState): boolean {
  return (
    TALENT_LIST.some((talent) => canLearnTalent(state, talent.id)) ||
    CANOPY_IDS.some((id) => canRaiseCanopy(state, id))
  );
}
