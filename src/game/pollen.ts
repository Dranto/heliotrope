// The pollen (docs/game-design.md §5.6, M27): clicking the flower fills a gauge around its crown,
// and a full gauge sends a flight of golden pollen across the city: every building produces more
// for a few seconds, the courtyard garden grows a step, and a butterfly caught meanwhile lasts
// longer. The gauge slowly empties when the clicks stop, and never takes anything else away.
import { factorOf } from './bonuses';
import { EFFECTS } from './effects';
import { growGarden } from './garden';
import { clickUpgradeCount } from './production';
import type { GameState } from './state';

/** Gauge filled by one click, before the click upgrades: a full gauge every 200 clicks. */
export const POLLEN_PER_CLICK = 1 / 200;
/** Each click upgrade bought this Season fills the gauge 5% faster. */
export const POLLEN_FILL_PER_CLICK_UPGRADE = 0.05;
/** Share of the gauge lost per second of play: an untouched full gauge empties in 250 s. */
export const POLLEN_DECAY = 0.004;
/** Seconds of growth a flight gives each crop of the courtyard garden, at its current speed. */
export const FLIGHT_GARDEN_SECONDS = 60;
/** A butterfly caught during a flight: its Floraison, Pollinisation or Averse lasts ×1.5. */
export const FLIGHT_BUTTERFLY_FACTOR = 1.5;
/** Flights in a row add their seconds up to this many seconds of flight. */
export const FLIGHT_MAX_SECONDS = 60;

export interface PollenState {
  /** The gauge around the flower, from 0 to 1. */
  gauge: number;
  /** Flights sent over all Seasons. */
  flights: number;
}

export function createPollenState(): PollenState {
  return { gauge: 0, flights: 0 };
}

/** How fast the clicks fill the gauge: the click upgrades and the paths that feed it (§5.5). */
export function pollenFill(state: GameState): number {
  return (
    (1 + POLLEN_FILL_PER_CLICK_UPGRADE * clickUpgradeCount(state)) * factorOf(state, 'pollenFill')
  );
}

export function isFlying(state: GameState): boolean {
  return state.effects.some((effect) => effect.kind === 'flight');
}

/**
 * Player action, also used for the simulator's batched clicks: `clicks` clicks fill the gauge, and
 * each time it is full a flight sets off. Flights in a row add their seconds together, up to
 * FLIGHT_MAX_SECONDS.
 */
export function pollinate(state: GameState, clicks = 1): GameState {
  if (clicks <= 0) return state;
  const filled = state.pollen.gauge + clicks * POLLEN_PER_CLICK * pollenFill(state);
  const flights = Math.floor(filled);
  const next: GameState = {
    ...state,
    pollen: { gauge: filled - flights, flights: state.pollen.flights + flights },
  };
  return flights > 0 ? sendFlights(next, flights) : next;
}

function sendFlights(state: GameState, count: number): GameState {
  const seconds = EFFECTS.flight.seconds * count;
  const current = state.effects.find((effect) => effect.kind === 'flight');
  const effects = current
    ? state.effects.map((effect) =>
        effect === current
          ? { ...effect, remaining: Math.min(FLIGHT_MAX_SECONDS, effect.remaining + seconds) }
          : effect,
      )
    : [
        ...state.effects,
        { kind: 'flight' as const, remaining: Math.min(FLIGHT_MAX_SECONDS, seconds) },
      ];
  return growGarden({ ...state, effects }, FLIGHT_GARDEN_SECONDS * count);
}

/** The gauge slowly empties over dtSeconds of play. */
export function decayPollen(state: GameState, dtSeconds: number): GameState {
  if (state.pollen.gauge <= 0) return state;
  return {
    ...state,
    pollen: { ...state.pollen, gauge: Math.max(0, state.pollen.gauge - POLLEN_DECAY * dtSeconds) },
  };
}

export function validPollen(raw: unknown): PollenState {
  const data = (raw ?? {}) as Partial<PollenState>;
  const gauge =
    typeof data.gauge === 'number' && data.gauge >= 0 && data.gauge < 1 ? data.gauge : 0;
  const flights =
    typeof data.flights === 'number' && Number.isInteger(data.flights) && data.flights >= 0
      ? data.flights
      : 0;
  return { gauge, flights };
}
