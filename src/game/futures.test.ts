import { ACHIEVEMENT_LIST } from './achievements';
import { PARCEL_LIST, parcelBonuses } from './parcels';
import { clickValue } from './production';
import { canChangeFuture, changeFuture, futureOf, restoreParcel } from './restoration';
import { deserialize, serialize } from './save';
import { seasonRipeningSeconds, startNewSeason } from './seasons';
import { createInitialState, type GameState } from './state';
import { withAllIntroduced } from './introductions';

/** A new game whose mechanics are all introduced (§10.8), to test them directly. */
const openGame = (now: number) => withAllIntroduced(createInitialState(now));
function rich(patch: Partial<GameState> = {}): GameState {
  return {
    ...openGame(0),
    resources: { water: 0, light: 1e12 },
    totalLight: 1e12,
    allTimeLight: 1e12,
    ...patch,
  };
}

const milestones = (count: number) => ACHIEVEMENT_LIST.slice(0, count).map((a) => a.id);

describe('The two futures of a parcel (§6.5, M16)', () => {
  it('every parcel has a second future that differs from the first', () => {
    for (const parcel of PARCEL_LIST) {
      expect(parcel.second.length).toBeGreaterThan(0);
      expect(parcelBonuses(parcel.id, 1)).not.toEqual(parcelBonuses(parcel.id, 0));
    }
  });

  it('restoring in the second future gives its bonuses instead of the first ones', () => {
    const first = restoreParcel(rich(), 'gardenStreet');
    const second = restoreParcel(rich(), 'gardenStreet', 1);
    expect(futureOf(first, 'gardenStreet')).toBe(0);
    expect(futureOf(second, 'gardenStreet')).toBe(1);
    expect(clickValue(first) / clickValue(second)).toBeCloseTo(2);
    // Since lot 7 the second future serves the Seeds: the Season ripens 20 s sooner.
    expect(seasonRipeningSeconds(first) - seasonRipeningSeconds(second)).toBe(20);
  });

  it('changes once in every Cycle of water, and keeps the change across Seasons', () => {
    const state = restoreParcel(rich(), 'gardenStreet');
    expect(canChangeFuture(rich(), 'gardenStreet')).toBe(false);
    const changed = changeFuture(state, 'gardenStreet', 1);
    expect(futureOf(changed, 'gardenStreet')).toBe(1);
    expect(changeFuture(changed, 'gardenStreet', 0)).toBe(changed);
    expect(futureOf(startNewSeason(changed), 'gardenStreet')).toBe(1);
    const nextCycle = { ...changed, cycles: changed.cycles + 1 };
    expect(futureOf(changeFuture(nextCycle, 'gardenStreet', 0), 'gardenStreet')).toBe(0);
  });

  it('round-trips through a save, which drops futures of parcels not restored', () => {
    const state = changeFuture(restoreParcel(rich(), 'river', 1), 'river', 0);
    const loaded = deserialize(serialize(state), 0)!;
    expect(loaded.futures).toEqual(state.futures);
    const raw = JSON.parse(serialize(restoreParcel(rich(), 'park', 1)));
    raw.futures.chosen.orchard = 1;
    raw.futures.chosen.park = 3;
    expect(deserialize(JSON.stringify(raw), 0)!.futures.chosen).toEqual({});
  });
});

describe('The futures in a save (§6.5, M16)', () => {
  it('migrates a v17 save with the first futures', () => {
    const state = rich({ achievements: milestones(30) });
    const { futures: _futures, ...rest } = state;
    const old = deserialize(JSON.stringify({ ...rest, version: 17 }), 0)!;
    expect(old.futures).toEqual({ chosen: {}, changed: {} });
  });
});
