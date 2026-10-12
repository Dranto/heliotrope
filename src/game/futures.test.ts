import { ACHIEVEMENT_LIST } from './achievements';
import {
  createDecorState,
  DECOR_IDS,
  DECOR_SLOTS,
  isDecorOpen,
  isFlowerColourUnlocked,
  nextDecor,
  placeDecor,
  setFlowerColour,
  unlockedDecor,
} from './decor';
import { PARCEL_LIST, parcelBonuses } from './parcels';
import { clickValue, generatorMultiplier } from './production';
import { canChangeFuture, changeFuture, futureOf, restoreParcel } from './restoration';
import { deserialize, serialize } from './save';
import { startNewSeason } from './seasons';
import { SPECIES_IDS } from './species';
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
    expect(generatorMultiplier(second, 'pot') / generatorMultiplier(first, 'pot')).toBeCloseTo(2);
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

describe('The decor of the neighbourhood (§6.5, M16)', () => {
  it('opens with the tenth Milestone, then pieces come with Milestones and species', () => {
    expect(isDecorOpen(rich({ achievements: milestones(9) }))).toBe(false);
    const ten = rich({ achievements: milestones(10) });
    expect(unlockedDecor(ten)).toEqual(['bench']);
    const many = rich({ achievements: milestones(80), species: [...SPECIES_IDS] });
    expect(unlockedDecor(many)).toEqual([...DECOR_IDS]);
  });

  it('a spot cycles through the pieces won, then empties again', () => {
    const state = rich({ achievements: milestones(10), species: SPECIES_IDS.slice(0, 3) });
    expect(nextDecor(state, null)).toBe('bench');
    expect(nextDecor(state, 'bench')).toBe('planter');
    expect(nextDecor(state, 'planter')).toBeNull();
    const placed = placeDecor(state, 2, 'planter');
    expect(placed.decor.slots[2]).toBe('planter');
    expect(placeDecor(placed, 2, 'fresco')).toBe(placed);
    expect(placeDecor(placed, DECOR_SLOTS, 'bench')).toBe(placed);
    expect(placeDecor(placed, 2, null).decor.slots).toEqual(createDecorState().slots);
    expect(startNewSeason(placed).decor).toEqual(placed.decor);
  });

  it('the flower colours come with Milestones and species', () => {
    const state = rich({ achievements: milestones(20) });
    expect(isFlowerColourUnlocked(state, 'gold')).toBe(true);
    expect(setFlowerColour(state, 'blue')).toBe(state);
    expect(setFlowerColour(state, 'gold').decor.flower).toBe('gold');
  });

  it('round-trips through a save and migrates a v17 save without decor', () => {
    const state = setFlowerColour(
      placeDecor(rich({ achievements: milestones(30) }), 0, 'lanterns'),
      'gold',
    );
    expect(deserialize(serialize(state), 0)!.decor).toEqual(state.decor);
    const { decor: _decor, futures: _futures, ...rest } = state;
    const old = deserialize(JSON.stringify({ ...rest, version: 17 }), 0)!;
    expect(old.decor).toEqual(createDecorState());
    expect(old.futures).toEqual({ chosen: {}, changed: {} });
    const raw = JSON.parse(serialize(state));
    raw.decor = { slots: ['rocket', 'bench'], flower: 'black' };
    expect(deserialize(JSON.stringify(raw), 0)!.decor).toEqual({
      ...createDecorState(),
      slots: [null, 'bench', ...createDecorState().slots.slice(2)],
    });
  });
});
