import { RESOURCE_IDS, type ResourceId } from './resources';

/** Bump when the shape of GameState changes, and add a migration in save.ts. */
export const STATE_VERSION = 1;

export interface GameState {
  version: number;
  resources: Record<ResourceId, number>;
  /** Epoch milliseconds of the last simulated moment. */
  lastUpdate: number;
}

export function createInitialState(now: number): GameState {
  const resources = Object.fromEntries(RESOURCE_IDS.map((id) => [id, 0])) as Record<
    ResourceId,
    number
  >;
  return { version: STATE_VERSION, resources, lastUpdate: now };
}
