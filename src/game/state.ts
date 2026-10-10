import { GENERATOR_IDS, type GeneratorId } from './generators';
import { RESOURCE_IDS, type ResourceId } from './resources';
import type { UpgradeId } from './upgrades';

/** Bump when the shape of GameState changes, and add a migration in save.ts. */
export const STATE_VERSION = 3;

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
  /** Number of clicks on the heliotrope. */
  clicks: number;
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
    clicks: 0,
    lastUpdate: now,
  };
}
