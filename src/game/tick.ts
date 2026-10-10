import {
  generatorCost,
  isUpgradeBought,
  isUpgradeUnlocked,
  lightPerSecond,
  clickValue,
} from './production';
import type { GeneratorId } from './generators';
import type { GameState } from './state';
import { UPGRADES, type UpgradeId } from './upgrades';

/** Add Light to the reserve and to the Season total. */
export function earnLight(state: GameState, amount: number): GameState {
  return {
    ...state,
    resources: { ...state.resources, light: state.resources.light + amount },
    totalLight: state.totalLight + amount,
  };
}

/** Advance the simulation by dtSeconds. Pure: returns a new state. */
export function tick(state: GameState, dtSeconds: number): GameState {
  if (dtSeconds <= 0) return state;
  const next = earnLight(state, lightPerSecond(state) * dtSeconds);
  return { ...next, lastUpdate: state.lastUpdate + dtSeconds * 1000 };
}

/** Player action: click the heliotrope. */
export function clickHeliotrope(state: GameState): GameState {
  return { ...earnLight(state, clickValue(state)), clicks: state.clicks + 1 };
}

export function canBuyGenerator(state: GameState, id: GeneratorId, count = 1): boolean {
  return count > 0 && state.resources.light >= generatorCost(state, id, count);
}

/**
 * Player action: buy `count` units of a generator at once (§4, bulk buy).
 * Returns the same state when unaffordable.
 */
export function buyGenerator(state: GameState, id: GeneratorId, count = 1): GameState {
  if (!canBuyGenerator(state, id, count)) return state;
  const cost = generatorCost(state, id, count);
  return {
    ...state,
    // Clamp so floating-point error never leaves a tiny negative reserve.
    resources: { ...state.resources, light: Math.max(0, state.resources.light - cost) },
    generators: { ...state.generators, [id]: state.generators[id] + count },
  };
}

export function canBuyUpgrade(state: GameState, id: UpgradeId): boolean {
  return (
    !isUpgradeBought(state, id) &&
    isUpgradeUnlocked(state, id) &&
    state.resources.light >= UPGRADES[id].cost
  );
}

/** Player action: buy an upgrade. Returns the same state when not available or unaffordable. */
export function buyUpgrade(state: GameState, id: UpgradeId): GameState {
  if (!canBuyUpgrade(state, id)) return state;
  return {
    ...state,
    resources: { ...state.resources, light: state.resources.light - UPGRADES[id].cost },
    upgrades: [...state.upgrades, id],
  };
}
