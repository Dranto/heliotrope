// Challenge Cycles (docs/game-design.md §7.5, M15): a constraint on the Bioregion chosen when
// starting a new Cycle of water, on the model of the challenge Seasons (§7.3). Gathering the
// challenge's Water in that Cycle lifts the constraint, brings back a species of the river
// (§9.5) and grants a bonus kept forever. Offered once the flood arm of the delta is open.
import type { Bonus } from './bonuses';
import type { SpeciesId } from './species';
import type { GameState } from './state';

export const CYCLE_CHALLENGE_IDS = ['drought', 'flood', 'still'] as const;
export type CycleChallengeId = (typeof CYCLE_CHALLENGE_IDS)[number];

export interface CycleChallengeDef {
  id: CycleChallengeId;
  /** Water to gather in the challenge Cycle to win it. */
  goal: number;
  /** The species of the river it brings back. */
  species: SpeciesId;
  /** Kept forever once won. */
  bonuses: readonly Bonus[];
  /** Multiplies the Water every collector gathers. */
  waterFactor?: number;
  /** Multiplies the Light cost of every collector. */
  collectorCostFactor?: number;
  /** Multiplies the Water cost of every site level. */
  siteCostFactor?: number;
}

export const CYCLE_CHALLENGE_LIST: readonly CycleChallengeDef[] = [
  {
    // The dry year: the collectors gather a quarter of their Water.
    id: 'drought',
    goal: 2e6,
    species: 'otter',
    waterFactor: 0.25,
    bonuses: [{ kind: 'water', factor: 1.25 }],
  },
  {
    // The flood: every collector costs ten times as much.
    id: 'flood',
    goal: 5e6,
    species: 'salmon',
    collectorCostFactor: 10,
    bonuses: [{ kind: 'global', bonus: 0.1 }],
  },
  {
    // Still water: every site level costs four times as much.
    id: 'still',
    goal: 5e6,
    species: 'blackStork',
    siteCostFactor: 4,
    bonuses: [{ kind: 'synergyFactor', factor: 1.1 }],
  },
];

export const CYCLE_CHALLENGES: Record<CycleChallengeId, CycleChallengeDef> = Object.fromEntries(
  CYCLE_CHALLENGE_LIST.map((c) => [c.id, c]),
) as Record<CycleChallengeId, CycleChallengeDef>;

export function isCycleChallengeId(value: unknown): value is CycleChallengeId {
  return typeof value === 'string' && Object.hasOwn(CYCLE_CHALLENGES, value);
}

/** The challenge running this Cycle, if any. */
export function activeCycleChallenge(
  state: Pick<GameState, 'cycleChallenge'>,
): CycleChallengeDef | undefined {
  return state.cycleChallenge ? CYCLE_CHALLENGES[state.cycleChallenge] : undefined;
}

export function challengeWaterFactor(state: Pick<GameState, 'cycleChallenge'>): number {
  return activeCycleChallenge(state)?.waterFactor ?? 1;
}

export function challengeCollectorCostFactor(state: Pick<GameState, 'cycleChallenge'>): number {
  return activeCycleChallenge(state)?.collectorCostFactor ?? 1;
}

export function challengeSiteCostFactor(state: Pick<GameState, 'cycleChallenge'>): number {
  return activeCycleChallenge(state)?.siteCostFactor ?? 1;
}

/** Challenge Cycles are offered once the flood arm is open, until each one is won. */
export function offeredCycleChallenges(state: GameState): CycleChallengeDef[] {
  if (state.delta.levels.floodArm === 0) return [];
  return CYCLE_CHALLENGE_LIST.filter((c) => !state.cycleChallenges.includes(c.id));
}

/** Water gathered in the current Cycle (bioregion.ts imports this module, hence inline). */
function waterOfCycle(state: GameState): number {
  return state.allTimeWater - state.waterBeforeCycle;
}

/**
 * Win the running challenge Cycle once its goal is gathered: the constraint lifts for the rest
 * of the Cycle and the challenge counts as won for good (its species then returns, §9.5).
 */
export function completeCycleChallenge(state: GameState): GameState {
  const challenge = activeCycleChallenge(state);
  if (!challenge || waterOfCycle(state) < challenge.goal) return state;
  return {
    ...state,
    cycleChallenge: null,
    cycleChallenges: state.cycleChallenges.includes(challenge.id)
      ? state.cycleChallenges
      : [...state.cycleChallenges, challenge.id],
  };
}
