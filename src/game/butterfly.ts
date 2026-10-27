// The Golden Butterfly (docs/game-design.md §9.2): a random visitor that grants a temporary
// effect when caught. Randomness comes from the seed in GameState, so every transition is pure.
import { isIntroduced } from './introductions';
import { addPollen, FLIGHT_BUTTERFLY_FACTOR, POLLEN_PER_MOMENT } from './pollen';
import { JUST_IN_TIME_SECONDS, unlockAchievement } from './achievements';
import { effectDurationFactor, factorOf } from './bonuses';
import {
  BIRDS_SECONDS_PER_SPECIES,
  EFFECTS,
  effectFactor,
  type ActiveEffect,
  type EffectKind,
} from './effects';
import { earnLight } from './light';
import { phaseOf } from './phases';
import { lightPerSecond } from './production';
import { nextRandom } from './random';
import { butterflyDelay, type GameState } from './state';

/** §9.2: a butterfly stays on screen, catchable, for 12 seconds. */
export const BUTTERFLY_VISIBLE_SECONDS = 12;

/** §9.2 Récolte: min(15% of the Light in reserve, 15 minutes of production). */
export const HARVEST_RESERVE_SHARE = 0.15;
export const HARVEST_PRODUCTION_SECONDS = 15 * 60;

export type ButterflyOutcome = 'bloom' | 'pollination' | 'harvest';

/** Odds of the Floraison and the Récolte; the Pollinisation takes the rest. */
export interface ButterflyOdds {
  bloom: number;
  harvest: number;
}

/** §9.2 odds: Floraison 50%, Récolte 40%, Pollinisation 10%. */
export const BUTTERFLY_ODDS: ButterflyOdds = { bloom: 0.5, harvest: 0.4 };

export function butterflyOutcome(
  random: number,
  odds: ButterflyOdds = BUTTERFLY_ODDS,
): ButterflyOutcome {
  if (random < odds.bloom) return 'bloom';
  if (random < odds.bloom + odds.harvest) return 'harvest';
  return 'pollination';
}

/** The butterfly visits from phase 2 (Le Quartier, §6) on. */
export function isButterflyUnlocked(state: GameState): boolean {
  return isIntroduced(state, 'butterfly') && phaseOf(state) >= 2;
}

/** Light a Récolte would bring right now. */
export function harvestAmount(state: GameState): number {
  return (
    Math.min(
      state.resources.light * HARVEST_RESERVE_SHARE,
      lightPerSecond(state) * HARVEST_PRODUCTION_SECONDS,
    ) *
    factorOf(state, 'harvestFactor') *
    // §9.6, M18: the harvest festival of the park-and-ride halls.
    effectFactor(state.effects, 'festival')
  );
}

/**
 * Schedule the next butterfly after `state`'s one is caught or flew away. Parcels and projects
 * can bring it sooner (§6.1, §6.2).
 */
function scheduleNext(state: GameState): GameState {
  const [random, rngSeed] = nextRandom(state.rngSeed);
  const nextIn = butterflyDelay(random) * factorOf(state, 'butterflyInterval');
  return { ...state, rngSeed, butterfly: { nextIn, visible: 0 } };
}

/**
 * How long an effect lasts when started, with the parcels and projects in force; the migrating
 * birds stay longer for each species of the Herbier (§9.6).
 */
export function effectSeconds(state: GameState, kind: EffectKind): number {
  const extra = kind === 'birds' ? state.species.length * BIRDS_SECONDS_PER_SPECIES : 0;
  return (EFFECTS[kind].seconds + extra) * effectDurationFactor(state, kind);
}

/** Move the butterfly clock forward by dtSeconds of online play. */
export function advanceButterfly(state: GameState, dtSeconds: number): GameState {
  const { nextIn, visible } = state.butterfly;
  if (visible > 0) {
    const left = visible - dtSeconds;
    return left > 0 ? { ...state, butterfly: { nextIn, visible: left } } : scheduleNext(state);
  }
  if (!isButterflyUnlocked(state)) return state;
  const wait = nextIn - dtSeconds;
  if (wait > 0) return { ...state, butterfly: { nextIn: wait, visible: 0 } };
  // Time left over after the butterfly appeared already counts against its 12 seconds.
  const shown = BUTTERFLY_VISIBLE_SECONDS + wait;
  if (shown > 0) return { ...state, butterfly: { nextIn: 0, visible: shown } };
  return scheduleNext(state);
}

export function startEffect(state: GameState, kind: EffectKind): ActiveEffect[] {
  // Catching the same effect again restarts it rather than stacking it. Caught during the
  // pollen's flight (§5.6), it lasts longer.
  const flying = state.effects.some((e) => e.kind === 'flight');
  return [
    ...state.effects.filter((e) => e.kind !== kind),
    { kind, remaining: effectSeconds(state, kind) * (flying ? FLIGHT_BUTTERFLY_FACTOR : 1) },
  ];
}

export interface CatchResult {
  state: GameState;
  outcome: ButterflyOutcome;
  /** Light gained at once (Récolte), 0 otherwise. */
  light: number;
}

/** Player action: catch the butterfly on screen. Returns null when there is none. */
export function catchButterfly(state: GameState): CatchResult | null {
  if (state.butterfly.visible <= 0) return null;
  const [random, rngSeed] = nextRandom(state.rngSeed);
  const outcome = butterflyOutcome(random, BUTTERFLY_ODDS);
  let next: GameState = { ...state, rngSeed, butterflies: state.butterflies + 1 };
  let light = 0;
  if (outcome === 'harvest') {
    light = harvestAmount(state);
    next = earnLight(next, light);
  } else {
    next = { ...next, effects: startEffect(state, outcome) };
  }
  // Hidden Milestone "De justesse" (§9.3): caught in its last seconds on screen.
  if (state.butterfly.visible <= JUST_IN_TIME_SECONDS) next = unlockAchievement(next, 'justInTime');
  // §5.7 (M31): the butterfly leaves pollen on the flower, after its own effect has started.
  return { state: scheduleNext(addPollen(next, POLLEN_PER_MOMENT)), outcome, light };
}
