// The Tree of Seasons (docs/game-design.md §7.1): permanent talents bought with Heliotrope Seeds.
// Spending Seeds never lowers their +5% bonus: the bonus counts every Seed obtained, the tree
// spends a separate balance (obtained − spent). Talents are kept across Seasons. Names live in
// src/i18n, the drawing of the tree in src/ui.
import type { Bonus } from './bonuses';
import type { CooperativeId } from './cooperatives';
import type { GameState } from './state';

export const TALENT_BRANCHES = ['roots', 'pollinators', 'memory'] as const;
/** Racines (production), Pollinisateurs (active play), Mémoire (comfort and automation). */
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
];

export const TALENTS = Object.fromEntries(TALENT_LIST.map((t) => [t.id, t])) as Record<
  TalentId,
  TalentDef
>;

export function isTalentId(value: unknown): value is TalentId {
  return typeof value === 'string' && Object.hasOwn(TALENTS, value);
}

/** Seeds spent in the tree. */
export function seedsSpent(talents: readonly TalentId[]): number {
  return talents.reduce((sum, id) => sum + TALENTS[id].cost, 0);
}

/** Seeds left to spend in the tree. The +5% bonus still counts every Seed obtained. */
export function availableSeeds(state: GameState): number {
  return Math.max(0, state.seeds - seedsSpent(state.talents));
}

export function hasTalent(state: GameState, id: TalentId): boolean {
  return state.talents.includes(id);
}

/** A talent can be learnt once its parent is: the next ring of the tree. */
export function isTalentReachable(state: GameState, id: TalentId): boolean {
  const { parent } = TALENTS[id];
  return !hasTalent(state, id) && (parent === undefined || hasTalent(state, parent));
}

export function canLearnTalent(state: GameState, id: TalentId): boolean {
  return isTalentReachable(state, id) && availableSeeds(state) >= TALENTS[id].cost;
}

/** Player action: learn a talent of the Tree of Seasons, kept in every later Season. */
export function learnTalent(state: GameState, id: TalentId): GameState {
  if (!canLearnTalent(state, id)) return state;
  return { ...state, talents: [...state.talents, id] };
}

/**
 * Keep only talents a save can legitimately hold: known, learnt after their parent, and paid
 * for by the Seeds obtained.
 */
export function validTalents(ids: readonly unknown[], seeds: number): TalentId[] {
  const kept: TalentId[] = [];
  let spent = 0;
  for (const id of ids) {
    if (!isTalentId(id) || kept.includes(id)) continue;
    const { parent, cost } = TALENTS[id];
    if (parent !== undefined && !kept.includes(parent)) continue;
    if (spent + cost > seeds) continue;
    kept.push(id);
    spent += cost;
  }
  return kept;
}
