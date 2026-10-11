import { describe, expect, it } from 'vitest';
import { globalBonus } from './bonuses';
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
    const traded = { ...coast, city: { ...coast.city, workshop: ['trade' as const] } };
    expect(globalBonus(traded)).toBeCloseTo(0.36);
  });

  it('teaches the workshop rules for Savoirs, once', () => {
    let state = swarm(endOfDelta(), 'plain');
    state = buyWorkshop(state, 'memory');
    expect(state.city.workshop).toEqual(['memory']);
    expect(state.city.savoirs).toBe(5);
    expect(buyWorkshop(state, 'memory')).toBe(state);
    expect(buyWorkshop(state, 'trade')).toBe(state);
  });

  it('keeps a quarter of the unspent Sources with the memory, the Tree with the seedlings', () => {
    const base = endOfDelta();
    const state = {
      ...base,
      city: { ...base.city, workshop: ['memory' as const, 'seedlings' as const] },
    };
    const spent = deltaSourcesSpent(state.delta.levels, state.delta.widths);
    const next = swarm(state, 'mountain');
    expect(next.sources).toBe(spent + Math.floor((100 - spent) * 0.25));
    expect(next.talents).toEqual(['gardenersCoop']);
  });

  it('lets the builders raise the cheapest sites when the Water allows', () => {
    const state = endOfDelta(100, { resources: { light: 0, water: 1e12 } });
    expect(runBuilders(state)).toBe(state);
    const built = runBuilders({ ...state, city: { ...state.city, workshop: ['builders'] } });
    const levels = Object.values(built.sites).reduce((a, b) => a + b, 0);
    expect(levels).toBe(3);
    expect(built.resources.water).toBeLessThan(1e12);
  });

  it('keeps the cities in the save', () => {
    const next = buyWorkshop(swarm(endOfDelta(), 'coast'), 'memory');
    const loaded = deserialize(serialize(next), 0)!;
    expect(loaded.city).toEqual(next.city);
  });
});
