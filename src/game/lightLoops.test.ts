import { describe, expect, it } from 'vitest';
import { unlockAchievements } from './achievements';
import {
  CROP_WEATHER_FACTOR,
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
  weatherCrop,
} from './garden';
import { withAllIntroduced } from './introductions';
import {
  FRUIT_BASKETS,
  FRUIT_SECONDS,
  fruitBaskets,
  pickFruit,
  spendHoney,
  TREE_AGE_PICKS,
  TREE_SECONDS,
  treeAge,
} from './orchard';
import { deserialize, serialize } from './save';
import { createInitialState, STATE_VERSION, type GameState } from './state';

/** A player in the third Season, the garden and the orchard open, one hive set. */
function opened(extra: Partial<GameState> = {}): GameState {
  const fresh = withAllIntroduced(createInitialState(0));
  return {
    ...fresh,
    seasons: 3,
    generators: { ...fresh.generators, pot: 20 },
    orchard: { ...fresh.orchard, hives: 1 },
    ...extra,
  };
}

function ripen(state: GameState, index: number): GameState {
  const plots = state.garden.plots.map((p, i) =>
    i === index && p.crop ? { ...p, grown: CROPS[p.crop].seconds } : p,
  );
  return { ...state, garden: { ...state.garden, plots } };
}

describe('the lighter garden and orchard (M32)', () => {
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

  it('lets each weather favour its crop once the sky is open', () => {
    const base = sow(opened(), 0, 'sunflower');
    const sunny = { ...base, weather: { ...base.weather, current: 'sun' as const } };
    const misty = { ...base, weather: { ...base.weather, current: 'mist' as const } };
    expect(weatherCrop(sunny)).toBe('sunflower');
    expect(plotSpeed(sunny, sunny.garden.plots[0]!) / growthSpeed(sunny)).toBeCloseTo(
      CROP_WEATHER_FACTOR,
    );
    expect(plotSpeed(misty, misty.garden.plots[0]!)).toBeCloseTo(growthSpeed(misty));
    const first = { ...sunny, seasons: 0, cycles: 0 };
    expect(weatherCrop(first)).toBeNull();
  });

  it('opens the strawberries with the first hive; they fill the pollen gauge', () => {
    expect(
      isCropUnlocked(opened({ orchard: { ...opened().orchard, hives: 0 } }), 'strawberry'),
    ).toBe(false);
    expect(isCropUnlocked(opened(), 'strawberry')).toBe(true);
    const state = ripen(sow(opened(), 0, 'strawberry'), 0);
    const result = harvest(state, 0)!;
    expect(result.gain).toEqual({ kind: 'pollen' });
    expect(result.state.pollen.gauge).toBeCloseTo(STRAWBERRY_POLLEN);
    expect(varietyOf('radish', 'strawberry')).toBe('woodStrawberry');
    expect(varietyOf('squash', 'strawberry')).toBe('pineberry');
  });

  it('harvests everything ripe, sows the same crops again and picks the trees', () => {
    let state = sow(sow(opened(), 0, 'radish'), 1, 'radish');
    state = ripen(state, 0);
    state = {
      ...state,
      orchard: {
        ...state.orchard,
        trees: { ...state.orchard.trees, apple: { age: TREE_SECONDS, fruit: FRUIT_SECONDS } },
      },
    };
    expect(hasRipe(state)).toBe(true);
    const result = harvestAll(state)!;
    expect(result.crops.map((c) => c.crop)).toEqual(['radish']);
    expect(result.fruits.map((f) => f.id)).toEqual(['apple']);
    expect(result.state.garden.plots[0]).toMatchObject({ crop: 'radish', grown: 0 });
    // Bed 1 was still growing: it is left as it was.
    expect(result.state.garden.plots[1]!.crop).toBe('radish');
    expect(result.state.orchard.trees.apple.picks).toBe(1);
    expect(hasRipe(result.state)).toBe(false);
    expect(harvestAll(result.state)).toBeNull();
  });

  it('ages a tree picked often: one more basket at each age', () => {
    const tree = { age: TREE_SECONDS, fruit: FRUIT_SECONDS, picks: TREE_AGE_PICKS[0] - 1 };
    expect(treeAge(tree)).toBe(0);
    let state = opened({
      orchard: { ...opened().orchard, trees: { ...opened().orchard.trees, apple: tree } },
    });
    const picked = pickFruit(state, 'apple')!.state;
    expect(treeAge(picked.orchard.trees.apple)).toBe(1);
    expect(fruitBaskets(picked.orchard.trees.apple)).toBe(FRUIT_BASKETS + 1);
    state = {
      ...picked,
      orchard: {
        ...picked.orchard,
        trees: { ...picked.orchard.trees, apple: { ...tree, picks: TREE_AGE_PICKS[2] } },
      },
    };
    expect(unlockAchievements(state).achievements).toContain('oldTree');
  });

  it('sends a flight for a jar of honey', () => {
    const state = opened({ orchard: { ...opened().orchard, honey: 2 } });
    const next = spendHoney(state);
    expect(next.orchard.honey).toBe(1);
    expect(next.effects.some((e) => e.kind === 'flight')).toBe(true);
    const empty = opened();
    expect(spendHoney(empty)).toBe(empty);
  });

  it('keeps the rotation, the last crops and the picks in a save', () => {
    let state = sow(harvest(ripen(sow(opened(), 0, 'radish'), 0), 0)!.state, 0, 'beans');
    state = {
      ...state,
      orchard: {
        ...state.orchard,
        trees: { ...state.orchard.trees, apple: { age: TREE_SECONDS, fruit: 0, picks: 7 } },
      },
    };
    const loaded = deserialize(serialize(state), 0)!;
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.garden.plots[0]).toMatchObject({ crop: 'beans', last: 'radish', rotated: true });
    expect(loaded.orchard.trees.apple.picks).toBe(7);
  });
});
