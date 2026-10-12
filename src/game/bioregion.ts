// The Bioregion (docs/game-design.md §7.4): Water, the second resource, gathered by water
// collectors bought with Light, then spent on regional sites whose levels raise the
// neighbourhood's buildings. Collectors, sites and Water are kept from one Season to the next;
// only a new Cycle of water (cycles.ts) resets them. Names live in src/i18n, the art in src/ui.
import { isIntroduced } from './introductions';
import { bonusesOf } from './bonuses';
import {
  challengeCollectorCostFactor,
  challengeSiteCostFactor,
  challengeWaterFactor,
} from './cycleChallenges';
import { isArmOpen } from './delta';
import { effectFactor } from './effects';
import type { GeneratorId } from './generators';
import type { GameState } from './state';

/** The Bioregion opens at the start of the third Season (two Seasons completed). */
export const BIOREGION_FROM_SEASON = 2;

export const COLLECTOR_IDS = ['roofTanks', 'swales', 'ponds', 'streams'] as const;
export type CollectorId = (typeof COLLECTOR_IDS)[number];

export interface CollectorDef {
  id: CollectorId;
  /** Light cost of the first unit; each next one costs COLLECTOR_COST_GROWTH times more. */
  baseCost: number;
  /** Water per second of one unit, before multipliers. */
  baseWater: number;
  /** Building of the neighbourhood that feeds it: +COLLECTOR_LINK_BONUS per unit owned. */
  linked: GeneratorId;
}

/** Each collector costs four times the previous one: Water grows with time more than with Light. */
export const COLLECTOR_COST_GROWTH = 4;

/** Each unit of a collector's linked building adds 1% to its Water. */
export const COLLECTOR_LINK_BONUS = 0.01;

export const COLLECTORS: Record<CollectorId, CollectorDef> = {
  roofTanks: { id: 'roofTanks', baseCost: 1e6, baseWater: 1, linked: 'rooftopGarden' },
  swales: { id: 'swales', baseCost: 5e7, baseWater: 8, linked: 'pot' },
  ponds: { id: 'ponds', baseCost: 2e9, baseWater: 50, linked: 'greenhouse' },
  streams: { id: 'streams', baseCost: 1e11, baseWater: 400, linked: 'urbanCanopy' },
};

export const SITE_IDS = ['wetlands', 'meadows', 'foodForests', 'oldForest', 'hillsides'] as const;
export type SiteId = (typeof SITE_IDS)[number];

export interface SiteDef {
  id: SiteId;
  /** Water cost of the first level; each next level costs SITE_COST_GROWTH times more. */
  baseCost: number;
  /**
   * The two buildings of the neighbourhood each level raises by SITE_BONUS; none for the
   * hillsides, which raise the clicks and the visits instead (delta.ts).
   */
  buildings: readonly GeneratorId[];
}

/** Each level of a site adds +25% (additive per site) to the production of its two buildings. */
export const SITE_BONUS = 0.25;
export const SITE_COST_GROWTH = 2.5;

export const SITES: Record<SiteId, SiteDef> = {
  wetlands: { id: 'wetlands', baseCost: 60, buildings: ['pot', 'rooftopGarden'] },
  meadows: { id: 'meadows', baseCost: 600, buildings: ['balconyPanel', 'mirrorPlant'] },
  foodForests: { id: 'foodForests', baseCost: 6_000, buildings: ['greenhouse', 'verticalFarm'] },
  oldForest: { id: 'oldForest', baseCost: 60_000, buildings: ['urbanCanopy', 'arcology'] },
  // §7.5: vines and terraces, opened by the hills arm of the delta.
  hillsides: { id: 'hillsides', baseCost: 3_000, buildings: [] },
};

/** The four sites of the original Bioregion (Milestone "Bassin versant"). */
export const BASIN_SITE_IDS = ['wetlands', 'meadows', 'foodForests', 'oldForest'] as const;

/** §7.4: each Source of the Cycle of water adds +10% to the Water gathered (additive). */
export const SOURCE_WATER_BONUS = 0.1;

export function isCollectorId(value: unknown): value is CollectorId {
  return typeof value === 'string' && Object.hasOwn(COLLECTORS, value);
}

export function isSiteId(value: unknown): value is SiteId {
  return typeof value === 'string' && Object.hasOwn(SITES, value);
}

/** The Bioregion opens from the third Season and, once opened, stays open. */
export function isBioregionOpen(state: Pick<GameState, 'seasons' | 'cycles' | 'intro'>): boolean {
  return (
    isIntroduced(state, 'bioregion') && (state.seasons >= BIOREGION_FROM_SEASON || state.cycles > 0)
  );
}

/** Multiplier on every collector: Sources, then the Water bonuses of parcels and projects. */
export function waterMultiplier(state: GameState): number {
  const bonuses = bonusesOf(state, 'water').reduce((product, b) => product * b.factor, 1);
  // §9.6: the summer shower fills the collectors too.
  const shower = effectFactor(state.effects, 'shower');
  return (1 + SOURCE_WATER_BONUS * state.sources) * bonuses * shower * challengeWaterFactor(state);
}

/** Water per second of one more unit of a collector, with the multipliers in force. */
export function collectorUnitWater(state: GameState, id: CollectorId): number {
  const { baseWater, linked } = COLLECTORS[id];
  return baseWater * (1 + COLLECTOR_LINK_BONUS * state.generators[linked]) * waterMultiplier(state);
}

/** Water per second of every unit of one collector. */
export function collectorWater(state: GameState, id: CollectorId): number {
  const owned = state.collectors[id];
  return owned === 0 ? 0 : owned * collectorUnitWater(state, id);
}

/** Total Water per second. */
export function waterPerSecond(state: GameState): number {
  if (!isBioregionOpen(state)) return 0;
  return COLLECTOR_IDS.reduce((sum, id) => sum + collectorWater(state, id), 0);
}

/** Light cost of the next unit of a collector. */
export function collectorCost(state: GameState, id: CollectorId): number {
  return (
    COLLECTORS[id].baseCost *
    COLLECTOR_COST_GROWTH ** state.collectors[id] *
    challengeCollectorCostFactor(state)
  );
}

/** Water cost of the next level of a site. */
export function siteCost(state: GameState, id: SiteId): number {
  return SITES[id].baseCost * SITE_COST_GROWTH ** state.sites[id] * challengeSiteCostFactor(state);
}

/**
 * Production factor the sites give one building: ×(1 + SITE_BONUS × level) for each site that
 * raises it.
 */
export function siteFactor(state: Pick<GameState, 'sites'>, generator: GeneratorId): number {
  let factor = 1;
  for (const id of SITE_IDS) {
    if (SITES[id].buildings.includes(generator)) factor *= 1 + SITE_BONUS * state.sites[id];
  }
  return factor;
}

/**
 * A collector is shown once the Season has earned half its first price, like the buildings;
 * owning one keeps it shown.
 */
export function isCollectorRevealed(state: GameState, id: CollectorId): boolean {
  return state.collectors[id] > 0 || state.totalLight >= COLLECTORS[id].baseCost / 2;
}

/** Every site but the hillsides, which wait for the hills arm of the delta (§7.5). */
export function isSiteOffered(state: Pick<GameState, 'delta'>, id: SiteId): boolean {
  return id !== 'hillsides' || isArmOpen(state, 'hillsArm');
}

/** A site is shown once half its first level's Water has been gathered in the Cycle. */
export function isSiteRevealed(state: GameState, id: SiteId): boolean {
  if (!isSiteOffered(state, id)) return false;
  return state.sites[id] > 0 || cycleWater(state) >= SITES[id].baseCost / 2;
}

export function canBuyCollector(state: GameState, id: CollectorId): boolean {
  return isBioregionOpen(state) && state.resources.light >= collectorCost(state, id);
}

/** Player action: build one water collector with Light. Kept until the next Cycle. */
export function buyCollector(state: GameState, id: CollectorId): GameState {
  if (!canBuyCollector(state, id)) return state;
  return {
    ...state,
    resources: {
      ...state.resources,
      light: Math.max(0, state.resources.light - collectorCost(state, id)),
    },
    collectors: { ...state.collectors, [id]: state.collectors[id] + 1 },
    idleSeconds: 0,
  };
}

export function canRaiseSite(state: GameState, id: SiteId): boolean {
  return (
    isBioregionOpen(state) &&
    isSiteOffered(state, id) &&
    state.resources.water >= siteCost(state, id)
  );
}

/** Player action: raise a regional site one level with Water. Kept until the next Cycle. */
export function raiseSite(state: GameState, id: SiteId): GameState {
  if (!canRaiseSite(state, id)) return state;
  return {
    ...state,
    resources: {
      ...state.resources,
      water: Math.max(0, state.resources.water - siteCost(state, id)),
    },
    sites: { ...state.sites, [id]: state.sites[id] + 1 },
    idleSeconds: 0,
  };
}

/** Water gathered in the current Cycle. */
export function cycleWater(state: GameState): number {
  return state.allTimeWater - state.waterBeforeCycle;
}

/** Add Water to the reserve and to the all-time total. */
export function earnWater(state: GameState, amount: number): GameState {
  if (amount <= 0) return state;
  return {
    ...state,
    resources: { ...state.resources, water: state.resources.water + amount },
    allTimeWater: state.allTimeWater + amount,
  };
}

/** Total units of every collector. */
export function collectorsOwned(state: Pick<GameState, 'collectors'>): number {
  return COLLECTOR_IDS.reduce((sum, id) => sum + state.collectors[id], 0);
}

/** Total levels of every site. */
export function siteLevels(state: Pick<GameState, 'sites'>): number {
  return SITE_IDS.reduce((sum, id) => sum + state.sites[id], 0);
}
