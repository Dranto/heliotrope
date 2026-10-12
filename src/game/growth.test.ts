import { describe, expect, it } from 'vitest';
import { costFactor, factorOf } from './bonuses';
import {
  canChoosePath,
  choosePath,
  GROWTH,
  GROWTH_TIERS,
  growthBonuses,
  pathsWorking,
  pendingTier,
  reachedTiers,
  validGrowth,
} from './growth';
import { GENERATOR_IDS } from './generators';
import { clickValue, generatorMultiplier } from './production';
import { deserialize, serialize } from './save';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';
import { withReferencePaths } from './simulator';

function owning(
  units: Partial<GameState['generators']>,
  extra: Partial<GameState> = {},
): GameState {
  const fresh = createInitialState(0);
  return { ...fresh, generators: { ...fresh.generators, ...units }, ...extra };
}

describe('buildings that grow (§5.5, M26)', () => {
  it('has two paths at each of three tiers for every building', () => {
    expect(GROWTH_TIERS).toEqual([50, 100, 200]);
    for (const id of GENERATOR_IDS) {
      expect(GROWTH[id]).toHaveLength(3);
      for (const fork of GROWTH[id]) expect(fork).toHaveLength(2);
    }
  });

  it('reaches tiers with the units owned and asks for a path', () => {
    const state = owning({ pot: 120 });
    expect(reachedTiers(state, 'pot')).toBe(2);
    expect(pendingTier(state, 'pot')).toBe(0);
    expect(growthBonuses(state)).toEqual([]);
    const picked = choosePath(state, 'pot', 0, 1);
    expect(pendingTier(picked, 'pot')).toBe(1);
    expect(growthBonuses(picked)).toEqual([GROWTH.pot[0]![1]]);
  });

  it('works only once its tier is reached, so a path can be picked ahead', () => {
    const ahead = choosePath(owning({ balconyPanel: 10 }), 'balconyPanel', 0, 0);
    expect(ahead.growth.paths.balconyPanel[0]).toBe(0);
    expect(clickValue(ahead)).toBe(clickValue(owning({ balconyPanel: 10 })));
    const grown = { ...ahead, generators: { ...ahead.generators, balconyPanel: 50 } };
    const plain = owning({ balconyPanel: 50 });
    // Path A of the solar pergola: +1 Light per click per panel.
    expect(clickValue(grown)).toBeCloseTo(clickValue(plain) + 1 * 50);
  });

  it('feeds a building from another, and grows with species and parcels', () => {
    const base = owning({ pot: 50, rooftopGarden: 10 });
    const fed = choosePath(base, 'pot', 0, 1);
    expect(generatorMultiplier(fed, 'rooftopGarden')).toBeCloseTo(
      generatorMultiplier(base, 'rooftopGarden') * (1 + 0.0025 * 50),
    );
    const roofs = owning({ rooftopGarden: 50 }, { parcels: ['gardenStreet'] });
    const perParcel = choosePath(roofs, 'rooftopGarden', 0, 1);
    expect(generatorMultiplier(perParcel, 'rooftopGarden')).toBeCloseTo(
      generatorMultiplier(roofs, 'rooftopGarden') * 1.04,
    );
    const arcology = choosePath(owning({ arcology: 50 }), 'arcology', 0, 1);
    expect(costFactor(arcology)).toBeCloseTo(0.95);
    const greenhouses = choosePath(owning({ greenhouse: 100 }), 'greenhouse', 1, 0);
    expect(factorOf(choosePath(greenhouses, 'greenhouse', 0, 0), 'gardenGrowth')).toBeCloseTo(1.2);
  });

  it('changes a working path once per building and per Season (D18)', () => {
    let state = choosePath(owning({ pot: 60 }), 'pot', 0, 0);
    state = choosePath(state, 'pot', 0, 1);
    expect(state.growth.paths.pot[0]).toBe(1);
    expect(canChoosePath(state, 'pot', 0, 0)).toBe(false);
    expect(choosePath(state, 'pot', 0, 0)).toBe(state);
    // Unreached tiers stay free.
    expect(canChoosePath(state, 'pot', 2, 1)).toBe(true);
    // A new Season: the paths stay, and a working one can change again.
    const regrown = { ...state, seasons: state.seasons + 1 };
    expect(canChoosePath(regrown, 'pot', 0, 0)).toBe(true);
  });

  it('counts the paths at work for the Milestones', () => {
    let state = owning({ pot: 50 });
    expect(pathsWorking(state)).toBe(0);
    state = choosePath(state, 'pot', 0, 0);
    expect(pathsWorking(state)).toBe(1);
    expect(tick(state, 1).achievements).toContain('firstPath');
  });

  it('keeps the paths in the save and reads a bad one as none', () => {
    const state = choosePath(owning({ greenhouse: 60 }), 'greenhouse', 0, 1);
    const loaded = deserialize(serialize(state), 0)!;
    expect(loaded.growth).toEqual(state.growth);
    expect(validGrowth({ paths: { pot: [2, 'x', 1] }, swapped: { pot: -1 } }).paths.pot).toEqual([
      null,
      null,
      1,
    ]);
    const { growth: _growth, ...old } = JSON.parse(serialize(createInitialState(0)));
    expect(deserialize(JSON.stringify({ ...old, version: 26 }), 0)!.growth.paths.pot).toEqual([
      null,
      null,
      null,
    ]);
  });

  it('lets the reference player of the simulator take the first path everywhere', () => {
    const state = withReferencePaths(createInitialState(0));
    for (const id of GENERATOR_IDS) expect(state.growth.paths[id]).toEqual([0, 0, 0]);
    expect(withReferencePaths(state)).toBe(state);
  });
});
