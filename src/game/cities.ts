// The sister cities (docs/game-design.md §7.6, M23), the third layer of prestige. Once the delta
// is fully open and enough Sources were earned in the city, the player can swarm: found a sister
// city elsewhere in the region, in one of three landscapes. The Seasons, the Bioregion and the
// Cycles start again; the Herbier, the Milestones, the decor, the garden, the delta and the cities already founded stay. Savoirs are earned from the Sources of
// the city and the Seeds of the Cycle, and spent in a workshop that changes the rules.
import { unlockAchievements } from './achievements';
import { COLLECTOR_IDS, raiseSite, SITE_IDS, canRaiseSite, siteCost } from './bioregion';
import {
  isCityKind,
  isLandscapeId,
  isWorkshopId,
  nextWorkshopCost,
  WORKSHOP_COSTS,
  WORKSHOP_IDS,
  workshopLevel,
  type CityKind,
  type LandscapeId,
  type Workshop,
  type WorkshopId,
} from './cityData';
import { availableSources, deltaSourcesSpent, isDeltaComplete } from './delta';
import { replant } from './seasons';
import type { GameState } from './state';
import { createCanopyState } from './talents';

export {
  LANDSCAPE_IDS,
  LANDSCAPES,
  nextWorkshopCost,
  WORKSHOP_COSTS,
  WORKSHOP_IDS,
  workshopLevel,
  type CityKind,
  type LandscapeId,
  type WorkshopId,
} from './cityData';

/** Sources a city must have earned before the player can swarm from it. */
export const SWARM_SOURCES = 25;
/** Share of the unspent Sources a new city keeps per level of the workshop's memory. */
export const MEMORY_SOURCES = 0.25;
/** Share of each water collector a new city keeps per level of the workshop's wells. */
export const WELLS_SHARE = 1 / 3;
/** The builders raise at most this many site levels per tick. */
export const BUILDS_PER_TICK = 3;

export interface CityState {
  /** The landscape of the city lived in; null for the home city. */
  landscape: LandscapeId | null;
  /** The cities left behind, in order: they make up the network. */
  founded: CityKind[];
  /** Savoirs left to spend in the workshop. */
  savoirs: number;
  /** Savoirs ever earned: each adds to production. */
  earned: number;
  /** The level of each rule learnt in the workshop. */
  workshop: Workshop;
  /** Sources the city started with, and the all-time Water when it was founded. */
  sourcesBase: number;
  waterBase: number;
}

export function createCityState(): CityState {
  return {
    landscape: null,
    founded: [],
    savoirs: 0,
    earned: 0,
    workshop: {},
    sourcesBase: 0,
    waterBase: 0,
  };
}

/** Sources earned in the city lived in. */
export function citySources(state: Pick<GameState, 'sources' | 'city'>): number {
  return Math.max(0, state.sources - state.city.sourcesBase);
}

/** Savoirs a swarm would bring: from the Sources of the city, and the Seeds of the Cycle. */
export function savoirsToGain(state: GameState): number {
  return Math.floor(Math.sqrt(citySources(state)) / 2) + Math.floor(Math.log10(1 + state.seeds));
}

/** The sister cities show once the delta is fully open, and stay once a city is founded. */
export function areCitiesOpen(state: GameState): boolean {
  return isDeltaComplete(state) || state.city.founded.length > 0;
}

export function canSwarm(state: GameState): boolean {
  return (
    areCitiesOpen(state) &&
    citySources(state) >= SWARM_SOURCES &&
    state.challenge === null &&
    state.cycleChallenge === null
  );
}

/**
 * Player action: found a sister city of a landscape. Light, generators, upgrades, projects,
 * Seeds, the Bioregion's Water, collectors and sites start again, and so do the Tree of Seasons
 * and its Canopy (unless the workshop's seedlings keep them). The Sources spent in the delta
 * stay with it; the unspent ones are lost (a quarter kept with the workshop's memory), and the
 * new Sources come from the Water of the new city.
 */
export function swarm(state: GameState, landscape: LandscapeId): GameState {
  if (!canSwarm(state) || !isLandscapeId(landscape)) return state;
  const gain = savoirsToGain(state);
  const { city } = state;
  const spent = deltaSourcesSpent(state.delta.levels, state.delta.widths);
  const remembered = Math.floor(
    availableSources(state) * MEMORY_SOURCES * workshopLevel(city.workshop, 'memory'),
  );
  const sources = spent + remembered;
  const keepTree = workshopLevel(city.workshop, 'seedlings') > 0;
  const kept = WELLS_SHARE * workshopLevel(city.workshop, 'wells');
  const replanted = replant(state, null, 0);
  const next: GameState = {
    ...replanted,
    seasons: state.seasons + 1,
    cycles: state.cycles + 1,
    seeds: 0,
    rootedSeeds: keepTree ? state.rootedSeeds : 0,
    talents: keepTree ? state.talents : [],
    canopy: keepTree ? state.canopy : { ...createCanopyState(), sowerFactor: 0 },
    resources: { light: 0, water: 0 },
    collectors: Object.fromEntries(
      COLLECTOR_IDS.map((id) => [id, Math.floor(state.collectors[id] * kept)]),
    ) as GameState['collectors'],
    sites: Object.fromEntries(SITE_IDS.map((id) => [id, 0])) as GameState['sites'],
    cycleChallenge: null,
    lightBeforeCycle: state.allTimeLight,
    waterBeforeCycle: state.allTimeWater,
    sources,
    city: {
      ...city,
      landscape,
      founded: [...city.founded, city.landscape ?? 'home'],
      savoirs: city.savoirs + gain,
      earned: city.earned + gain,
      sourcesBase: sources,
      waterBase: state.allTimeWater,
    },
  };
  return unlockAchievements(next);
}

export function canBuyWorkshop(state: GameState, id: WorkshopId): boolean {
  const cost = nextWorkshopCost(state.city.workshop, id);
  return areCitiesOpen(state) && cost !== null && state.city.savoirs >= cost;
}

/** Player action: learn the next level of a rule of the workshop, for every city to come. */
export function buyWorkshop(state: GameState, id: WorkshopId): GameState {
  if (!canBuyWorkshop(state, id)) return state;
  const { workshop } = state.city;
  return {
    ...state,
    city: {
      ...state.city,
      savoirs: state.city.savoirs - nextWorkshopCost(workshop, id)!,
      workshop: { ...workshop, [id]: workshopLevel(workshop, id) + 1 },
    },
  };
}

/**
 * The workshop's builders raise the Bioregion's sites on their own, cheapest first, when the
 * Water allows. Called by every tick; returns the same state when nothing is built.
 */
export function runBuilders(state: GameState): GameState {
  if (workshopLevel(state.city.workshop, 'builders') === 0) return state;
  let next = state;
  for (let i = 0; i < BUILDS_PER_TICK; i++) {
    const affordable = SITE_IDS.filter((id) => canRaiseSite(next, id));
    if (affordable.length === 0) break;
    const cheapest = affordable.reduce((a, b) => (siteCost(next, a) <= siteCost(next, b) ? a : b));
    // Kept as the player's purchase would, except for the time since the last one.
    next = { ...raiseSite(next, cheapest), idleSeconds: next.idleSeconds };
  }
  return next;
}

/** Keep only what a save can hold. */
export function validCity(raw: unknown): CityState {
  const city = createCityState();
  if (typeof raw !== 'object' || raw === null) return city;
  const data = raw as Record<string, unknown>;
  const count = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  if (isLandscapeId(data.landscape)) city.landscape = data.landscape;
  if (Array.isArray(data.founded)) city.founded = data.founded.filter(isCityKind);
  if (Array.isArray(data.workshop)) {
    // Before M30 (save v30), the rules were learnt once: each counts as its first level.
    for (const id of data.workshop.filter(isWorkshopId)) city.workshop[id] = 1;
  } else if (typeof data.workshop === 'object' && data.workshop !== null) {
    for (const id of WORKSHOP_IDS) {
      const level = count((data.workshop as Record<string, unknown>)[id]);
      if (level > 0) city.workshop[id] = Math.min(level, WORKSHOP_COSTS[id].length);
    }
  }
  city.savoirs = count(data.savoirs);
  city.earned = Math.max(count(data.earned), city.savoirs);
  city.sourcesBase = count(data.sourcesBase);
  city.waterBase = typeof data.waterBase === 'number' && data.waterBase >= 0 ? data.waterBase : 0;
  return city;
}
