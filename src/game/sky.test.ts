import { describe, expect, it } from 'vitest';
import { generatorMultiplier } from './production';
import { choosePath } from './growth';
import { offlineReport } from './offline';
import { isHerbierComplete, SPECIES_IDS, unlockSpecies, WEATHER_SPECIES } from './species';
import { unlockAchievements } from './achievements';
import { createInitialState, type GameState } from './state';
import {
  advanceWeather,
  buildingWeather,
  WEATHER_BUILDINGS,
  WEATHER_IDS,
  WEATHER_FACTOR,
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

describe('the weather favours its buildings (§9.10, slimming plan lot 2)', () => {
  it('gives each building one weather', () => {
    for (const id of GENERATOR_IDS) {
      expect(WEATHER_IDS.filter((w) => WEATHER_BUILDINGS[w].includes(id))).toHaveLength(1);
    }
    expect(buildingWeather('balconyPanel')).toBe('sun');
  });

  it('makes the favoured buildings produce ×1.25, their paths unchanged', () => {
    const withPath = choosePath(
      { ...opened(), generators: { ...opened().generators, balconyPanel: 100 } },
      'balconyPanel',
      0,
      0,
    );
    const sun = generatorMultiplier(under('sun', withPath), 'balconyPanel');
    const wind = generatorMultiplier(under('wind', withPath), 'balconyPanel');
    expect(sun / wind).toBeCloseTo(WEATHER_FACTOR);
    const closed = { ...under('sun', withPath), seasons: 0 };
    expect(generatorMultiplier(closed, 'balconyPanel')).toBeCloseTo(wind);
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
