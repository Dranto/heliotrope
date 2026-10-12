import { describe, expect, it } from 'vitest';
import { catchButterfly } from './butterfly';
import { EFFECTS } from './effects';
import { CROPS } from './garden';
import { choosePath } from './growth';
import { lightPerSecond } from './production';
import {
  decayPollen,
  FLIGHT_GARDEN_SECONDS,
  FLIGHT_MAX_SECONDS,
  POLLEN_DECAY,
  POLLEN_PER_CLICK,
  pollenFill,
  pollinate,
  validPollen,
} from './pollen';
import { deserialize, serialize } from './save';
import { createInitialState, type GameState } from './state';
import { clickHeliotrope, tick } from './tick';
import { withAllIntroduced } from './introductions';

/** A new game whose mechanics are all introduced (§10.8), to test them directly. */
const openGame = (now: number) => withAllIntroduced(createInitialState(now));
const CLICKS_PER_FLIGHT = Math.round(1 / POLLEN_PER_CLICK);

/** A second Season, where the gauge is always on the flower (§10.8). */
function fresh(extra: Partial<GameState> = {}): GameState {
  const state = openGame(0);
  return { ...state, seasons: 1, generators: { ...state.generators, pot: 10 }, ...extra };
}

function clicked(state: GameState, count: number): GameState {
  let next = state;
  for (let i = 0; i < count; i++) next = clickHeliotrope(next);
  return next;
}

describe('the pollen (§5.6, M27)', () => {
  it('joins the flower with the first click upgrade (§10.8)', () => {
    const first = openGame(0);
    expect(clickHeliotrope(first).pollen.gauge).toBe(0);
    const warm = { ...first, upgrades: ['warmHands' as const] };
    expect(clickHeliotrope(warm).pollen.gauge).toBeGreaterThan(0);
    const unintroduced = { ...warm, intro: createInitialState(0).intro };
    expect(clickHeliotrope(unintroduced).pollen.gauge).toBe(0);
  });

  it('fills the gauge with each click and sends a flight once full', () => {
    const almost = clicked(fresh(), CLICKS_PER_FLIGHT - 1);
    expect(almost.pollen.gauge).toBeCloseTo(1 - POLLEN_PER_CLICK);
    expect(almost.effects).toEqual([]);
    const full = clickHeliotrope(almost);
    expect(full.pollen.flights).toBe(1);
    expect(full.pollen.gauge).toBeCloseTo(0);
    expect(full.effects).toEqual([{ kind: 'flight', remaining: EFFECTS.flight.seconds }]);
    expect(lightPerSecond(full)).toBeCloseTo(lightPerSecond(almost) * EFFECTS.flight.factor);
    expect(tick(full, 0.1).achievements).toContain('firstFlight');
  });

  it('caps the seconds of many flights in a row', () => {
    const state = pollinate(fresh(), 20 * CLICKS_PER_FLIGHT);
    expect(state.pollen.flights).toBe(20);
    expect(state.effects).toEqual([{ kind: 'flight', remaining: FLIGHT_MAX_SECONDS }]);
  });

  it('adds the seconds of flights in a row, as batched clicks do', () => {
    const state = pollinate(fresh(), 2.5 * CLICKS_PER_FLIGHT);
    expect(state.pollen.flights).toBe(2);
    expect(state.pollen.gauge).toBeCloseTo(0.5);
    expect(state.effects).toEqual([{ kind: 'flight', remaining: 2 * EFFECTS.flight.seconds }]);
    expect(pollinate(state, 0)).toBe(state);
  });

  it('empties slowly when the clicks stop, and never below zero', () => {
    const half = pollinate(fresh(), CLICKS_PER_FLIGHT / 2);
    expect(tick(half, 10).pollen.gauge).toBeCloseTo(0.5 - 10 * POLLEN_DECAY);
    expect(decayPollen(half, 1000).pollen.gauge).toBe(0);
    const empty = fresh();
    expect(decayPollen(empty, 10)).toBe(empty);
  });

  it('fills faster with the click upgrades and the pot path that feeds it', () => {
    const base = fresh();
    expect(pollenFill(base)).toBe(1);
    expect(pollenFill({ ...base, upgrades: ['warmHands', 'gloves'] })).toBeCloseTo(1.1);
    const pots = { ...base, generators: { ...base.generators, pot: 200 } };
    const fed = [0, 1, 2].reduce<GameState>(
      (state, tier) => choosePath(state, 'pot', tier, tier === 2 ? 1 : 0),
      pots,
    );
    expect(pollenFill(fed)).toBeCloseTo(1.25);
  });

  it('moves the courtyard garden forward by a step', () => {
    const base = fresh();
    const plots = base.garden.plots.map((plot, i) =>
      i === 0 ? { ...plot, crop: 'squash' as const, grown: 0 } : plot,
    );
    const sown = { ...base, garden: { ...base.garden, plots } };
    const flown = pollinate(sown, CLICKS_PER_FLIGHT);
    expect(flown.garden.plots[0]!.grown).toBeCloseTo(FLIGHT_GARDEN_SECONDS);
    expect(flown.garden.plots[0]!.grown).toBeLessThan(CROPS.squash.seconds);
  });

  it('makes a butterfly caught during a flight last longer', () => {
    const base = fresh({ butterfly: { nextIn: 100, visible: 5 } });
    const caughtCalm = catchButterfly(base)!;
    const caughtFlying = catchButterfly(pollinate(base, CLICKS_PER_FLIGHT))!;
    expect(caughtFlying.outcome).toBe(caughtCalm.outcome);
    if (caughtCalm.outcome === 'harvest') return;
    const calm = caughtCalm.state.effects.find((e) => e.kind === caughtCalm.outcome)!;
    const flying = caughtFlying.state.effects.find((e) => e.kind === caughtCalm.outcome)!;
    expect(flying.remaining).toBeCloseTo(calm.remaining * 1.5);
  });

  it('keeps the gauge in the save and reads a bad one as empty', () => {
    const state = pollinate(fresh(), 3.5 * CLICKS_PER_FLIGHT);
    expect(deserialize(serialize(state), 0)!.pollen).toEqual(state.pollen);
    // Flights in a row and a butterfly caught meanwhile outlast a single effect, and still load.
    expect(deserialize(serialize(state), 0)!.effects).toEqual(state.effects);
    const lengthened = [{ kind: 'bloom' as const, remaining: EFFECTS.bloom.seconds * 1.5 }];
    expect(deserialize(serialize({ ...state, effects: lengthened }), 0)!.effects).toEqual(
      lengthened,
    );
    expect(validPollen({ gauge: 3, flights: -1 })).toEqual({ gauge: 0, flights: 0 });
    const { pollen: _pollen, ...old } = JSON.parse(serialize(openGame(0)));
    expect(deserialize(JSON.stringify({ ...old, version: 27 }), 0)!.pollen).toEqual({
      gauge: 0,
      flights: 0,
    });
  });
});
