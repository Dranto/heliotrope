import { COST_GROWTH, GENERATOR_IDS, GENERATORS, type GeneratorId } from './generators';
import type { GameState } from './state';

/** Light per second produced by all units of one generator. */
export function generatorProduction(state: GameState, id: GeneratorId): number {
  return GENERATORS[id].baseProduction * state.generators[id];
}

/** Total Light per second. */
export function lightPerSecond(state: GameState): number {
  let total = 0;
  for (const id of GENERATOR_IDS) total += generatorProduction(state, id);
  return total;
}

/** Light gained per click on the heliotrope. Click upgrades arrive with milestone 2. */
export function clickValue(_state: GameState): number {
  return 1;
}

/** Cost of the next unit of a generator: baseCost × 1.15^owned. */
export function generatorCost(state: GameState, id: GeneratorId): number {
  return GENERATORS[id].baseCost * COST_GROWTH ** state.generators[id];
}

export function canBuyGenerator(state: GameState, id: GeneratorId): boolean {
  return state.resources.light >= generatorCost(state, id);
}

/**
 * A generator is shown once the player has earned half its base cost this Season.
 * Owning one keeps it shown.
 */
export function isGeneratorRevealed(state: GameState, id: GeneratorId): boolean {
  return state.generators[id] > 0 || state.totalLight >= GENERATORS[id].baseCost / 2;
}

function addLight(state: GameState, amount: number): GameState {
  return {
    ...state,
    resources: { ...state.resources, light: state.resources.light + amount },
    totalLight: state.totalLight + amount,
  };
}

/** Advance the simulation by dtSeconds. Pure: returns a new state. */
export function tick(state: GameState, dtSeconds: number): GameState {
  if (dtSeconds <= 0) return state;
  const next = addLight(state, lightPerSecond(state) * dtSeconds);
  return { ...next, lastUpdate: state.lastUpdate + dtSeconds * 1000 };
}

/** Player action: click the heliotrope. */
export function clickHeliotrope(state: GameState): GameState {
  return { ...addLight(state, clickValue(state)), clicks: state.clicks + 1 };
}

/** Player action: buy one unit of a generator. Returns the same state when unaffordable. */
export function buyGenerator(state: GameState, id: GeneratorId): GameState {
  const cost = generatorCost(state, id);
  if (state.resources.light < cost) return state;
  return {
    ...state,
    resources: { ...state.resources, light: state.resources.light - cost },
    generators: { ...state.generators, [id]: state.generators[id] + 1 },
  };
}
