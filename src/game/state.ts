import { GENERATOR_IDS, type GeneratorId } from './generators';
import { RESOURCE_IDS, type ResourceId } from './resources';
import type { UpgradeId } from './upgrades';

/** Bump when the shape of GameState changes, and add a migration in save.ts. */
export const STATE_VERSION = 4;

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
  /** Epoch milliseconds of the last simulated moment. */
  lastUpdate: number;
}

function zeroes<K extends string>(ids: readonly K[]): Record<K, number> {
  return Object.fromEntries(ids.map((id) => [id, 0])) as Record<K, number>;
}

export function createInitialState(now: number): GameState {
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
    lastUpdate: now,
  };
}
