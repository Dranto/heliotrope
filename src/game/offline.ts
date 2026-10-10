import type { GameState } from './state';
import { tick } from './tick';

/** Offline progress is capped so a long absence stays rewarding but bounded. */
export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;

/** Offline time is simulated in chunks so non-linear systems stay accurate. */
const OFFLINE_STEP_SECONDS = 60;

export interface OfflineResult {
  state: GameState;
  /** Seconds actually simulated (after the cap). */
  elapsedSeconds: number;
}

/**
 * Production while the game was closed (§9.1). Golden Butterfly effects do not count offline:
 * they and the butterfly clock are paused, then resume where they were.
 */
export function applyOfflineProgress(
  state: GameState,
  now: number,
  maxSeconds = MAX_OFFLINE_SECONDS,
): OfflineResult {
  const away = Math.max(0, (now - state.lastUpdate) / 1000);
  const elapsedSeconds = Math.min(away, maxSeconds);
  let next: GameState = { ...state, effects: [] };
  let remaining = elapsedSeconds;
  while (remaining > 0) {
    const step = Math.min(remaining, OFFLINE_STEP_SECONDS);
    next = tick(next, step);
    remaining -= step;
  }
  // Time beyond the cap is skipped, not owed.
  return {
    state: {
      ...next,
      effects: state.effects,
      butterfly: state.butterfly,
      rngSeed: state.rngSeed,
      lastUpdate: now,
    },
    elapsedSeconds,
  };
}
