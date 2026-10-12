import {
  generatorCost,
  isUpgradeBought,
  isUpgradeUnlocked,
  lightPerSecond,
  clickValue,
} from './production';
import { unlockAchievement, unlockAchievements } from './achievements';
import { earnWater, waterPerSecond } from './bioregion';
import { advanceButterfly } from './butterfly';
import { completeChallenge, generatorLimit } from './challenges';
import { completeCycleChallenge } from './cycleChallenges';
import { runLockKeeper } from './cycles';
import { runCooperatives } from './cooperatives';
import { buildReadyStages } from './greatWorks';
import type { GeneratorId } from './generators';
import { growGarden } from './garden';
import { growOrchard } from './orchard';
import { decayPollen, pollinate } from './pollen';
import { advanceWeather } from './weather';
import { advanceRequests } from './requests';
import { runBuilders } from './cities';
import { checkBloom } from './alliances';
import { recordProduction } from './history';
import { runSower } from './seasons';
import { earnLight } from './light';
import { unlockSpecies } from './species';
import { advanceVisit } from './visits';
import type { GameState } from './state';
import { UPGRADES, type UpgradeId } from './upgrades';

export { earnLight };

/**
 * Production over dtSeconds, split where a Golden Butterfly effect ends so a long tick (a
 * throttled tab) earns exactly what many short ones would.
 */
function produce(state: GameState, dtSeconds: number): GameState {
  let next = state;
  let remaining = dtSeconds;
  while (remaining > 0) {
    const step = Math.min(remaining, ...next.effects.map((e) => e.remaining));
    next = earnLight(next, lightPerSecond(next) * step);
    next = {
      ...next,
      effects: next.effects
        .map((e) => ({ ...e, remaining: e.remaining - step }))
        .filter((e) => e.remaining > 1e-9),
    };
    remaining -= step;
  }
  return next;
}

/**
 * Unlock the Milestones the state now qualifies for, win the running challenge Season once its
 * goal is reached (§7.3), the running challenge Cycle likewise (§7.5), and bring back the
 * species now deserved (§9.5).
 */
export function unlockProgress(state: GameState): GameState {
  return buildReadyStages(
    unlockSpecies(completeCycleChallenge(completeChallenge(unlockAchievements(checkBloom(state))))),
  );
}

/**
 * Advance the simulation by dtSeconds of play. Pure: returns a new state. The collectors of the
 * Bioregion gather Water (§7.4), then the Cooperatives (§7.2) buy what the Light earned affords,
 * and the sower (§7.1) starts the next Season when its Seeds are ripe and plentiful enough, after
 * the lock keeper (§7.5) has had its chance to start the next Cycle.
 */
export function tick(state: GameState, dtSeconds: number): GameState {
  if (dtSeconds <= 0) return state;
  const watered = advanceRequests(
    advanceWeather(
      decayPollen(
        growOrchard(
          growGarden(
            earnWater(produce(state, dtSeconds), waterPerSecond(state) * dtSeconds),
            dtSeconds,
          ),
          dtSeconds,
        ),
        dtSeconds,
      ),
      dtSeconds,
    ),
    dtSeconds,
  );
  const next = runBuilders(
    runCooperatives(advanceVisit(advanceButterfly(watered, dtSeconds), dtSeconds)),
  );
  return runSower(
    runLockKeeper(
      unlockProgress(
        recordProduction({
          ...next,
          playSeconds: state.playSeconds + dtSeconds,
          seasonSeconds: state.seasonSeconds + dtSeconds,
          idleSeconds: state.idleSeconds + dtSeconds,
          lastUpdate: state.lastUpdate + dtSeconds * 1000,
        }),
      ),
    ),
  );
}

/** Player action: click the heliotrope. */
export function clickHeliotrope(state: GameState): GameState {
  const next = pollinate({ ...earnLight(state, clickValue(state)), clicks: state.clicks + 1 });
  // Milestone "Pollen d'or" (§9.3): a click during a Pollinisation.
  const pollinating = state.effects.some((effect) => effect.kind === 'pollination');
  return pollinating ? unlockAchievement(next, 'goldenPollen') : next;
}

export function canBuyGenerator(state: GameState, id: GeneratorId, count = 1): boolean {
  return (
    count > 0 &&
    state.generators[id] + count <= generatorLimit(state, id) &&
    state.resources.light >= generatorCost(state, id, count)
  );
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
    idleSeconds: 0,
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
    idleSeconds: 0,
  };
}
