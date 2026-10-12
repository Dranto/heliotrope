import { describe, expect, it } from 'vitest';
import { factorOf, globalBonus } from './bonuses';
import { growOrchard } from './orchard';
import { generatorMultiplier } from './production';
import {
  areCitiesOpen,
  buyWorkshop,
  canSwarm,
  citySources,
  runBuilders,
  savoirsToGain,
  swarm,
  SWARM_SOURCES,
} from './cities';
import { sourcesToGain, waterForSources } from './cycles';
import { DELTA, DELTA_IDS, deltaSourcesSpent } from './delta';
import { deserialize, serialize } from './save';
import { createInitialState, type GameState } from './state';

/** A player at the end of the delta: every arm open, `sources` Sources earned. */
function endOfDelta(sources = 100, extra: Partial<GameState> = {}): GameState {
  const fresh = createInitialState(0);
  const levels = Object.fromEntries(
    DELTA_IDS.map((id) => [id, DELTA[id].costs.length]),
  ) as GameState['delta']['levels'];
  return {
    ...fresh,
    seasons: 40,
    cycles: 6,
    sources,
    allTimeWater: waterForSources(sources),
    delta: { ...fresh.delta, levels },
    talents: ['gardenersCoop'],
    seeds: 99_999,
    collectors: { ...fresh.collectors, roofTanks: 30 },
    ...extra,
  };
}

describe('the sister cities (§7.6)', () => {
  it('open with the whole delta, and need Sources earned in the city', () => {
    expect(areCitiesOpen(createInitialState(0))).toBe(false);
    expect(areCitiesOpen(endOfDelta())).toBe(true);
    expect(canSwarm(endOfDelta(SWARM_SOURCES - 1))).toBe(false);
    expect(canSwarm(endOfDelta())).toBe(true);
  });

  it('brings Savoirs from the Sources of the city and the Seeds of the Cycle', () => {
    // √100 / 2 = 5, and 99 999 Seeds are five orders of magnitude.
    expect(savoirsToGain(endOfDelta())).toBe(10);
  });

  it('starts the layers below again, keeps the delta and what lasts', () => {
    const state = endOfDelta();
    const next = swarm(state, 'coast');
    const spent = deltaSourcesSpent(state.delta.levels, state.delta.widths);
    expect(next.city).toMatchObject({
      landscape: 'coast',
      founded: ['home'],
      savoirs: 10,
      earned: 10,
      sourcesBase: spent,
    });
    expect(next.sources).toBe(spent);
    expect(next.delta.levels).toEqual(state.delta.levels);
    expect(next.seeds).toBe(0);
    expect(next.talents).toEqual([]);
    expect(next.collectors.roofTanks).toBe(0);
    expect(next.resources).toEqual({ light: 0, water: 0 });
    expect(next.achievements).toContain('cities.1');
    // New Sources come from the Water of the new city only.
    expect(sourcesToGain(next)).toBe(0);
    expect(citySources(next)).toBe(0);
    const watered = { ...next, allTimeWater: next.allTimeWater + waterForSources(4) };
    expect(sourcesToGain(watered)).toBe(4);
    expect(canSwarm(next)).toBe(false);
  });

  it('applies the rule of the city lived in and the network of the cities left', () => {
    const coast = swarm(endOfDelta(), 'coast');
    // Home city's network +3%, ten Savoirs +30%.
    expect(globalBonus(coast)).toBeCloseTo(0.33);
    const traded = { ...coast, city: { ...coast.city, workshop: { trade: 1 } } };
    expect(globalBonus(traded)).toBeCloseTo(0.36);
    // Each level of trade sends the network once more; each of the schools adds 1% per Savoir.
    const deep = { ...coast, city: { ...coast.city, workshop: { trade: 2, schools: 1 } } };
    expect(globalBonus(deep)).toBeCloseTo(0.09 + 0.4);
  });

  it('teaches the workshop rules for Savoirs, level by level at a growing price (M30)', () => {
    let state = swarm(endOfDelta(), 'plain');
    state = buyWorkshop(state, 'memory');
    expect(state.city.workshop).toEqual({ memory: 1 });
    expect(state.city.savoirs).toBe(5);
    expect(buyWorkshop(state, 'memory')).toBe(state);
    expect(buyWorkshop(state, 'trade')).toBe(state);
    let rich = { ...state, city: { ...state.city, savoirs: 100 } };
    rich = buyWorkshop(buyWorkshop(rich, 'memory'), 'memory');
    expect(rich.city.workshop).toEqual({ memory: 3 });
    expect(rich.city.savoirs).toBe(100 - 10 - 20);
    expect(buyWorkshop(rich, 'memory')).toBe(rich);
    expect(buyWorkshop(rich, 'seedlings').city.workshop).toEqual({ memory: 3, seedlings: 1 });
  });

  it('keeps a quarter of the unspent Sources with the memory, the Tree with the seedlings', () => {
    const base = endOfDelta();
    const state = {
      ...base,
      city: { ...base.city, workshop: { memory: 1, seedlings: 1 } },
    };
    const spent = deltaSourcesSpent(state.delta.levels, state.delta.widths);
    const next = swarm(state, 'mountain');
    expect(next.sources).toBe(spent + Math.floor((100 - spent) * 0.25));
    expect(next.talents).toEqual(['gardenersCoop']);
    const deeper = swarm({ ...state, city: { ...state.city, workshop: { memory: 3 } } }, 'coast');
    expect(deeper.sources).toBe(spent + Math.floor((100 - spent) * 0.75));
  });

  it('keeps a third of the water collectors per level of the wells (M30)', () => {
    const base = endOfDelta(100, {
      collectors: { roofTanks: 12, swales: 9, ponds: 6, streams: 3 },
    });
    expect(swarm(base, 'plain').collectors).toEqual({
      roofTanks: 0,
      swales: 0,
      ponds: 0,
      streams: 0,
    });
    const wells = { ...base, city: { ...base.city, workshop: { wells: 2 } } };
    expect(swarm(wells, 'plain').collectors).toEqual({
      roofTanks: 8,
      swales: 6,
      ponds: 4,
      streams: 2,
    });
  });

  it('founds a forest or a marsh, each with its rule (M30)', () => {
    const base = endOfDelta(100, { parcels: ['gardenStreet', 'park'] });
    const forest = swarm(base, 'forest');
    expect(forest.city.landscape).toBe('forest');
    expect(factorOf(forest, 'orchardGrowth')).toBeCloseTo(1.5);
    expect(generatorMultiplier(forest, 'mirrorPlant')).toBeCloseTo(
      generatorMultiplier(swarm(base, 'plain'), 'mirrorPlant') * 0.5,
    );
    const planted = {
      ...forest,
      orchard: {
        ...forest.orchard,
        trees: { ...forest.orchard.trees, apple: { age: 0, fruit: 0 } },
      },
    };
    expect(growOrchard(planted, 1000).orchard.trees.apple.age).toBeCloseTo(1500);
    const marsh = swarm(base, 'marsh');
    expect(factorOf(marsh, 'biodiversityFactor')).toBeCloseTo(1.5);
    // Once left, the forest sends a faster orchard to the network.
    const after = swarm(
      { ...forest, sources: forest.sources + 100, city: { ...forest.city, sourcesBase: 0 } },
      'marsh',
    );
    expect(factorOf(after, 'orchardGrowth')).toBeCloseTo(1.1);
  });

  it('lets the builders raise the cheapest sites when the Water allows', () => {
    const state = endOfDelta(100, { resources: { light: 0, water: 1e12 } });
    expect(runBuilders(state)).toBe(state);
    const built = runBuilders({ ...state, city: { ...state.city, workshop: { builders: 1 } } });
    const levels = Object.values(built.sites).reduce((a, b) => a + b, 0);
    expect(levels).toBe(3);
    expect(built.resources.water).toBeLessThan(1e12);
  });

  it('keeps the cities in the save', () => {
    const next = buyWorkshop(swarm(endOfDelta(), 'coast'), 'memory');
    const loaded = deserialize(serialize(next), 0)!;
    expect(loaded.city).toEqual(next.city);
    // Before M30 the rules were a list, each learnt once: each becomes its first level.
    const old = JSON.parse(serialize(next));
    const raw = { ...old, version: 30, city: { ...old.city, workshop: ['memory', 'trade', 'x'] } };
    expect(deserialize(JSON.stringify(raw), 0)!.city.workshop).toEqual({ memory: 1, trade: 1 });
  });
});
