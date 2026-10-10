import {
  buyCollector,
  collectorCost,
  collectorWater,
  isBioregionOpen,
  isSiteRevealed,
  raiseSite,
  siteCost,
  siteFactor,
  waterPerSecond,
} from './bioregion';
import { generatorMultiplier } from './production';
import { startNewSeason } from './seasons';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';

/** A third Season: the Bioregion is open (§7.4). */
function open(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(0), seasons: 2, seeds: 10, ...overrides };
}

describe('the Bioregion (§7.4)', () => {
  it('opens at the start of the third Season', () => {
    expect(isBioregionOpen(createInitialState(0))).toBe(false);
    expect(isBioregionOpen({ seasons: 1, cycles: 0 })).toBe(false);
    expect(isBioregionOpen({ seasons: 2, cycles: 0 })).toBe(true);
  });

  it('builds collectors with Light, each four times the price of the last', () => {
    const state = open({ resources: { light: 5e6, water: 0 } });
    const first = buyCollector(state, 'roofTanks');
    expect(first.collectors.roofTanks).toBe(1);
    expect(first.resources.light).toBe(4e6);
    expect(collectorCost(first, 'roofTanks')).toBe(4e6);
    // Closed before the third Season.
    const early = { ...state, seasons: 1 };
    expect(buyCollector(early, 'roofTanks')).toBe(early);
  });

  it('gathers Water over time, raised by the linked building and the parcels', () => {
    const state = open({ collectors: { roofTanks: 2, swales: 0, ponds: 0, streams: 0 } });
    expect(waterPerSecond(state)).toBe(2);
    const gardens = { ...state, generators: { ...state.generators, rooftopGarden: 50 } };
    expect(collectorWater(gardens, 'roofTanks')).toBeCloseTo(3);
    const river = { ...gardens, parcels: ['river' as const] };
    expect(collectorWater(river, 'roofTanks')).toBeCloseTo(4.5);
    // Elapsed time, not ticks: one long tick earns what many short ones do.
    const long = tick(state, 60);
    let short = state;
    for (let i = 0; i < 60; i++) short = tick(short, 1);
    expect(long.resources.water).toBeCloseTo(120);
    expect(short.resources.water).toBeCloseTo(120);
    expect(long.allTimeWater).toBeCloseTo(120);
  });

  it('raises sites with Water, each level adding +25% to its two buildings', () => {
    const state = open({ resources: { light: 0, water: 1_000 } });
    expect(isSiteRevealed(state, 'wetlands')).toBe(false);
    const raised = raiseSite(raiseSite(state, 'wetlands'), 'wetlands');
    expect(raised.sites.wetlands).toBe(2);
    expect(raised.resources.water).toBeCloseTo(1_000 - 60 - 150);
    expect(siteCost(raised, 'wetlands')).toBeCloseTo(375);
    expect(siteFactor(raised, 'pot')).toBe(1.5);
    expect(siteFactor(raised, 'greenhouse')).toBe(1);
    expect(generatorMultiplier(raised, 'rooftopGarden')).toBeCloseTo(
      1.5 * generatorMultiplier(state, 'rooftopGarden'),
    );
    const poor = { ...state, resources: { light: 0, water: 10 } };
    expect(raiseSite(poor, 'wetlands')).toBe(poor);
  });

  it('keeps Water, collectors and sites from one Season to the next', () => {
    const state = open({
      allTimeLight: 1e10,
      resources: { light: 1e9, water: 500 },
      collectors: { roofTanks: 3, swales: 1, ponds: 0, streams: 0 },
      sites: { wetlands: 2, meadows: 1, foodForests: 0, oldForest: 0 },
    });
    const next = startNewSeason(state);
    expect(next.seasons).toBe(3);
    expect(next.resources).toEqual({ light: 0, water: 500 });
    expect(next.collectors).toEqual(state.collectors);
    expect(next.sites).toEqual(state.sites);
  });
});
