import { describe, expect, it } from 'vitest';
import { bonusesOf, globalBonus } from './bonuses';
import { changeFuture } from './restoration';
import { corridors, familyOf, longestCorridor, NEIGHBOURS } from './corridors';
import { PARCEL_IDS, type Future, type ParcelId } from './parcels';
import { isHerbierComplete, SPECIES_IDS, unlockSpecies } from './species';
import { createInitialState, type GameState } from './state';

function withParcels(list: [ParcelId, Future][]): GameState {
  const state = createInitialState(0);
  const chosen: Partial<Record<ParcelId, Future>> = {};
  for (const [id, future] of list) if (future === 1) chosen[id] = 1;
  return {
    ...state,
    parcels: list.map(([id]) => id),
    futures: { ...state.futures, chosen },
  };
}

describe('corridors (§6.7)', () => {
  it('only links parcels that exist, never a parcel to itself', () => {
    for (const [a, b] of NEIGHBOURS) {
      expect(PARCEL_IDS).toContain(a);
      expect(PARCEL_IDS).toContain(b);
      expect(a).not.toBe(b);
    }
  });

  it('forms no corridor from a lone parcel or from parcels of different families', () => {
    expect(corridors(withParcels([['gardenStreet', 0]]))).toEqual([]);
    // The play street joins no corridor; the river is blue.
    expect(
      corridors(
        withParcels([
          ['gardenStreet', 1],
          ['pollinatorStrip', 0],
        ]),
      ),
    ).toEqual([]);
    expect(
      corridors(
        withParcels([
          ['gardenStreet', 0],
          ['river', 0],
        ]),
      ),
    ).toEqual([]);
  });

  it('joins neighbouring parcels of one family, through every link', () => {
    const state = withParcels([
      ['gardenStreet', 0],
      ['pollinatorStrip', 0],
      ['orchard', 0],
      ['squares', 0],
    ]);
    const [green] = corridors(state);
    expect(green?.family).toBe('green');
    expect(green?.parcels).toEqual(['gardenStreet', 'pollinatorStrip', 'orchard', 'squares']);
    expect(longestCorridor(state, 'green')).toBe(4);
    expect(globalBonus(state)).toBeCloseTo(0.08);
  });

  it('lets the squares tip from the green corridor into the blue one', () => {
    const parcels: [ParcelId, Future][] = [
      ['gardenStreet', 0],
      ['pollinatorStrip', 0],
      ['rainGardens', 0],
      ['river', 0],
    ];
    const green = withParcels([...parcels, ['squares', 0]]);
    expect(longestCorridor(green, 'green')).toBe(3);
    expect(longestCorridor(green, 'blue')).toBe(2);
    const blue = withParcels([...parcels, ['squares', 1]]);
    expect(longestCorridor(blue, 'green')).toBe(2);
    expect(longestCorridor(blue, 'blue')).toBe(3);
    expect(familyOf(blue, 'squares')).toBe('blue');
    const water = bonusesOf(blue, 'water').filter((b) => b.factor === 1.15);
    expect(water).toHaveLength(1);
  });

  it('brings back its species from three parcels, kept when the corridor breaks', () => {
    let state = withParcels([
      ['rainGardens', 0],
      ['river', 0],
    ]);
    expect(unlockSpecies(state).species).not.toContain('newt');
    state = unlockSpecies({ ...state, parcels: [...state.parcels, 'squares'] });
    expect(state.species).not.toContain('newt');
    state = unlockSpecies(changeFuture(state, 'squares', 1));
    expect(state.species).toContain('newt');
    const changed = { ...state, futures: { ...state.futures, chosen: {} } };
    expect(longestCorridor(changed, 'blue')).toBe(2);
    expect(changed.species).toContain('newt');
  });

  it('leaves the corridor species out of the neighbourhood Herbier', () => {
    const state = createInitialState(0);
    const without = SPECIES_IDS.filter(
      (id) =>
        !['greenWoodpecker', 'newt', 'otter', 'salmon', 'blackStork'].includes(id) &&
        !['skylark', 'swallow', 'dragonfly', 'redstart'].includes(id),
    );
    expect(isHerbierComplete({ ...state, species: without })).toBe(true);
  });
});
