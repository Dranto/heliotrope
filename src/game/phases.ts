// Progression phases and visual seasons (docs/game-design.md §6).
import { seasonRipeness } from './seasons';
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
 * §6 phase 4 and §7: after the first Season, the scene follows the ripening of the Seeds:
 * spring, then summer from half the ripening time, and autumn once the Seeds are ripe. The first
 * Season has no tint of its own. Winter is the replanting itself, never a lasting tint.
 */
export function visualSeason(state: GameState): VisualSeason | null {
  if (state.seasons === 0) return null;
  const ripeness = seasonRipeness(state);
  if (ripeness >= 1) return 'autumn';
  return ripeness >= 0.5 ? 'summer' : 'spring';
}
