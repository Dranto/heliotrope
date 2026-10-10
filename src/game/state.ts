import type { AchievementId } from './achievements';
import type { ActiveEffect } from './effects';
import type { Notation } from './format';
import { GENERATOR_IDS, type GeneratorId } from './generators';
import { nextRandom, seedFrom } from './random';
import { RESOURCE_IDS, type ResourceId } from './resources';
import type { UpgradeId } from './upgrades';

/** Bump when the shape of GameState changes, and add a migration in save.ts. */
export const STATE_VERSION = 6;

/** §9.2: the Golden Butterfly flies by every 3 to 8 minutes. */
export const BUTTERFLY_MIN_INTERVAL = 3 * 60;
export const BUTTERFLY_MAX_INTERVAL = 8 * 60;

export interface ButterflyState {
  /** Seconds of play before the next butterfly appears. */
  nextIn: number;
  /** Seconds left to catch the butterfly on screen; 0 when there is none. */
  visible: number;
}

export interface Settings {
  /** §8: short suffixes ("1,23 M") or scientific notation everywhere ("1,23e6"). */
  notation: Notation;
  /** §10.4: slow or stop decorative animations, on top of prefers-reduced-motion. */
  reducedMotion: boolean;
}

export interface GameState {
  version: number;
  /** Amount of each resource in reserve. */
  resources: Record<ResourceId, number>;
  /** Units owned of each generator. */
  generators: Record<GeneratorId, number>;
  /** Upgrades bought this Season, in purchase order. */
  upgrades: UpgradeId[];
  /** Light earned during the current Season (clicks + production), never decreased by spending. */
  totalLight: number;
  /** Light earned over every Season, the current one included (§7 Seeds formula). */
  allTimeLight: number;
  /** Heliotrope Seeds obtained over all Seasons (§7): each adds +5% to production. */
  seeds: number;
  /** Seasons completed, i.e. how many times the player started a new Season. */
  seasons: number;
  /** Number of clicks on the heliotrope, over all Seasons. */
  clicks: number;
  /** Seconds of play over all Seasons, offline progress included. */
  playSeconds: number;
  /** Seconds of play in the current Season, offline progress included. */
  seasonSeconds: number;
  /** Seconds since the last purchase this Season (hidden Milestone, §9.3). */
  idleSeconds: number;
  /** Milestones unlocked over all Seasons, in unlock order (§9.3): each adds +1% production. */
  achievements: AchievementId[];
  /** Golden Butterflies caught over all Seasons (§9.2). */
  butterflies: number;
  butterfly: ButterflyState;
  /** Golden Butterfly effects running now. */
  effects: ActiveEffect[];
  /** Seed of the pseudo-random generator used by random events. */
  rngSeed: number;
  settings: Settings;
  /** Epoch milliseconds of the last simulated moment. */
  lastUpdate: number;
}

function zeroes<K extends string>(ids: readonly K[]): Record<K, number> {
  return Object.fromEntries(ids.map((id) => [id, 0])) as Record<K, number>;
}

/** Seconds until the next butterfly, drawn uniformly in the §9.2 interval. */
export function butterflyDelay(random: number): number {
  return BUTTERFLY_MIN_INTERVAL + random * (BUTTERFLY_MAX_INTERVAL - BUTTERFLY_MIN_INTERVAL);
}

export const DEFAULT_SETTINGS: Settings = { notation: 'short', reducedMotion: false };

export function createInitialState(now: number): GameState {
  const [random, rngSeed] = nextRandom(seedFrom(now));
  return {
    version: STATE_VERSION,
    resources: zeroes(RESOURCE_IDS),
    generators: zeroes(GENERATOR_IDS),
    upgrades: [],
    totalLight: 0,
    allTimeLight: 0,
    seeds: 0,
    seasons: 0,
    clicks: 0,
    playSeconds: 0,
    seasonSeconds: 0,
    idleSeconds: 0,
    achievements: [],
    butterflies: 0,
    butterfly: { nextIn: butterflyDelay(random), visible: 0 },
    effects: [],
    rngSeed,
    settings: DEFAULT_SETTINGS,
    lastUpdate: now,
  };
}
