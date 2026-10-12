import {
  canStartNewCycle,
  isCyclePremature,
  sourcesForWater,
  sourcesToGain,
  startNewCycle,
  waterToNextSource,
} from './cycles';
import { globalMultiplier } from './production';
import { seedBonus, seedsToGain } from './seasons';
import { createInitialState, type GameState } from './state';
import { availableSeeds, canLearnTalent, learnTalent } from './talents';

function ready(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(0),
    seasons: 6,
    seeds: 40,
    allTimeLight: 5e10,
    totalLight: 1e10,
    talents: ['gardenersCoop', 'mycorrhiza', 'nectarFlowers'],
    resources: { light: 1e9, water: 3e5 },
    allTimeWater: 1.25e7,
    collectors: { roofTanks: 5, swales: 3, ponds: 2, streams: 1 },
    sites: { wetlands: 4, meadows: 2, foodForests: 1, oldForest: 0, hillsides: 0 },
    parcels: ['river'],
    challenges: ['wild'],
    species: ['poppy'],
    ...overrides,
  };
}

describe('Sources formula (§7.4)', () => {
  it('turns the Water of every Cycle into Sources, square-root style', () => {
    expect(sourcesForWater(0)).toBe(0);
    expect(sourcesForWater(5e5)).toBe(1);
    expect(sourcesForWater(1.25e7)).toBe(5);
    expect(sourcesToGain(ready({ sources: 2 }))).toBe(3);
    expect(waterToNextSource(ready())).toBeCloseTo(36 * 5e5 - 1.25e7);
  });

  it('is available from one Source, advised from five for the first Cycle', () => {
    expect(canStartNewCycle(ready({ allTimeWater: 3e5 }))).toBe(false);
    expect(isCyclePremature(ready({ allTimeWater: 4e6 }))).toBe(true);
    expect(isCyclePremature(ready())).toBe(false);
    expect(isCyclePremature(ready({ cycles: 1, allTimeWater: 4e6 }))).toBe(false);
  });

  it('adds +10% production per Source and makes each Seed worth one point more', () => {
    const base = ready({ sources: 0 });
    expect(seedBonus(40, 0)).toBeCloseTo(2);
    expect(seedBonus(40, 3)).toBeCloseTo(3.2);
    const ratio = globalMultiplier(ready({ sources: 3 })) / globalMultiplier(base);
    expect(ratio).toBeCloseTo(((1 + 3.2) / (1 + 2)) * 1.3);
  });
});

describe('new Cycle', () => {
  it('resets Seeds and the Bioregion, keeps the Sources, the tree and the land restored', () => {
    const state = ready();
    const next = startNewCycle(state);
    expect(next.sources).toBe(5);
    expect(next.cycles).toBe(1);
    expect(next.seasons).toBe(7);
    expect(next.seeds).toBe(0);
    expect(next.resources).toEqual({ light: 0, water: 0 });
    expect(next.collectors).toEqual({ roofTanks: 0, swales: 0, ponds: 0, streams: 0 });
    expect(next.sites).toEqual({
      wetlands: 0,
      meadows: 0,
      foodForests: 0,
      oldForest: 0,
      hillsides: 0,
    });
    expect(Object.values(next.generators).every((n) => n === 0)).toBe(true);
    expect(next.talents).toEqual(state.talents);
    expect(next.parcels).toEqual(['river']);
    expect(next.challenges).toEqual(['wild']);
    expect(next.species).toEqual(['poppy']);
    expect(next.allTimeLight).toBe(state.allTimeLight);
    expect(next.allTimeWater).toBe(state.allTimeWater);
    expect(next.achievements).toContain('cycles.1');
    // Nothing more to gain until new Water flows.
    expect(sourcesToGain(next)).toBe(0);
    expect(startNewCycle(next)).toBe(next);
  });

  it('counts the Seeds of the new Cycle only, without paying for the tree twice', () => {
    const next = startNewCycle(ready());
    expect(seedsToGain(next)).toBe(0);
    expect(availableSeeds(next)).toBe(0);
    const earned = { ...next, allTimeLight: next.allTimeLight + 2e9, seeds: 10 };
    expect(availableSeeds(earned)).toBe(10);
    expect(canLearnTalent(earned, 'hedgerows')).toBe(true);
    expect(learnTalent(earned, 'hedgerows').talents).toContain('hedgerows');
  });

  it('unlocks the hidden "Grandes eaux" when 25 Sources spring at once', () => {
    expect(startNewCycle(ready()).achievements).not.toContain('floodTide');
    expect(startNewCycle(ready({ allTimeWater: 3.2e8 })).achievements).toContain('floodTide');
  });
});
