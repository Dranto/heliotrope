import { describe, expect, it } from 'vitest';
import { generatorMultiplier } from './production';
import { choosePath, GROWTH, growthBonuses, strengthen } from './growth';
import { offlineReport } from './offline';
import { deserialize, serialize } from './save';
import { isHerbierComplete, SPECIES_IDS, unlockSpecies, WEATHER_SPECIES } from './species';
import { unlockAchievements } from './achievements';
import { createInitialState, type GameState } from './state';
import {
  advanceWeather,
  buildingWeather,
  canSwapForecast,
  swapForecast,
  WEATHER_BUILDINGS,
  WEATHER_IDS,
  WEATHER_PATH_FACTOR,
  weathersBetween,
  type WeatherId,
} from './weather';
import { withAllIntroduced } from './introductions';
import { GENERATOR_IDS } from './generators';

/** A player in their second Season, when the sky has opened. */
function opened(): GameState {
  return { ...withAllIntroduced(createInitialState(0)), seasons: 1 };
}

function under(weather: WeatherId, state = opened()): GameState {
  return { ...state, weather: { ...state.weather, current: weather } };
}

describe('the paths under their sky (M33)', () => {
  it('gives each building one weather', () => {
    for (const id of GENERATOR_IDS) {
      expect(WEATHER_IDS.filter((w) => WEATHER_BUILDINGS[w].includes(id))).toHaveLength(1);
    }
    expect(buildingWeather('balconyPanel')).toBe('sun');
  });

  it('plays the paths of the favoured buildings ×1.5 under their weather', () => {
    const base = choosePath(
      { ...opened(), generators: { ...opened().generators, balconyPanel: 100 } },
      'balconyPanel',
      1,
      0,
    );
    const withPath = choosePath(base, 'balconyPanel', 0, 0);
    // Tier 1 path 0 is ×1.5 on the panels: under the sun it plays ×1.75.
    const sun = generatorMultiplier(under('sun', withPath), 'balconyPanel');
    const wind = generatorMultiplier(under('wind', withPath), 'balconyPanel');
    // The sun also gives the panels ×1.25 of its own (§9.10).
    expect(sun / wind).toBeCloseTo((1.25 * 1.75) / 1.5);
  });

  it('strengthens every shape of path, and leaves the others alone', () => {
    expect(
      (strengthen({ kind: 'butterflyInterval', factor: 0.9 }, 1.5) as { factor: number }).factor,
    ).toBeCloseTo(0.85);
    expect(
      (strengthen({ kind: 'discount', fraction: 0.05 }, 1.5) as { fraction: number }).fraction,
    ).toBeCloseTo(0.075);
    expect(strengthen({ kind: 'clickPerUnit', generator: 'pot', amount: 0.25 }, 2)).toMatchObject({
      amount: 0.5,
    });
    const state = { ...opened(), generators: { ...opened().generators, pot: 60 } };
    const picked = choosePath(state, 'pot', 0, 1);
    expect(growthBonuses(picked, ['pot'])).toEqual([
      strengthen(GROWTH.pot[0]![1], WEATHER_PATH_FACTOR),
    ]);
    expect(growthBonuses(picked, ['arcology'])).toEqual([GROWTH.pot[0]![1]]);
  });
});

describe('the forecast swapped once per Season (M33, D25)', () => {
  const state: GameState = {
    ...opened(),
    weather: { ...opened().weather, forecast: ['wind', 'mist', 'heat'] },
  };

  it('brings the second or third weather next, once per Season', () => {
    expect(canSwapForecast(state, 0)).toBe(false);
    const swapped = swapForecast(state, 2);
    expect(swapped.weather.forecast).toEqual(['heat', 'mist', 'wind']);
    expect(canSwapForecast(swapped, 1)).toBe(false);
    expect(swapForecast(swapped, 1)).toBe(swapped);
    expect(canSwapForecast({ ...swapped, seasons: 2 }, 1)).toBe(true);
  });

  it('stays used for the Season after the weather changes', () => {
    const swapped = swapForecast(state, 1);
    const later = advanceWeather(swapped, swapped.weather.remaining + 1);
    expect(later.weather.current).not.toBe(swapped.weather.current);
    expect(later.weather.swapped).toBe(1);
    expect(canSwapForecast(later, 1)).toBe(false);
  });

  it('stays closed with the sky, and for a weather equal to the next one', () => {
    const first = { ...state, seasons: 0 };
    expect(swapForecast(first, 1)).toBe(first);
    const same = { ...state, weather: { ...state.weather, forecast: ['wind', 'wind', 'mist'] } };
    expect(canSwapForecast(same as GameState, 1)).toBe(false);
  });

  it('keeps the swap in the save', () => {
    const swapped = swapForecast(state, 1);
    const loaded = deserialize(serialize(swapped), 0)!;
    expect(loaded.weather.swapped).toBe(1);
    expect(loaded.weather.forecast).toEqual(['mist', 'wind', 'heat']);
  });
});

describe('the species of the weather (M33)', () => {
  it('brings one species out under each weather, none needed for the Herbier', () => {
    expect(WEATHER_SPECIES).toHaveLength(WEATHER_IDS.length);
    expect(unlockSpecies(under('sun')).species).toContain('wallLizard');
    expect(unlockSpecies(under('wind')).species).toContain('kestrel');
    expect(unlockSpecies(under('mist')).species).toContain('salamander');
    expect(unlockSpecies(under('heat')).species).toContain('cicada');
    const others = SPECIES_IDS.filter((id) => !WEATHER_SPECIES.includes(id));
    expect(isHerbierComplete({ species: others })).toBe(true);
  });

  it('gives a Milestone once all five are back', () => {
    const state = { ...opened(), species: [...WEATHER_SPECIES] };
    expect(unlockAchievements(state).achievements).toContain('skyCreatures');
    const four = { ...opened(), species: WEATHER_SPECIES.slice(1) };
    expect(unlockAchievements(four).achievements).not.toContain('skyCreatures');
  });
});

describe('the sky in the return in images (M33)', () => {
  it('lists the weathers lived while away, the one left behind first', () => {
    const before = opened();
    const after = advanceWeather(before, 3 * 3600);
    const lived = weathersBetween(before.weather, after.weather);
    expect(lived[0]).toBe(before.weather.current);
    expect(lived.at(-1)).toBe(after.weather.current);
    expect(lived.slice(1, 4)).toEqual(before.weather.forecast);
    expect(lived.length).toBeGreaterThan(4);
    expect(offlineReport(before, after).weathers).toEqual(lived);
    expect(weathersBetween(before.weather, before.weather)).toEqual([]);
  });
});
