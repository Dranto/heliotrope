// Progression phases and visual seasons (docs/game-design.md §6).
import type { GameState } from './state';

export type Phase = 1 | 2 | 3;

/** §6: phases follow the Light earned in the current Season. */
export const PHASE_THRESHOLDS: Record<2 | 3, number> = { 2: 1e4, 3: 1e7 };

/** 1 Le Balcon, 2 Le Quartier, 3 La Ville. */
export function phaseOf(state: GameState): Phase {
  if (state.totalLight >= PHASE_THRESHOLDS[3]) return 3;
  if (state.totalLight >= PHASE_THRESHOLDS[2]) return 2;
  return 1;
}

export const VISUAL_SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type VisualSeason = (typeof VISUAL_SEASONS)[number];

/**
 * §6 phase 4: after the first Season, the scene takes the tint of a season, starting with
 * spring and cycling. The first Season has no tint of its own.
 */
export function visualSeason(state: GameState): VisualSeason | null {
  if (state.seasons === 0) return null;
  return VISUAL_SEASONS[(state.seasons - 1) % VISUAL_SEASONS.length]!;
}
