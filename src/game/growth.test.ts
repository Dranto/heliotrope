import { describe, expect, it } from 'vitest';
import { collectorCost, siteCost } from './bioregion';
import { costFactor, factorOf } from './bonuses';
import { MIN_RIPENING_SECONDS } from './delta';
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
import { seasonRipeningSeconds } from './seasons';
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
    const ahead = choosePath(owning({ balconyPanel: 10 }), 'balconyPanel', 0, 1);
    expect(ahead.growth.paths.balconyPanel[0]).toBe(1);
    expect(clickValue(ahead)).toBe(clickValue(owning({ balconyPanel: 10 })));
    const grown = { ...ahead, generators: { ...ahead.generators, balconyPanel: 50 } };
    const plain = owning({ balconyPanel: 50 });
    // The second path of the solar pergola: +4 Light per click per panel.
    expect(clickValue(grown)).toBeCloseTo(clickValue(plain) + 4 * 50);
  });

  it('makes the building much stronger, or ties it to what sets the pace (lot 5)', () => {
    const pots = owning({ pot: 50 });
    const strong = choosePath(pots, 'pot', 0, 0);
    expect(generatorMultiplier(strong, 'pot') / generatorMultiplier(pots, 'pot')).toBeCloseTo(1.5);
    const arcology = choosePath(owning({ arcology: 50 }), 'arcology', 0, 1);
    expect(costFactor(arcology)).toBeCloseTo(0.9);
    const greenhouses = choosePath(owning({ greenhouse: 50 }), 'greenhouse', 0, 1);
    expect(factorOf(greenhouses, 'gardenGrowth')).toBeCloseTo(1.3);
  });

  it('ripens the Seeds sooner, lowers the Bioregion prices', () => {
    const farms = owning({ greenhouse: 200, verticalFarm: 200 });
    let ripe = choosePath(farms, 'greenhouse', 1, 1);
    ripe = choosePath(ripe, 'greenhouse', 2, 1);
    ripe = choosePath(ripe, 'verticalFarm', 2, 1);
    expect(seasonRipeningSeconds(farms) - seasonRipeningSeconds(ripe)).toBe(80);
    // Never under five minutes, even with the seed arm at its widest.
    const wide = {
      ...ripe,
      delta: { ...ripe.delta, levels: { ...ripe.delta.levels, seedArm: 2 } },
    };
    const widest = {
      ...wide,
      delta: { ...wide.delta, widths: { ...wide.delta.widths, seedArm: 10 } },
    };
    expect(seasonRipeningSeconds(widest)).toBe(MIN_RIPENING_SECONDS);
    const city = owning({ mirrorPlant: 200, urbanCanopy: 200 });
    const cheap = choosePath(choosePath(city, 'mirrorPlant', 2, 1), 'urbanCanopy', 2, 1);
    expect(collectorCost(cheap, 'roofTanks') / collectorCost(city, 'roofTanks')).toBeCloseTo(0.8);
    expect(siteCost(cheap, 'wetlands') / siteCost(city, 'wetlands')).toBeCloseTo(0.8);
  });

  it('changes a working path once per building and per Cycle (lot 5)', () => {
    let state = choosePath(owning({ pot: 60 }), 'pot', 0, 0);
    state = choosePath(state, 'pot', 0, 1);
    expect(state.growth.paths.pot[0]).toBe(1);
    expect(canChoosePath(state, 'pot', 0, 0)).toBe(false);
    expect(choosePath(state, 'pot', 0, 0)).toBe(state);
    // Unreached tiers stay free.
    expect(canChoosePath(state, 'pot', 2, 1)).toBe(true);
    // A new Season is not enough; a new Cycle of water lets a working path change again.
    expect(canChoosePath({ ...state, seasons: state.seasons + 1 }, 'pot', 0, 0)).toBe(false);
    expect(canChoosePath({ ...state, cycles: state.cycles + 1 }, 'pot', 0, 0)).toBe(true);
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
