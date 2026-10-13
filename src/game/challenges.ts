// Challenge Seasons (docs/game-design.md §7.3): a constraint chosen when starting a new Season.
// Reaching the challenge's goal in that Season lifts the constraint, brings back a species of the
// Herbier (§9.5) and grants a bonus kept forever. Names live in src/i18n, the look in src/ui.
import type { Bonus } from './bonuses';
import type { GeneratorId } from './generators';
import type { SpeciesId } from './species';
import type { GameState } from './state';

export const CHALLENGE_IDS = ['cloudy', 'wild', 'frugal', 'hands'] as const;
export type ChallengeId = (typeof CHALLENGE_IDS)[number];

export interface ChallengeDef {
  id: ChallengeId;
  /** Light to earn in the challenge Season to win it. */
  goal: number;
  /** The species of the Herbier it brings back. */
  species: SpeciesId;
  /** Kept forever once won. */
  bonuses: readonly Bonus[];
  /** Buildings that cannot be built during the challenge. */
  blocked?: readonly GeneratorId[];
  /** No upgrade can be bought, by the player or the council. */
  noUpgrades?: boolean;
  /** At most this many units of each building. */
  maxPerGenerator?: number;
  /** Multiplies every building's production. */
  productionFactor?: number;
}

/** Challenge Seasons can be chosen once the first Season is over. */
export const CHALLENGES_FROM_SEASON = 1;

export const CHALLENGE_LIST: readonly ChallengeDef[] = [
  {
    // The season of clouds: no solar panel nor mirror works.
    id: 'cloudy',
    goal: 2e9,
    species: 'kingfisher',
    blocked: ['balconyPanel', 'mirrorPlant'],
    bonuses: [{ kind: 'perParcel', bonus: 0.02 }],
  },
  {
    // The wild season: the garden grows without any upgrade.
    id: 'wild',
    goal: 2e8,
    species: 'orchid',
    noUpgrades: true,
    bonuses: [{ kind: 'synergyFactor', factor: 1.25 }],
  },
  {
    // The frugal season: at most 25 of each building.
    id: 'frugal',
    goal: 3e9,
    species: 'stagBeetle',
    maxPerGenerator: 25,
    bonuses: [{ kind: 'discount', fraction: 0.05 }],
  },
  {
    // The season of hands: the buildings rest, production ÷10; the clicks carry the Season.
    id: 'hands',
    goal: 5e7,
    species: 'owl',
    productionFactor: 0.1,
    bonuses: [{ kind: 'clickMultiplier', factor: 3 }],
  },
];

export const CHALLENGES: Record<ChallengeId, ChallengeDef> = Object.fromEntries(
  CHALLENGE_LIST.map((c) => [c.id, c]),
) as Record<ChallengeId, ChallengeDef>;

export function isChallengeId(value: unknown): value is ChallengeId {
  return typeof value === 'string' && (CHALLENGE_IDS as readonly string[]).includes(value);
}

/** The challenge running this Season, if any. */
export function activeChallenge(state: Pick<GameState, 'challenge'>): ChallengeDef | undefined {
  return state.challenge ? CHALLENGES[state.challenge] : undefined;
}

/** Most units of a building the running challenge allows (Infinity without one). */
export function generatorLimit(state: Pick<GameState, 'challenge'>, id: GeneratorId): number {
  const challenge = activeChallenge(state);
  if (!challenge) return Infinity;
  if (challenge.blocked?.includes(id)) return 0;
  return challenge.maxPerGenerator ?? Infinity;
}

export function upgradesAllowed(state: Pick<GameState, 'challenge'>): boolean {
  return !activeChallenge(state)?.noUpgrades;
}

export function challengeProductionFactor(state: Pick<GameState, 'challenge'>): number {
  return activeChallenge(state)?.productionFactor ?? 1;
}

/** Challenges are offered from the second Season on, until each one is won. */
export function offeredChallenges(state: GameState): ChallengeDef[] {
  if (state.seasons < CHALLENGES_FROM_SEASON) return [];
  return CHALLENGE_LIST.filter((c) => !state.challenges.includes(c.id));
}

/**
 * Win the running challenge once its goal is reached: the constraint lifts for the rest of the
 * Season and the challenge counts as won for good (its species then returns, §9.5).
 */
export function completeChallenge(state: GameState): GameState {
  const challenge = activeChallenge(state);
  if (!challenge || state.totalLight < challenge.goal) return state;
  return {
    ...state,
    challenge: null,
    challenges: state.challenges.includes(challenge.id)
      ? state.challenges
      : [...state.challenges, challenge.id],
  };
}
