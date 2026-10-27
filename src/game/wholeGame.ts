// The whole game measured (docs/game-design.md §8, M30): the reference player of the simulator
// plays from the first click to the second sister city, in sessions: an hour
// of play, then three hours away while the game goes on offline (§9.1), as a player who comes
// back every few hours. At each coming and going it tends the courtyard garden, rotating its
// crops with the strawberries since v5 (M36). Pure and headless, like the simulator it drives.
import { buyWorkshop, canSwarm, swarm, type LandscapeId, type WorkshopId } from './cities';
import { CROP_IDS, canSow, harvest, isRipe, sow, type CropId } from './garden';
import { applyOfflineProgress } from './offline';
import {
  learnReferenceTalents,
  simulateCycles,
  simulateFirstCycle,
  simulateTwoSeasons,
  type SimulationOptions,
} from './simulator';
import type { GameState } from './state';

/** The reference player plays this many seconds at a time... */
export const REFERENCE_SESSION_SECONDS = 3600;
/** ...then is away this long, the game going on offline. */
export const REFERENCE_AWAY_SECONDS = 3 * 3600;
/**
 * What the reference player sows in each bed, in turn: different neighbours for varieties, and
 * each bed rotates through them (M32), the strawberries ripening while it is away.
 */
export const REFERENCE_CROPS: readonly CropId[] = ['beans', 'squash', 'sunflower', 'strawberry'];
/** §8 whole-game targets (M30): seconds of play when each sister city is founded. */
export const WHOLE_GAME_TARGETS: readonly number[] = [4 * 3600, 5 * 3600];
/** The landscapes of the two sister cities the reference player founds, in order. */
export const REFERENCE_LANDSCAPES: readonly LandscapeId[] = ['plain', 'forest'];
/** The workshop's rules the reference player learns, in this order, as far as the Savoirs go. */
export const REFERENCE_WORKSHOP: readonly WorkshopId[] = [
  'memory',
  'seedlings',
  'builders',
  'schools',
  'wells',
  'trade',
];

/** Harvest every ripe bed and sow every bare one, the crop after the bed's last one. */
function tendGarden(state: GameState): GameState {
  let next = state;
  next.garden.plots.forEach((plot, i) => {
    if (plot.crop !== null && isRipe(plot)) next = harvest(next, i)?.state ?? next;
  });
  next.garden.plots.forEach((plot, i) => {
    const last = plot.last ? REFERENCE_CROPS.indexOf(plot.last) : -1;
    const turn = last >= 0 ? last + 1 : i;
    const wanted = Array.from(
      { length: REFERENCE_CROPS.length },
      (_, k) => REFERENCE_CROPS[(turn + k) % REFERENCE_CROPS.length]!,
    ).filter((c) => c !== plot.last);
    const crop = [...wanted, ...CROP_IDS].find((c) => canSow(next, i, c));
    if (crop) next = sow(next, i, crop);
  });
  return next;
}

/** Everything the reference player does on a visit to the small loops. */
export function tendLoops(state: GameState): GameState {
  return tendGarden(state);
}

/** Learn the reference rules of the workshop as far as the Savoirs go, cheapest level first. */
export function tendWorkshop(state: GameState): GameState {
  let next = state;
  for (;;) {
    const learnt = REFERENCE_WORKSHOP.map((id) => buyWorkshop(next, id)).find((s) => s !== next);
    if (!learnt) return next;
    next = learnt;
  }
}

/** The reference player's sessions, as a tend hook for the simulator; counts the time away. */
export function referenceSessions(): {
  tend: NonNullable<SimulationOptions['tend']>;
  away: () => number;
} {
  let played = 0;
  let away = 0;
  return {
    tend: (state, dt) => {
      played += dt;
      if (played < REFERENCE_SESSION_SECONDS) return state;
      played = 0;
      away += REFERENCE_AWAY_SECONDS;
      const left = tendLoops(state);
      const back = applyOfflineProgress(left, left.lastUpdate + REFERENCE_AWAY_SECONDS * 1000);
      return tendLoops(back.state);
    },
    away: () => away,
  };
}

export interface CityRun {
  /** Seconds of play in this city, from its foundation (or the first click) to swarming. */
  seconds: number;
  /** Cycles of water played in it. */
  cycles: number;
}

export interface Moment {
  /** Seconds of play so far. */
  played: number;
  /** Seconds of real time so far: play and time away. */
  real: number;
}

export interface WholeGame {
  /** Each city lived in, in order: the home city, then the sister cities. */
  cities: CityRun[];
  /** When each sister city was founded, in order. */
  swarms: Moment[];
  /** Seconds of play in all. */
  seconds: number;
  state: GameState;
}

/**
 * Play the whole game (§8, M30): the home city as the endgame measures it, Cycle after Cycle
 * until swarming is allowed, then each sister city of REFERENCE_LANDSCAPES the same way, the
 * small loops tended all along. Stops once `cities` cities are left behind, or after
 * `maxSeconds` of play.
 */
export function simulateWholeGame({
  cities = REFERENCE_LANDSCAPES.length,
  maxSeconds = 120 * 3600,
  maxCityCycles = 30,
  ...options
}: Omit<SimulationOptions, 'state' | 'stopAtSeeds' | 'maxSeconds' | 'tend'> & {
  cities?: number;
  maxSeconds?: number;
  maxCityCycles?: number;
} = {}): WholeGame {
  const { tend, away } = referenceSessions();
  const runs: CityRun[] = [];
  const swarms: Moment[] = [];
  let total = 0;
  const moment = (played: number): Moment => ({ played, real: played + away() });
  // The home city starts with the two first Seasons, as the pacing table measures them.
  const { first, second } = simulateTwoSeasons({ ...options, tend });
  let state = second.state;
  let elapsed = first.seconds + second.seconds;
  for (let city = 0; city < cities && total < maxSeconds; city++) {
    const opened = simulateFirstCycle({
      ...options,
      tend,
      from: state,
      elapsed,
      maxSeconds: elapsed + Math.max(0, maxSeconds - total),
    });
    state = opened.state;
    let seconds = opened.seasons.reduce((a, b) => a + b, 0) + elapsed;
    let cycles = 0;
    while (!canSwarm(state) && cycles < maxCityCycles && total + seconds < maxSeconds) {
      const run = simulateCycles({ ...options, tend, from: state, count: 1 });
      state = run.state;
      seconds += run.cycles[0]!.seconds;
      cycles += 1;
    }
    total += seconds;
    runs.push({ seconds, cycles });
    const landscape = REFERENCE_LANDSCAPES[city];
    if (!canSwarm(state) || landscape === undefined) break;
    state = learnReferenceTalents(tendWorkshop(swarm(state, landscape)));
    swarms.push(moment(total));
    elapsed = 0;
  }
  return { cities: runs, swarms, seconds: total, state };
}
