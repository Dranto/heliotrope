import { offlineCapBonus } from './bonuses';
import { isRipe } from './garden';
import { GENERATOR_IDS, type GeneratorId } from './generators';
import { areSeedsRipe } from './seasons';
import type { GameState } from './state';
import { tick } from './tick';
import { weathersBetween, type WeatherId } from './weather';

/** Offline progress is capped so a long absence stays rewarding but bounded. */
export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;

/** The cap with the parcels in force (§6.1: the river adds two hours). */
export function offlineCap(state: GameState): number {
  return MAX_OFFLINE_SECONDS + offlineCapBonus(state);
}

/** Offline time is simulated in chunks so non-linear systems stay accurate. */
const OFFLINE_STEP_SECONDS = 60;

export interface OfflineResult {
  state: GameState;
  /** Seconds actually simulated (after the cap). */
  elapsedSeconds: number;
}

/**
 * Production while the game was closed (§9.1). Golden Butterfly and visit effects do not count
 * offline: they, the butterfly and the visit clocks are paused, then resume where they were.
 */
export function applyOfflineProgress(
  state: GameState,
  now: number,
  maxSeconds = offlineCap(state),
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
      visit: state.visit,
      rngSeed: state.rngSeed,
      lastUpdate: now,
    },
    elapsedSeconds,
  };
}

/**
 * What grew while the player was away (§9.1, M17), for the return in images: the buildings the
 * Cooperatives bought, the beds of the garden that ripened, the Seeds that became ripe and the
 * Seasons the sower started. Only what changed; the screen shows the current numbers.
 */
export interface OfflineReport {
  /** Generators whose count went up, in data order. */
  built: GeneratorId[];
  /** Indexes of the garden beds that became ripe. */
  ripened: number[];
  seedsRipened: boolean;
  /** Seasons started by the sower (§7.1) while away. */
  seasons: number;
  /** The weathers lived while away, the one left behind first (M33); empty if the sky held. */
  weathers: WeatherId[];
}

export function offlineReport(before: GameState, after: GameState): OfflineReport {
  const seasons = after.seasons - before.seasons;
  return {
    // A new Season empties the buildings: what was built before it no longer shows.
    built:
      seasons > 0
        ? GENERATOR_IDS.filter((id) => after.generators[id] > 0)
        : GENERATOR_IDS.filter((id) => after.generators[id] > before.generators[id]),
    ripened: after.garden.plots.flatMap((plot, i) => {
      const was = before.garden.plots[i];
      return isRipe(plot) && !(was && was.crop === plot.crop && isRipe(was)) ? [i] : [];
    }),
    seedsRipened: areSeedsRipe(after) && (seasons > 0 || !areSeedsRipe(before)),
    seasons,
    weathers: weathersBetween(before.weather, after.weather),
  };
}
