// Milestones ("Jalons", docs/game-design.md §9.3). Data table plus pure unlock checks; names
// and descriptions live in src/i18n. Milestones are kept across Seasons.
import { GENERATOR_IDS, type GeneratorId } from './generators';
import type { GameState } from './state';

/** §9.3: each Milestone unlocked adds +1% to global production (additive). */
export const ACHIEVEMENT_BONUS = 0.01;

export type AchievementCondition =
  | { kind: 'allTimeLight'; amount: number }
  | { kind: 'owned'; generator: GeneratorId; count: number }
  | { kind: 'clicks'; count: number }
  | { kind: 'butterflies'; count: number }
  | { kind: 'seasons'; count: number }
  /** Every generator type owned at least `count` times. */
  | { kind: 'everyGenerator'; count: number }
  /** Seconds without buying anything, with at least one generator owned. */
  | { kind: 'idle'; seconds: number }
  /** Unlocked by an action rather than by the state, see `unlockAchievement`. */
  | { kind: 'action' };

const LIGHT_EXPONENTS = [3, 6, 9, 12, 15, 18] as const;
const OWNED_STEPS = [1, 50, 100] as const;
const CLICK_STEPS = [100, 1_000, 10_000] as const;
const BUTTERFLY_STEPS = [1, 10, 50] as const;
const SEASON_STEPS = [1, 5, 10] as const;

export type AchievementId =
  | `light.${(typeof LIGHT_EXPONENTS)[number]}`
  | `${GeneratorId}.${(typeof OWNED_STEPS)[number]}`
  | `clicks.${(typeof CLICK_STEPS)[number]}`
  | `butterflies.${(typeof BUTTERFLY_STEPS)[number]}`
  | `seasons.${(typeof SEASON_STEPS)[number]}`
  | 'mosaic'
  | 'slowPhotosynthesis'
  | 'earlySowing'
  | 'wildGarden';

export interface AchievementDef {
  id: AchievementId;
  condition: AchievementCondition;
  /** Hidden Milestones show as "?" until unlocked. */
  hidden?: boolean;
}

/** Display order: Light, buildings, clicks, butterflies, Seasons, then the special ones. */
export const ACHIEVEMENT_LIST: readonly AchievementDef[] = [
  ...LIGHT_EXPONENTS.map((exponent) => ({
    id: `light.${exponent}` as const,
    condition: { kind: 'allTimeLight', amount: 10 ** exponent } as const,
  })),
  ...GENERATOR_IDS.flatMap((generator) =>
    OWNED_STEPS.map((count) => ({
      id: `${generator}.${count}` as const,
      condition: { kind: 'owned', generator, count } as const,
    })),
  ),
  ...CLICK_STEPS.map((count) => ({
    id: `clicks.${count}` as const,
    condition: { kind: 'clicks', count } as const,
  })),
  ...BUTTERFLY_STEPS.map((count) => ({
    id: `butterflies.${count}` as const,
    condition: { kind: 'butterflies', count } as const,
  })),
  ...SEASON_STEPS.map((count) => ({
    id: `seasons.${count}` as const,
    condition: { kind: 'seasons', count } as const,
  })),
  { id: 'mosaic', condition: { kind: 'everyGenerator', count: 10 } },
  { id: 'slowPhotosynthesis', condition: { kind: 'idle', seconds: 600 }, hidden: true },
  { id: 'earlySowing', condition: { kind: 'action' }, hidden: true },
  { id: 'wildGarden', condition: { kind: 'everyGenerator', count: 100 }, hidden: true },
];

export const ACHIEVEMENTS = Object.fromEntries(ACHIEVEMENT_LIST.map((a) => [a.id, a])) as Record<
  AchievementId,
  AchievementDef
>;

export function isAchievementId(value: unknown): value is AchievementId {
  return typeof value === 'string' && Object.hasOwn(ACHIEVEMENTS, value);
}

/** Additive production bonus from the Milestones unlocked. */
export function achievementBonus(state: GameState): number {
  return state.achievements.length * ACHIEVEMENT_BONUS;
}

function isMet(state: GameState, condition: AchievementCondition): boolean {
  switch (condition.kind) {
    case 'allTimeLight':
      return state.allTimeLight >= condition.amount;
    case 'owned':
      return state.generators[condition.generator] >= condition.count;
    case 'clicks':
      return state.clicks >= condition.count;
    case 'butterflies':
      return state.butterflies >= condition.count;
    case 'seasons':
      return state.seasons >= condition.count;
    case 'everyGenerator':
      return GENERATOR_IDS.every((id) => state.generators[id] >= condition.count);
    case 'idle':
      return (
        state.idleSeconds >= condition.seconds && GENERATOR_IDS.some((id) => state.generators[id])
      );
    case 'action':
      return false;
  }
}

/** Unlock every Milestone whose condition is met. Returns the same state when none is new. */
export function unlockAchievements(state: GameState): GameState {
  const fresh = ACHIEVEMENT_LIST.filter(
    (a) => !state.achievements.includes(a.id) && isMet(state, a.condition),
  ).map((a) => a.id);
  if (fresh.length === 0) return state;
  return { ...state, achievements: [...state.achievements, ...fresh] };
}

/** Unlock one Milestone directly, e.g. one earned by an action. */
export function unlockAchievement(state: GameState, id: AchievementId): GameState {
  if (state.achievements.includes(id)) return state;
  return { ...state, achievements: [...state.achievements, id] };
}
