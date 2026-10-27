// Visits to the neighbourhood (docs/game-design.md §9.6): now and then something crosses the
// map at a place tied to what the player built, and a click welcomes it. Like the Golden
// Butterfly (§9.2), the randomness comes from the seed in GameState, so every transition is pure.
import { isIntroduced } from './introductions';
import { unlockAchievements } from './achievements';
import { bonusesOf, factorOf } from './bonuses';
import { effectSeconds } from './butterfly';
import type { EffectKind } from './effects';
import { GENERATOR_IDS, type GeneratorId } from './generators';
import { addPollen, POLLEN_PER_MOMENT } from './pollen';
import { nextRandom } from './random';
import type { GameState } from './state';

export const VISIT_KINDS = [
  'cuttings',
  'shower',
  'birds',
  'sheep',
  'festival',
  'fireflies',
  'fleaMarket',
] as const;
export type VisitKind = (typeof VISIT_KINDS)[number];

/** The first visitors, of the neighbourhood (M11). */
export const NEIGHBOURHOOD_VISITS: readonly VisitKind[] = ['cuttings', 'shower', 'birds'];
/** The visitors of the whole city (M18), drawn by the Bioregion and the neighbouring districts. */
export const CITY_VISITS: readonly VisitKind[] = ['sheep', 'festival', 'fireflies', 'fleaMarket'];

export interface VisitState {
  /** Seconds of play before the next visit arrives. */
  nextIn: number;
  /** The visitor on the map; null when there is none. */
  kind: VisitKind | null;
  /** Seconds left to welcome it; 0 when there is none. */
  visible: number;
}

/** A visit comes every 4 to 9 minutes and stays 20 seconds. */
export const VISIT_MIN_INTERVAL = 4 * 60;
export const VISIT_MAX_INTERVAL = 9 * 60;
export const VISIT_VISIBLE_SECONDS = 20;

/** Units of the most expensive building the neighbours bring, before the projects (§6.2). */
export const CUTTINGS_UNITS = 1;

/** The timed effect each visit starts; the cuttings are a gift at once. */
export const VISIT_EFFECTS: Record<Exclude<VisitKind, 'cuttings'>, EffectKind> = {
  shower: 'shower',
  birds: 'birds',
  sheep: 'grazing',
  festival: 'festival',
  fireflies: 'fireflies',
  fleaMarket: 'fleaMarket',
};

/** Seconds until the next visit, drawn uniformly in the interval. */
export function visitDelay(random: number): number {
  return VISIT_MIN_INTERVAL + random * (VISIT_MAX_INTERVAL - VISIT_MIN_INTERVAL);
}

export function createVisitState(random: number): VisitState {
  return { nextIn: visitDelay(random), kind: null, visible: 0 };
}

/**
 * Which visitors the neighbourhood draws: the neighbours once the courtyard has 10 pots, the
 * summer shower once there are 10 rooftop gardens to water, the migrating birds once there are
 * trees in the streets or living roofs. The city's visitors (M18) come with what they belong to:
 * the sheep with the agrivoltaic meadows of the Bioregion, the festival with the park-and-ride
 * halls, the fireflies with the water gardens of the tanneries, the flea market with the solar
 * workshops.
 */
export function isVisitUnlocked(state: GameState, kind: VisitKind): boolean {
  if (!isIntroduced(state, 'visits')) return false;
  switch (kind) {
    case 'cuttings':
      return state.generators.pot >= 10;
    case 'shower':
      return state.generators.rooftopGarden >= 10;
    case 'birds':
      return state.generators.urbanCanopy >= 1 || state.parcels.includes('livingRoofs');
    case 'sheep':
      return state.sites.meadows >= 1;
    case 'festival':
      return state.districts.includes('parkAndRide');
    case 'fireflies':
      return state.districts.includes('tanneries');
    case 'fleaMarket':
      return state.districts.includes('industrialZone');
  }
}

export function unlockedVisits(state: GameState): VisitKind[] {
  return VISIT_KINDS.filter((kind) => isVisitUnlocked(state, kind));
}

function scheduleNext(state: GameState): GameState {
  const [random, rngSeed] = nextRandom(state.rngSeed);
  const nextIn = visitDelay(random) * factorOf(state, 'visitInterval');
  return { ...state, rngSeed, visit: { nextIn, kind: null, visible: 0 } };
}

/** Move the visit clock forward by dtSeconds of online play. */
export function advanceVisit(state: GameState, dtSeconds: number): GameState {
  const { nextIn, kind, visible } = state.visit;
  if (kind !== null) {
    const left = visible - dtSeconds;
    return left > 0 ? { ...state, visit: { nextIn, kind, visible: left } } : scheduleNext(state);
  }
  const kinds = unlockedVisits(state);
  if (kinds.length === 0) return state;
  const wait = nextIn - dtSeconds;
  if (wait > 0) return { ...state, visit: { nextIn: wait, kind: null, visible: 0 } };
  // Time left over after the visitor arrived already counts against its stay.
  const shown = VISIT_VISIBLE_SECONDS + wait;
  if (shown <= 0) return scheduleNext(state);
  const [random, rngSeed] = nextRandom(state.rngSeed);
  const chosen = kinds[Math.min(kinds.length - 1, Math.floor(random * kinds.length))]!;
  return { ...state, rngSeed, visit: { nextIn: 0, kind: chosen, visible: shown } };
}

/** Visitors of the city welcomed over the whole game (Milestones). */
export function cityVisits(state: Pick<GameState, 'visits'>): number {
  return CITY_VISITS.reduce((sum, kind) => sum + state.visits[kind], 0);
}

/** The building the neighbours bring: the most expensive one owned with room left. */
export function cuttingsGenerator(state: GameState): GeneratorId | null {
  for (const id of [...GENERATOR_IDS].reverse()) {
    if (state.generators[id] > 0) return id;
  }
  return null;
}

/** Units of that building they bring, with the Troc de graines project (§6.2). */
export function cuttingsUnits(state: GameState): number {
  return CUTTINGS_UNITS + bonusesOf(state, 'cuttingsGift').reduce((sum, b) => sum + b.units, 0);
}

export interface WelcomeResult {
  state: GameState;
  kind: VisitKind;
  /** The building brought by the neighbours and how many, for the cuttings. */
  gift?: { generator: GeneratorId; units: number };
}

/** Player action: welcome the visitor on the map. Returns null when there is none. */
export function welcomeVisit(state: GameState): WelcomeResult | null {
  const { kind } = state.visit;
  if (kind === null) return null;
  const visits = { ...state.visits, [kind]: state.visits[kind] + 1 };
  let next: GameState = { ...state, visits };
  let gift: WelcomeResult['gift'];
  if (kind === 'cuttings') {
    const generator = cuttingsGenerator(state);
    if (generator) {
      const units = cuttingsUnits(state);
      next = {
        ...next,
        generators: { ...next.generators, [generator]: state.generators[generator] + units },
      };
      gift = { generator, units };
    }
  } else {
    const effect = VISIT_EFFECTS[kind];
    // Welcoming the same visitor again restarts its effect rather than stacking it.
    next = {
      ...next,
      effects: [
        ...state.effects.filter((e) => e.kind !== effect),
        { kind: effect, remaining: effectSeconds(state, effect) },
      ],
    };
  }
  // §5.7 (M31): a welcomed visitor leaves pollen on the flower.
  return {
    state: unlockAchievements(scheduleNext(addPollen(next, POLLEN_PER_MOMENT))),
    kind,
    gift,
  };
}
