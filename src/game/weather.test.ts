import { describe, expect, it } from 'vitest';
import { unlockSpecies } from './species';
import { generatorMultiplier } from './production';
import { deserialize, serialize } from './save';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';
import {
  advanceWeather,
  createWeatherState,
  FORECAST_LENGTH,
  validWeather,
  WEATHER_IDS,
  WEATHER_SECONDS,
  type WeatherId,
} from './weather';
import { withAllIntroduced } from './introductions';

/** A new game whose mechanics are all introduced (§10.8), to test them directly. */
const openGame = (now: number) => withAllIntroduced(createInitialState(now));
/** A state in its second Season, when the sky has opened. */
function opened(): GameState {
  return { ...openGame(0), seasons: 1 };
}

function under(weather: WeatherId, state = opened()): GameState {
  return { ...state, weather: { ...state.weather, current: weather } };
}

describe('the weather (§9.10, M28)', () => {
  it('stays still and gives nothing during the first Season', () => {
    const first = openGame(0);
    expect(advanceWeather(first, 5000)).toBe(first);
    expect(generatorMultiplier(first, 'balconyPanel')).toBe(
      generatorMultiplier(under('wind'), 'balconyPanel'),
    );
    expect(unlockSpecies(under('shower', first)).species).not.toContain('snail');
  });

  it('starts under grand soleil with three weathers forecast', () => {
    const weather = createWeatherState(42);
    expect(weather.current).toBe('sun');
    expect(weather.forecast).toHaveLength(FORECAST_LENGTH);
    expect(weather.remaining).toBeGreaterThanOrEqual(WEATHER_SECONDS.min);
    expect(weather.remaining).toBeLessThanOrEqual(WEATHER_SECONDS.max);
    expect(createWeatherState(42)).toEqual(weather);
  });

  it('gives way to the forecast one as play time passes, and draws a new forecast', () => {
    const state = opened();
    const { remaining, forecast } = state.weather;
    const before = advanceWeather(state, remaining - 1);
    expect(before.weather.current).toBe('sun');
    const after = advanceWeather(state, remaining + 1);
    expect(after.weather.current).toBe(forecast[0]);
    expect(after.weather.forecast.slice(0, 2)).toEqual(forecast.slice(1));
    expect(after.weather.seen).toContain(forecast[0]);
    // A long absence runs through several weathers, the same as many short steps.
    let stepped = state;
    for (let i = 0; i < 400; i++) stepped = advanceWeather(stepped, 30);
    expect(advanceWeather(state, 12_000).weather.current).toBe(stepped.weather.current);
  });

  it('never changes what the Golden Butterfly gives', () => {
    const state = opened();
    expect(tick(state, 3 * WEATHER_SECONDS.max).rngSeed).toBe(state.rngSeed);
  });

  it('favours its buildings, never a penalty', () => {
    const sunny = under('sun');
    const calm = under('wind');
    expect(generatorMultiplier(sunny, 'balconyPanel')).toBeCloseTo(
      generatorMultiplier(calm, 'balconyPanel') * 1.25,
    );
    expect(generatorMultiplier(under('shower'), 'pot')).toBeCloseTo(
      generatorMultiplier(calm, 'pot') * 1.25,
    );
    expect(generatorMultiplier(under('heat'), 'urbanCanopy')).toBeCloseTo(
      generatorMultiplier(calm, 'urbanCanopy') * 1.25,
    );
  });

  it('brings a Milestone per weather lived, and the snail under the shower', () => {
    expect(tick(openGame(0), 1).achievements).not.toContain('weather.sun');
    expect(tick(opened(), 1).achievements).toContain('weather.sun');
    let state = opened();
    for (const id of WEATHER_IDS) {
      state = { ...state, weather: { ...state.weather, seen: [...WEATHER_IDS] } };
      expect(tick(state, 1).achievements).toContain(`weather.${id}`);
    }
    expect(unlockSpecies(under('sun')).species).not.toContain('snail');
    expect(unlockSpecies(under('shower')).species).toContain('snail');
  });

  it('keeps the sky in the save and draws a new one for a bad or older save', () => {
    const state = advanceWeather(opened(), 5000);
    expect(deserialize(serialize(state), 0)!.weather).toEqual(state.weather);
    const fallback = createWeatherState(1);
    expect(validWeather({ current: 'snow' }, fallback)).toBe(fallback);
    expect(validWeather({ ...state.weather, forecast: ['sun', 'sun', 'rain'] }, fallback)).toBe(
      fallback,
    );
    const { weather: _weather, ...old } = JSON.parse(serialize(openGame(0)));
    const loaded = deserialize(JSON.stringify({ ...old, version: 28 }), 0)!;
    expect(WEATHER_IDS).toContain(loaded.weather.current);
    expect(loaded.weather.forecast).toHaveLength(FORECAST_LENGTH);
  });
});
