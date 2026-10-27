// Progressive introductions (docs/game-design.md §10.8): when a mechanic is due, and the pacing
// that lets them join one at a time, at least INTRO_GAP_SECONDS of play apart.
import { isBioregionOpen } from './bioregion';
import { isButterflyUnlocked } from './butterfly';
import { unlockedCooperatives } from './cooperatives';
import { isDecorOpen } from './decor';
import { isGardenOpen } from './garden';
import { areGreatWorksOpen } from './greatWorks';
import {
  FEATURE_IDS,
  INTRO_GAP_SECONDS,
  isIntroduced,
  type FeatureId,
  type IntroState,
} from './introductions';
import { isOrchardOpen } from './orchard';
import { isPanelShown } from './panels';
import { phaseOf } from './phases';
import { isPollenOpen } from './pollen';
import { isSeasonsScreenUnlocked } from './seasons';
import type { GameState } from './state';
import { VISIT_KINDS, isVisitUnlocked } from './visits';
import { isWeatherOpen } from './weather';

/** The Milestones screen: with the neighbourhood (phase 2), the first Milestone or Season. */
export function isAchievementsScreenOpen(state: GameState): boolean {
  return (
    isIntroduced(state, 'achievements') &&
    (phaseOf(state) >= 2 || state.achievements.length > 0 || state.seasons > 0)
  );
}

/** The Herbier opens with the first species back (§9.5), or after the first Season. */
export function isHerbierOpen(state: GameState): boolean {
  return isIntroduced(state, 'herbier') && (state.species.length > 0 || state.seasons > 0);
}

/** The Tree of Seasons opens with the first Seeds (§7.1). */
export function isTreeOpen(state: GameState): boolean {
  return isIntroduced(state, 'tree') && state.seeds > 0;
}

/** Whether a mechanic is open; each check includes its introduction. */
function isOpen(state: GameState, id: FeatureId): boolean {
  switch (id) {
    case 'garden':
      return isGardenOpen(state);
    case 'restoration':
      return isPanelShown(state, 'restoration');
    case 'pollen':
      return isPollenOpen(state);
    case 'achievements':
      return isAchievementsScreenOpen(state);
    case 'herbier':
      return isHerbierOpen(state);
    case 'butterfly':
      return isButterflyUnlocked(state);
    case 'visits':
      return VISIT_KINDS.some((kind) => isVisitUnlocked(state, kind));
    case 'decor':
      return isDecorOpen(state);
    case 'seasons':
      return isSeasonsScreenUnlocked(state);
    case 'tree':
      return isTreeOpen(state);
    case 'bioregion':
      return isBioregionOpen(state);
    case 'cooperatives':
      return unlockedCooperatives(state).length > 0;
    case 'weather':
      return isWeatherOpen(state);
    case 'orchard':
      return isOrchardOpen(state);
    case 'greatWorks':
      return areGreatWorksOpen(state);
  }
}

function withIntroduced(state: GameState, ids: readonly FeatureId[]): GameState {
  return { ...state, intro: { ...state.intro, introduced: [...state.intro.introduced, ...ids] } };
}

/** Whether a mechanic not introduced yet would open now: its own condition is met. */
export function isFeatureDue(state: GameState, id: FeatureId): boolean {
  return !isIntroduced(state, id) && isOpen(withIntroduced(state, [id]), id);
}

/** Mechanics waiting for their turn, in the order they will come. */
export function dueFeatures(state: GameState): FeatureId[] {
  return FEATURE_IDS.filter((id) => isFeatureDue(state, id));
}

/**
 * Let the next due mechanic in once INTRO_GAP_SECONDS of play have passed since the last one.
 * Online and offline alike: dtSeconds is elapsed play time.
 */
export function advanceIntroductions(state: GameState, dtSeconds: number): GameState {
  const sinceLast = state.intro.sinceLast + dtSeconds;
  if (sinceLast < INTRO_GAP_SECONDS) return { ...state, intro: { ...state.intro, sinceLast } };
  const next = FEATURE_IDS.find((id) => isFeatureDue(state, id));
  if (!next) return { ...state, intro: { ...state.intro, sinceLast } };
  const intro: IntroState = { introduced: [...state.intro.introduced, next], sinceLast: 0 };
  return welcome({ ...state, intro }, next);
}

/** Seconds after its introduction before the first butterfly or visit shows itself. */
export const FIRST_SIGHT_SECONDS = 5;

/** A mechanic that lives on the map shows itself soon after joining, instead of a long wait. */
function welcome(state: GameState, id: FeatureId): GameState {
  switch (id) {
    case 'butterfly':
      if (state.butterfly.visible > 0) return state;
      return {
        ...state,
        butterfly: {
          ...state.butterfly,
          nextIn: Math.min(state.butterfly.nextIn, FIRST_SIGHT_SECONDS),
        },
      };
    case 'visits':
      if (state.visit.kind !== null) return state;
      return {
        ...state,
        visit: { ...state.visit, nextIn: Math.min(state.visit.nextIn, FIRST_SIGHT_SECONDS) },
      };
    default:
      return state;
  }
}

/**
 * An older save (before v32) has every mechanic it already shows, so nothing it knew goes away.
 * Features that open each other (the Bioregion, then the orchard) are settled in turn.
 */
export function introduceAllDue(state: GameState): GameState {
  let current = state;
  for (;;) {
    const due = dueFeatures(current);
    if (due.length === 0) return current;
    current = withIntroduced(current, due);
  }
}
