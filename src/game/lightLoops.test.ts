import { describe, expect, it } from 'vitest';
import {
  CROPS,
  growthSpeed,
  harvest,
  harvestAll,
  hasRipe,
  isCropUnlocked,
  plotSpeed,
  ROTATION_FACTOR,
  sow,
  STRAWBERRY_POLLEN,
  varietyOf,
} from './garden';
import { withAllIntroduced } from './introductions';
import { deserialize, serialize } from './save';
import { createInitialState, STATE_VERSION, type GameState } from './state';

/** A player in the fourth Season, the garden and the Bioregion open. */
function opened(extra: Partial<GameState> = {}): GameState {
  const fresh = withAllIntroduced(createInitialState(0));
  return {
    ...fresh,
    seasons: 3,
    generators: { ...fresh.generators, pot: 20 },
    ...extra,
  };
}

function ripen(state: GameState, index: number): GameState {
  const plots = state.garden.plots.map((p, i) =>
    i === index && p.crop ? { ...p, grown: CROPS[p.crop].seconds } : p,
  );
  return { ...state, garden: { ...state.garden, plots } };
}

describe('the lighter garden (M32)', () => {
  it('rotates a crop sown after a different one: it grows faster', () => {
    let state = ripen(sow(opened(), 0, 'radish'), 0);
    state = harvest(state, 0)!.state;
    expect(state.garden.plots[0]!.last).toBe('radish');
    const same = sow(state, 0, 'radish');
    const other = sow(state, 0, 'beans');
    expect(same.garden.plots[0]!.rotated).toBe(false);
    expect(other.garden.plots[0]!.rotated).toBe(true);
    expect(plotSpeed(other, other.garden.plots[0]!)).toBeCloseTo(
      growthSpeed(other) * ROTATION_FACTOR,
    );
    const harvested = harvest(ripen(other, 0), 0)!.state;
    expect(harvested.garden.rotations).toBe(1);
  });

  it('opens the strawberries with the Bioregion; they fill the pollen gauge', () => {
    expect(isCropUnlocked(opened({ seasons: 1 }), 'strawberry')).toBe(false);
    expect(isCropUnlocked(opened(), 'strawberry')).toBe(true);
    const state = ripen(sow(opened(), 0, 'strawberry'), 0);
    const result = harvest(state, 0)!;
    expect(result.gain).toEqual({ kind: 'pollen' });
    expect(result.state.pollen.gauge).toBeCloseTo(STRAWBERRY_POLLEN);
    expect(varietyOf('radish', 'strawberry')).toBe('woodStrawberry');
    expect(varietyOf('squash', 'strawberry')).toBe('pineberry');
  });

  it('harvests everything ripe and sows the same crops again', () => {
    let state = sow(sow(opened(), 0, 'radish'), 1, 'radish');
    state = ripen(state, 0);
    expect(hasRipe(state)).toBe(true);
    const result = harvestAll(state)!;
    expect(result.crops.map((c) => c.crop)).toEqual(['radish']);
    expect(result.state.garden.plots[0]).toMatchObject({ crop: 'radish', grown: 0 });
    // Bed 1 was still growing: it is left as it was.
    expect(result.state.garden.plots[1]!.crop).toBe('radish');
    expect(hasRipe(result.state)).toBe(false);
    expect(harvestAll(result.state)).toBeNull();
  });

  it('keeps the rotation and the last crops in a save', () => {
    const state = sow(harvest(ripen(sow(opened(), 0, 'radish'), 0), 0)!.state, 0, 'beans');
    const loaded = deserialize(serialize(state), 0)!;
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.garden.plots[0]).toMatchObject({ crop: 'beans', last: 'radish', rotated: true });
  });
});
