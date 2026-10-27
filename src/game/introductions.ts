// Progressive introductions (docs/game-design.md §10.8): the mechanics that join the game one at
// a time. This module only holds what was introduced, so every system can check it without
// importing the others; the order and the pacing live in onboarding.ts.

/** The mechanics introduced one by one, in priority order when several are due together. */
export const FEATURE_IDS = [
  'pollen',
  'garden',
  'restoration',
  'achievements',
  'herbier',
  'butterfly',
  'visits',
  'decor',
  'seasons',
  'tree',
  'bioregion',
  'cooperatives',
  'requests',
  'weather',
  'orchard',
  'greatWorks',
] as const;
export type FeatureId = (typeof FEATURE_IDS)[number];

/** Seconds of play between two introductions: one novelty at a time. */
export const INTRO_GAP_SECONDS = 45;

/** Seconds a new mechanic is shown as just arrived (the flower's ripple, its glow). */
export const ARRIVAL_SECONDS = 12;

export interface IntroState {
  /** Mechanics already introduced, in the order they came. Kept across Seasons and Cycles. */
  introduced: FeatureId[];
  /** Seconds of play since the last introduction (or since the game began). */
  sinceLast: number;
}

export function createIntroState(): IntroState {
  return { introduced: [], sinceLast: 0 };
}

export function isFeatureId(value: unknown): value is FeatureId {
  return typeof value === 'string' && (FEATURE_IDS as readonly string[]).includes(value);
}

export function isIntroduced(state: { intro: IntroState }, id: FeatureId): boolean {
  return state.intro.introduced.includes(id);
}

/** The mechanic that has just arrived, for its arrival signal, or null. */
export function arrivedFeature(state: { intro: IntroState }): FeatureId | null {
  const { introduced, sinceLast } = state.intro;
  if (introduced.length === 0 || sinceLast >= ARRIVAL_SECONDS) return null;
  return introduced[introduced.length - 1]!;
}

export function validIntro(raw: unknown): IntroState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { introduced, sinceLast } = raw as Record<string, unknown>;
  if (!Array.isArray(introduced)) return null;
  return {
    introduced: [...new Set(introduced.filter(isFeatureId))],
    sinceLast:
      typeof sinceLast === 'number' && Number.isFinite(sinceLast) && sinceLast >= 0
        ? sinceLast
        : INTRO_GAP_SECONDS,
  };
}

/** The same state with every mechanic already introduced, as for a player who has seen them all. */
export function withAllIntroduced<S extends { intro: IntroState }>(state: S): S {
  return { ...state, intro: { introduced: [...FEATURE_IDS], sinceLast: INTRO_GAP_SECONDS } };
}
