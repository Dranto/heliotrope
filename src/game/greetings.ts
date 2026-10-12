// Greeting a species on the map (docs/game-design.md §9.15, M35): a species back in the Herbier
// can be clicked where it lives, once per passage, for a small step of the pollen gauge (§5.6).
// The greetings are counted per species: the neighbours' requests ask to see one (§9.11).
import { unlockAchievements } from './achievements';
import { addPollen } from './pollen';
import { isSpeciesId, type SpeciesId } from './species';
import type { GameState } from './state';

/** Seconds of play before a species greeted passes by again. */
export const GREET_COOLDOWN = 10 * 60;
/** Share of the pollen gauge a greeting fills. */
export const POLLEN_PER_GREETING = 0.04;

export interface GreetingsState {
  /** Greetings of each species, over the whole game. */
  counts: Partial<Record<SpeciesId, number>>;
  /** Play time (state.playSeconds) of each species' last greeting. */
  last: Partial<Record<SpeciesId, number>>;
}

export function createGreetingsState(): GreetingsState {
  return { counts: {}, last: {} };
}

/** Greetings over every species. */
export function totalGreetings(state: Pick<GameState, 'greetings'>): number {
  return Object.values(state.greetings.counts).reduce((sum, n) => sum + (n ?? 0), 0);
}

/** A species back on the map that has not been greeted during this passage. */
export function canGreet(state: GameState, id: SpeciesId): boolean {
  if (!state.species.includes(id)) return false;
  const last = state.greetings.last[id];
  return (
    last === undefined || last > state.playSeconds || state.playSeconds - last >= GREET_COOLDOWN
  );
}

/** Player action: greet a species where it lives on the map. */
export function greetSpecies(state: GameState, id: SpeciesId): GameState {
  if (!canGreet(state, id)) return state;
  const { counts, last } = state.greetings;
  const next: GameState = {
    ...state,
    greetings: {
      counts: { ...counts, [id]: (counts[id] ?? 0) + 1 },
      last: { ...last, [id]: state.playSeconds },
    },
  };
  return unlockAchievements(addPollen(next, POLLEN_PER_GREETING));
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/** Keep only what a save can hold. */
export function validGreetings(raw: unknown): GreetingsState {
  const greetings = createGreetingsState();
  if (typeof raw !== 'object' || raw === null) return greetings;
  const { counts, last } = raw as Record<string, unknown>;
  if (typeof counts === 'object' && counts !== null) {
    for (const [id, n] of Object.entries(counts)) {
      if (isSpeciesId(id) && isCount(n) && n > 0) greetings.counts[id] = n;
    }
  }
  if (typeof last === 'object' && last !== null) {
    for (const [id, at] of Object.entries(last)) {
      if (isSpeciesId(id) && typeof at === 'number' && Number.isFinite(at) && at >= 0) {
        greetings.last[id] = at;
      }
    }
  }
  return greetings;
}
