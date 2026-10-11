// Prestige: the Seasons (docs/game-design.md §7). Pure formulas and the new Season transition.
import { LATE_HARVEST_SEEDS, unlockAchievement, unlockAchievements } from './achievements';
import { keptGeneratorShare } from './bonuses';
import { generatorLimit, offeredChallenges, type ChallengeId } from './challenges';
import { GENERATOR_IDS } from './generators';
import { startCurve } from './history';
import { createInitialState, type GameState } from './state';
import { isSowerWorking } from './talents';

/** §7.4: each Source makes every Seed worth one point more. Here so cycles.ts can import this module. */
export const SOURCE_SEED_BONUS = 0.01;

/**
 * §7: Seeds earned in total = floor(sqrt(Light earned over all Seasons of the Cycle /
 * SEED_LIGHT_DIVISOR)) up to DEEP_SOIL_SEEDS, then a cube root (the soil deepens). Before the
 * first Cycle of water (§7.4), that is all the Light ever earned.
 */
export const SEED_LIGHT_DIVISOR = 2e7;
/** §7: each Seed owned adds +5% to global production (additive). */
export const SEED_BONUS = 0.05;
/** §7: the interface advises waiting for this many Seeds before the first Season. */
export const ADVISED_FIRST_SEASON_SEEDS = 10;
/**
 * §7 "Le sol s'approfondit": past this many Seeds in the Cycle, doubling the Seeds asks for 8
 * times the Light instead of 4.
 */
export const DEEP_SOIL_SEEDS = 100;
/** Light of the Cycle that deserves DEEP_SOIL_SEEDS: 2e11. */
const DEEP_SOIL_LIGHT = DEEP_SOIL_SEEDS * DEEP_SOIL_SEEDS * SEED_LIGHT_DIVISOR;
/** §7 "Les Graines mûrissent": a Season gives its Seeds once it has lasted this long. */
export const SEED_RIPENING_SECONDS = 15 * 60;

/** Light earned over the Seasons of the current Cycle of water (§7.4). */
export function cycleLight(state: GameState): number {
  return state.allTimeLight - state.lightBeforeCycle;
}

/** Seeds deserved by the Light earned in the Cycle. */
export function seedsForLight(cycleLight: number): number {
  const light = Math.max(0, cycleLight);
  if (light <= DEEP_SOIL_LIGHT) return Math.floor(Math.sqrt(light / SEED_LIGHT_DIVISOR));
  // The epsilon keeps lightForSeeds(n) worth exactly n Seeds despite rounding in the cube root.
  return Math.floor(DEEP_SOIL_SEEDS * Math.cbrt(light / DEEP_SOIL_LIGHT) + 1e-9);
}

/** Light of the Cycle needed to deserve `seeds` Seeds in total. */
export function lightForSeeds(seeds: number): number {
  if (seeds <= DEEP_SOIL_SEEDS) return seeds * seeds * SEED_LIGHT_DIVISOR;
  return DEEP_SOIL_LIGHT * (seeds / DEEP_SOIL_SEEDS) ** 3;
}

/** Share of the ripening time the Season has lasted, from 0 to 1 (§7). */
export function seasonRipeness(state: GameState): number {
  return Math.min(1, state.seasonSeconds / SEED_RIPENING_SECONDS);
}

/** The Seeds of the Season are ripe: a new Season can harvest them (§7). */
export function areSeedsRipe(state: GameState): boolean {
  return state.seasonSeconds >= SEED_RIPENING_SECONDS;
}

/** Seconds of Season left before its Seeds are ripe. */
export function secondsToRipeness(state: GameState): number {
  return Math.max(0, SEED_RIPENING_SECONDS - state.seasonSeconds);
}

/** Seeds the Light of the Cycle adds to the ones already obtained, ripe or not. */
export function seedsGrowing(state: GameState): number {
  return Math.max(0, seedsForLight(cycleLight(state)) - state.seeds);
}

/** Seeds a new Season would add to the ones already obtained: none until they are ripe. */
export function seedsToGain(state: GameState): number {
  return areSeedsRipe(state) ? seedsGrowing(state) : 0;
}

/** Light of the Cycle still missing before one more Seed would be gained. */
export function lightToNextSeed(state: GameState): number {
  const next = Math.max(state.seeds, seedsForLight(cycleLight(state))) + 1;
  return Math.max(0, lightForSeeds(next) - cycleLight(state));
}

/**
 * Additive production bonus from the Seeds owned: +5% each, one point more per Source of the
 * Cycle of water (§7.4).
 */
export function seedBonus(seeds: number, sources = 0): number {
  return seeds * (SEED_BONUS + SOURCE_SEED_BONUS * sources);
}

/** A new Season is possible as soon as it would bring at least one ripe Seed (§7). */
export function canStartNewSeason(state: GameState): boolean {
  return seedsToGain(state) >= 1;
}

/**
 * §7 advice, never a block: before the first Season, the interface suggests waiting for
 * ADVISED_FIRST_SEASON_SEEDS ("La terre n'est pas encore prête").
 */
export function isSeasonPremature(state: GameState): boolean {
  return state.seasons === 0 && seedsGrowing(state) < ADVISED_FIRST_SEASON_SEEDS;
}

/** The Seasons screen appears once prestige is available, and stays once a Season is done. */
export function isSeasonsScreenUnlocked(state: GameState): boolean {
  return state.seasons > 0 || state.seeds > 0 || seedsGrowing(state) >= 1;
}

/**
 * Replant the neighbourhood: Light, generators, upgrades, projects, the Season total and running
 * butterfly effects start over; `kept` of each generator stays (the Boutures talent, §7.1), within
 * the limits of `challenge`. Everything else carries over; the callers adjust the prestige layers.
 */
export function replant(state: GameState, challenge: ChallengeId | null, kept: number): GameState {
  const fresh = createInitialState(state.lastUpdate);
  const generators = { ...fresh.generators };
  for (const id of GENERATOR_IDS) {
    generators[id] = Math.min(
      Math.floor(state.generators[id] * kept),
      generatorLimit({ challenge }, id),
    );
  }
  return {
    ...state,
    resources: { ...state.resources, light: 0 },
    generators,
    upgrades: [],
    totalLight: 0,
    seasonSeconds: 0,
    idleSeconds: 0,
    projects: [],
    challenge,
    butterfly: { nextIn: state.butterfly.nextIn || fresh.butterfly.nextIn, visible: 0 },
    effects: [],
    history: startCurve(state.history, state.seasons + 2),
  };
}

/**
 * Player action: start a new Season (§7), optionally as a challenge Season (§7.3). Resets Light,
 * generators, upgrades, projects, the Season total and running butterfly effects; keeps Seeds
 * (plus the ones gained), Milestones, restored parcels, the Tree of Seasons and its Cooperatives,
 * challenges won, the Herbier, the Bioregion (§7.4), all-time statistics, options and the clock.
 * With the Boutures talent, a share of each generator is kept too (§7.1), within the challenge's
 * limits. Returns the same state when no ripe Seed would be gained or the challenge is not offered.
 */
export function startNewSeason(state: GameState, challenge: ChallengeId | null = null): GameState {
  if (!canStartNewSeason(state)) return state;
  if (challenge && !offeredChallenges(state).some((c) => c.id === challenge)) return state;
  let next: GameState = {
    ...replant(state, challenge, keptGeneratorShare(state)),
    seeds: state.seeds + seedsToGain(state),
    seasons: state.seasons + 1,
  };
  // Hidden Milestone (§9.3): sowing before the soil is ready.
  if (isSeasonPremature(state)) next = unlockAchievement(next, 'earlySowing');
  // Milestone "Moisson tardive": a single Season that brings many Seeds at once.
  if (seedsToGain(state) >= LATE_HARVEST_SEEDS) next = unlockAchievement(next, 'lateHarvest');
  return unlockAchievements(next);
}

/**
 * The sower (§7.1, Canopy) relaunches a free Season once its ripe Seeds bring the Seeds owned to
 * `sowerFactor` times as many; it never interrupts a challenge Season still running.
 */
export function isSowerReady(state: GameState): boolean {
  if (!isSowerWorking(state) || state.challenge !== null || !canStartNewSeason(state)) {
    return false;
  }
  return state.seeds + seedsToGain(state) >= state.seeds * state.canopy.sowerFactor;
}

/** Let the sower start the next Season when it is ready. Called by every tick. */
export function runSower(state: GameState): GameState {
  if (!isSowerReady(state)) return state;
  const next = startNewSeason(state);
  return unlockAchievements({
    ...next,
    canopy: { ...next.canopy, sowerSeasons: next.canopy.sowerSeasons + 1 },
  });
}
