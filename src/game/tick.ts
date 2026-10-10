import { RESOURCE_IDS, RESOURCES, type ResourceId } from './resources';
import type { GameState } from './state';

/** Passive production per second for every resource in the given state. */
export function productionRates(_state: GameState): Record<ResourceId, number> {
  return Object.fromEntries(RESOURCE_IDS.map((id) => [id, RESOURCES[id].baseRate])) as Record<
    ResourceId,
    number
  >;
}

/** Advance the simulation by dtSeconds. Pure: returns a new state. */
export function tick(state: GameState, dtSeconds: number): GameState {
  if (dtSeconds <= 0) return state;
  const rates = productionRates(state);
  const resources = { ...state.resources };
  for (const id of RESOURCE_IDS) {
    resources[id] += rates[id] * dtSeconds;
  }
  return { ...state, resources, lastUpdate: state.lastUpdate + dtSeconds * 1000 };
}

/** Manual action: add an amount of a resource (the "click"). */
export function gather(state: GameState, id: ResourceId, amount = 1): GameState {
  return { ...state, resources: { ...state.resources, [id]: state.resources[id] + amount } };
}
