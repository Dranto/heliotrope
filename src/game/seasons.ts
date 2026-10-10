// Prestige: the Seasons (docs/game-design.md §7). Pure formulas and the new Season transition.
import { unlockAchievement, unlockAchievements } from './achievements';
import { keptGeneratorShare } from './bonuses';
import { GENERATOR_IDS } from './generators';
import { createInitialState, type GameState } from './state';

/** §7: Seeds earned in total = floor(sqrt(Light earned over all Seasons / SEED_LIGHT_DIVISOR)). */
export const SEED_LIGHT_DIVISOR = 2e7;
/** §7: each Seed owned adds +5% to global production (additive). */
export const SEED_BONUS = 0.05;
/** §7: the interface advises waiting for this many Seeds before the first Season. */
export const ADVISED_FIRST_SEASON_SEEDS = 10;

/** Seeds deserved by an all-time Light total. */
export function seedsForLight(allTimeLight: number): number {
  return Math.floor(Math.sqrt(Math.max(0, allTimeLight) / SEED_LIGHT_DIVISOR));
}

/** All-time Light needed to deserve `seeds` Seeds in total. */
export function lightForSeeds(seeds: number): number {
  return seeds * seeds * SEED_LIGHT_DIVISOR;
}

/** Seeds a new Season would add to the ones already obtained. */
export function seedsToGain(state: GameState): number {
  return Math.max(0, seedsForLight(state.allTimeLight) - state.seeds);
}

/** All-time Light still missing before one more Seed would be gained. */
export function lightToNextSeed(state: GameState): number {
  const next = Math.max(state.seeds, seedsForLight(state.allTimeLight)) + 1;
  return Math.max(0, lightForSeeds(next) - state.allTimeLight);
}

/** Additive production bonus from the Seeds owned: +5% each. */
export function seedBonus(seeds: number): number {
  return seeds * SEED_BONUS;
}

/** A new Season is possible as soon as it would bring at least one Seed (§7). */
export function canStartNewSeason(state: GameState): boolean {
  return seedsToGain(state) >= 1;
}

/**
 * §7 advice, never a block: before the first Season, the interface suggests waiting for
 * ADVISED_FIRST_SEASON_SEEDS ("La terre n'est pas encore prête").
 */
export function isSeasonPremature(state: GameState): boolean {
  return state.seasons === 0 && seedsToGain(state) < ADVISED_FIRST_SEASON_SEEDS;
}

/** The Seasons screen appears once prestige is available, and stays once a Season is done. */
export function isSeasonsScreenUnlocked(state: GameState): boolean {
  return state.seasons > 0 || state.seeds > 0 || canStartNewSeason(state);
}

/**
 * Player action: start a new Season (§7). Resets Light, generators, upgrades, projects, the
 * Season total and running butterfly effects; keeps Seeds (plus the ones gained), Milestones,
 * restored parcels, the Tree of Seasons and its Cooperatives, all-time statistics, options and
 * the clock. With the Boutures talent, a share of each generator is kept too (§7.1).
 * Returns the same state when no Seed would be gained.
 */
export function startNewSeason(state: GameState): GameState {
  if (!canStartNewSeason(state)) return state;
  const fresh = createInitialState(state.lastUpdate);
  const kept = keptGeneratorShare(state);
  const generators = { ...fresh.generators };
  for (const id of GENERATOR_IDS) generators[id] = Math.floor(state.generators[id] * kept);
  let next: GameState = {
    ...fresh,
    generators,
    allTimeLight: state.allTimeLight,
    seeds: state.seeds + seedsToGain(state),
    seasons: state.seasons + 1,
    clicks: state.clicks,
    playSeconds: state.playSeconds,
    achievements: state.achievements,
    parcels: state.parcels,
    talents: state.talents,
    cooperatives: state.cooperatives,
    butterflies: state.butterflies,
    butterfly: { nextIn: state.butterfly.nextIn || fresh.butterfly.nextIn, visible: 0 },
    rngSeed: state.rngSeed,
    settings: state.settings,
  };
  // Hidden Milestone (§9.3): sowing before the soil is ready.
  if (isSeasonPremature(state)) next = unlockAchievement(next, 'earlySowing');
  return unlockAchievements(next);
}
