import { describe, expect, it } from 'vitest';
import { BOND_BONUS, BOND_MAX } from './bonds';
import { globalMultiplier, lightPerSecond } from './production';
import {
  advanceRequests,
  canPlayHand,
  canServe,
  createRequestsState,
  declineRequest,
  isRequestMet,
  MAX_HANDS,
  MAX_REQUESTS,
  playHand,
  QUARTER_SECONDS,
  REQUEST_INTERVAL,
  requestProgress,
  serveRequest,
  validRequests,
  type Request,
} from './requests';
import { deserialize, serialize } from './save';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';

/** A state in its second Season, when the neighbours start asking. */
function opened(): GameState {
  return { ...createInitialState(0), seasons: 1 };
}

function asking(request: Request, state = opened()): GameState {
  return { ...state, requests: { ...state.requests, open: [request] } };
}

const harvests: Request = {
  need: { kind: 'harvests', count: 3 },
  base: 0,
  hand: 'quarter',
  from: null,
};

describe('the neighbours’ requests (§9.11, M29)', () => {
  it('only come from the second Season, one every few minutes, three at most', () => {
    const first = createInitialState(0);
    expect(advanceRequests(first, 10_000)).toBe(first);
    const state = opened();
    expect(advanceRequests(state, REQUEST_INTERVAL / 2 - 1).requests.open).toHaveLength(0);
    expect(advanceRequests(state, REQUEST_INTERVAL / 2 + 1).requests.open).toHaveLength(1);
    // A long absence fills the three places, the same as many short steps.
    const long = advanceRequests(state, 10 * REQUEST_INTERVAL);
    expect(long.requests.open).toHaveLength(MAX_REQUESTS);
    let stepped = state;
    for (let i = 0; i < 100; i++) stepped = advanceRequests(stepped, 30);
    expect(stepped.requests.open).toEqual(long.requests.open);
  });

  it('never change what the Golden Butterfly gives', () => {
    const state = opened();
    expect(tick(state, 3 * REQUEST_INTERVAL).rngSeed).toBe(state.rngSeed);
  });

  it('count only what is done after they came, and buildings owned', () => {
    const state = asking({ ...harvests, base: 4 });
    const withHarvests = (n: number) => ({ ...state, garden: { ...state.garden, harvests: n } });
    expect(requestProgress(withHarvests(4), state.requests.open[0]!)).toBe(0);
    expect(isRequestMet(withHarvests(6), state.requests.open[0]!)).toBe(false);
    expect(isRequestMet(withHarvests(7), state.requests.open[0]!)).toBe(true);
    const owned: Request = {
      need: { kind: 'owned', generator: 'balconyPanel', count: 10 },
      base: 0,
      hand: 'bloom',
      from: null,
    };
    const built = { ...opened(), generators: { ...opened().generators, balconyPanel: 12 } };
    expect(requestProgress(built, owned)).toBe(10);
  });

  it('give a hand to keep in reserve when served, three at most', () => {
    const state = asking(harvests);
    expect(canServe(state, 0)).toBe(false);
    const met = { ...state, garden: { ...state.garden, harvests: 3 } };
    const served = serveRequest(met, 0);
    expect(served.requests.open).toHaveLength(0);
    expect(served.requests.hands).toEqual(['quarter']);
    expect(served.requests.served).toBe(1);
    const full = { ...met, requests: { ...met.requests, hands: Array(MAX_HANDS).fill('bloom') } };
    expect(canServe(full, 0)).toBe(false);
    expect(serveRequest(full, 0)).toBe(full);
  });

  it('can be declined for another one at once', () => {
    const state = asking(harvests);
    const declined = declineRequest(state, 0);
    expect(declined.requests.open).toHaveLength(1);
    expect(declined.requests.seed).not.toBe(state.requests.seed);
    expect(declineRequest(state, 2)).toBe(state);
  });

  it('play their hands when the player wants', () => {
    const base = opened();
    const withHand = (hand: Request['hand'], state = base): GameState => ({
      ...state,
      requests: { ...state.requests, hands: [hand] },
    });
    const producing = { ...base, generators: { ...base.generators, balconyPanel: 10 } };
    const quarter = playHand(withHand('quarter', producing), 0);
    expect(quarter.requests.hands).toHaveLength(0);
    expect(quarter.resources.light - producing.resources.light).toBeCloseTo(
      lightPerSecond(producing) * QUARTER_SECONDS,
    );
    expect(playHand(withHand('bloom'), 0).effects.some((e) => e.kind === 'bloom')).toBe(true);
    expect(playHand(withHand('flight'), 0).effects.some((e) => e.kind === 'flight')).toBe(true);
    // Ripening needs a crop growing; it ripens the one closest to ripe.
    expect(canPlayHand(withHand('ripen'), 0)).toBe(false);
    const plots = base.garden.plots.map((p, i) =>
      i === 0
        ? { crop: 'squash' as const, grown: 10 }
        : i === 1
          ? { crop: 'radish' as const, grown: 60 }
          : p,
    );
    const growing = withHand('ripen', { ...base, garden: { ...base.garden, plots } });
    const ripened = playHand(growing, 0).garden.plots;
    expect(ripened[1]!.grown).toBe(180);
    expect(ripened[0]!.grown).toBe(10);
  });

  it('strengthen a bond with a neighbouring district served, up to a cap', () => {
    const state = asking({ ...harvests, from: 'tanneries' });
    const met = { ...state, garden: { ...state.garden, harvests: 3 } };
    const served = serveRequest(met, 0);
    expect(served.requests.bonds).toEqual({ tanneries: 1 });
    expect(globalMultiplier(served)).toBeCloseTo(globalMultiplier(met) * (1 + BOND_BONUS));
    const capped = { ...met, requests: { ...met.requests, bonds: { tanneries: BOND_MAX + 5 } } };
    expect(globalMultiplier(capped)).toBeCloseTo(
      globalMultiplier(met) * (1 + BOND_BONUS * BOND_MAX),
    );
  });

  it('bring Milestones for the first and the 25th request served', () => {
    const state = opened();
    expect(
      tick({ ...state, requests: { ...state.requests, served: 1 } }, 1).achievements,
    ).toContain('firstFavour');
    expect(
      tick({ ...state, requests: { ...state.requests, served: 25 } }, 1).achievements,
    ).toContain('goodNeighbour');
  });

  it('are kept in the save, and a bad or older save starts afresh', () => {
    const met = asking({ ...harvests, from: 'railyard' });
    const state = serveRequest({ ...met, garden: { ...met.garden, harvests: 3 } }, 0);
    const later = advanceRequests(state, REQUEST_INTERVAL);
    expect(deserialize(serialize(later), 0)!.requests).toEqual(later.requests);
    const fallback = createRequestsState(1);
    expect(validRequests('nope', fallback)).toBe(fallback);
    const cleaned = validRequests(
      {
        ...later.requests,
        open: [{ need: { kind: 'gold', count: 1 }, base: 0, hand: 'quarter', from: null }],
        hands: ['quarter', 'magic'],
        bonds: { atlantis: 3, railyard: 2 },
      },
      fallback,
    );
    expect(cleaned.open).toEqual([]);
    expect(cleaned.hands).toEqual(['quarter']);
    expect(cleaned.bonds).toEqual({ railyard: 2 });
    const { requests: _requests, ...old } = JSON.parse(serialize(createInitialState(0)));
    const loaded = deserialize(JSON.stringify({ ...old, version: 29 }), 0)!;
    expect(loaded.requests.open).toEqual([]);
    expect(loaded.requests.served).toBe(0);
  });
});
