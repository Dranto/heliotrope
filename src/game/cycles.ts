// The Cycle of water (docs/game-design.md §7.4): the second prestige, above the Seasons. It
// turns the Water gathered into Sources, a permanent bonus, and starts the bioregion over:
// Seeds, Water, collectors and sites go back to zero, while the Tree of Seasons keeps its talents.
import { FLOOD_TIDE_SOURCES, unlockAchievement, unlockAchievements } from './achievements';
import { COLLECTOR_IDS, SITE_IDS } from './bioregion';
import { replant } from './seasons';
import { seedsSpent } from './talents';
import type { GameState } from './state';

export { SOURCE_SEED_BONUS } from './seasons';

/** §7.4: Sources earned in total = floor(sqrt(Water gathered over all Cycles / divisor)). */
export const SOURCE_WATER_DIVISOR = 4e5;
/** §7.4: each Source adds +10% to global production (its own multiplier). */
export const SOURCE_BONUS = 0.1;
/** §7.4: the interface advises waiting for this many Sources before the first Cycle. */
export const ADVISED_FIRST_CYCLE_SOURCES = 5;

export function sourcesForWater(allTimeWater: number): number {
  return Math.floor(Math.sqrt(Math.max(0, allTimeWater) / SOURCE_WATER_DIVISOR));
}

export function waterForSources(sources: number): number {
  return sources * sources * SOURCE_WATER_DIVISOR;
}

/** Sources a new Cycle would add to the ones already obtained. */
export function sourcesToGain(state: GameState): number {
  return Math.max(0, sourcesForWater(state.allTimeWater) - state.sources);
}

/** All-time Water still missing before one more Source would be gained. */
export function waterToNextSource(state: GameState): number {
  const next = Math.max(state.sources, sourcesForWater(state.allTimeWater)) + 1;
  return Math.max(0, waterForSources(next) - state.allTimeWater);
}

/** Additive production bonus of the Sources owned: +10% each. */
export function sourceBonus(sources: number): number {
  return sources * SOURCE_BONUS;
}

export function canStartNewCycle(state: GameState): boolean {
  return sourcesToGain(state) >= 1;
}

/** Advice, never a block: the first Cycle is best started with ADVISED_FIRST_CYCLE_SOURCES. */
export function isCyclePremature(state: GameState): boolean {
  return state.cycles === 0 && sourcesToGain(state) < ADVISED_FIRST_CYCLE_SOURCES;
}

/** The Cycle screen appears once a Source is in reach, and stays after the first Cycle. */
export function isCycleScreenUnlocked(state: GameState): boolean {
  return state.cycles > 0 || state.sources > 0 || canStartNewCycle(state);
}

/**
 * Player action: start a new Cycle of water (§7.4). Everything a new Season resets is reset
 * (§7), and so are the Seeds (the Light of the Cycle starts over), the Water, the collectors and
 * the sites, and a running challenge. The Sources gained are added; the talents of the Tree of
 * Seasons stay learnt, their Seeds rooted so the tree is not paid for twice. Milestones,
 * parcels, the Herbier, challenges won, the Seasons count and the Cooperatives' settings stay.
 * Returns the same state when no Source would be gained.
 */
export function startNewCycle(state: GameState): GameState {
  if (!canStartNewCycle(state)) return state;
  const sources = state.sources + sourcesToGain(state);
  // The whole neighbourhood is replanted, without the Boutures; the next Season begins.
  const replanted = replant(state, null, 0);
  const next: GameState = {
    ...replanted,
    seasons: state.seasons + 1,
    seeds: 0,
    rootedSeeds: seedsSpent(state.talents),
    lightBeforeCycle: state.allTimeLight,
    resources: { light: 0, water: 0 },
    collectors: Object.fromEntries(COLLECTOR_IDS.map((id) => [id, 0])) as GameState['collectors'],
    sites: Object.fromEntries(SITE_IDS.map((id) => [id, 0])) as GameState['sites'],
    waterBeforeCycle: state.allTimeWater,
    sources,
    cycles: state.cycles + 1,
  };
  // Hidden Milestone "Grandes eaux": a single Cycle that brings many Sources at once.
  const flooded =
    sourcesToGain(state) >= FLOOD_TIDE_SOURCES ? unlockAchievement(next, 'floodTide') : next;
  return unlockAchievements(flooded);
}
