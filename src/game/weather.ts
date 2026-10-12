// The weather (docs/game-design.md §9.10, M28): the sky over the neighbourhood changes every 15 to
// 30 minutes of play, and each weather favours a family of buildings and systems, never a penalty.
// The next three are forecast. The weather draws from its own seed, so it never changes what the
// Golden Butterfly would have given.
import { isIntroduced, type IntroState } from './introductions';
import type { Bonus } from './bonuses';
import { nextRandom } from './random';

export const WEATHER_IDS = ['sun', 'shower', 'wind', 'mist', 'heat'] as const;
export type WeatherId = (typeof WEATHER_IDS)[number];

/** Seconds of play a weather lasts, drawn between these two. */
export const WEATHER_SECONDS = { min: 15 * 60, max: 30 * 60 } as const;
/** Weathers forecast after the current one. */
export const FORECAST_LENGTH = 3;

export interface WeatherState {
  current: WeatherId;
  /** Seconds of play before the current weather gives way to the first forecast one. */
  remaining: number;
  forecast: WeatherId[];
  /** The weather's own random seed (§9.2's mulberry32). */
  seed: number;
  /** Weathers lived since the sky opened, over all Seasons: the Milestones read them. */
  seen: WeatherId[];
}

/**
 * What each weather favours (P27): grand soleil the panels and the mirror plant, the shower the
 * rooftop gardens and the courtyard garden, the wind the Golden Butterfly's harvest, the mist the
 * biodiversity, the heat the urban canopy and the trees of the parcels.
 */
export const WEATHER_BONUSES: Record<WeatherId, readonly Bonus[]> = {
  sun: [
    { kind: 'generatorMultiplier', generator: 'balconyPanel', factor: 1.25 },
    { kind: 'generatorMultiplier', generator: 'mirrorPlant', factor: 1.25 },
  ],
  shower: [
    { kind: 'generatorMultiplier', generator: 'rooftopGarden', factor: 1.25 },
    { kind: 'gardenGrowth', factor: 1.25 },
  ],
  wind: [{ kind: 'harvestFactor', factor: 1.5 }],
  mist: [{ kind: 'biodiversityFactor', factor: 1.15 }],
  heat: [
    { kind: 'generatorMultiplier', generator: 'urbanCanopy', factor: 1.25 },
    { kind: 'perParcel', bonus: 0.01 },
  ],
};

export function isWeatherId(value: unknown): value is WeatherId {
  return typeof value === 'string' && (WEATHER_IDS as readonly string[]).includes(value);
}

function draw(seed: number): [WeatherId, number] {
  const [value, next] = nextRandom(seed);
  return [WEATHER_IDS[Math.floor(value * WEATHER_IDS.length)]!, next];
}

function duration(seed: number): [number, number] {
  const [value, next] = nextRandom(seed);
  return [WEATHER_SECONDS.min + value * (WEATHER_SECONDS.max - WEATHER_SECONDS.min), next];
}

/** A new game starts under grand soleil, with three weathers forecast; none is lived yet. */
export function createWeatherState(seed: number): WeatherState {
  let next = seed;
  const forecast: WeatherId[] = [];
  for (let i = 0; i < FORECAST_LENGTH; i++) {
    const [weather, after] = draw(next);
    forecast.push(weather);
    next = after;
  }
  const [remaining, after] = duration(next);
  return { current: 'sun', remaining, forecast, seed: after, seen: [] };
}

/** The sky starts to change with the second Season, once the first one has taught the basics. */
export function isWeatherOpen(state: {
  seasons: number;
  cycles?: number;
  intro: IntroState;
}): boolean {
  return isIntroduced(state, 'weather') && (state.seasons > 0 || (state.cycles ?? 0) > 0);
}

/** Move the sky forward by dtSeconds of play, online or offline, once it is open. */
export function advanceWeather<
  S extends { weather: WeatherState; seasons: number; cycles: number; intro: IntroState },
>(state: S, dtSeconds: number): S {
  if (!isWeatherOpen(state)) return state;
  const { weather } = state;
  const lived = weather.seen.includes(weather.current)
    ? weather.seen
    : [...weather.seen, weather.current];
  if (weather.remaining > dtSeconds) {
    return {
      ...state,
      weather: { ...weather, remaining: weather.remaining - dtSeconds, seen: lived },
    };
  }
  let { current, remaining, forecast, seed } = weather;
  let seen = lived;
  remaining -= dtSeconds;
  while (remaining <= 0) {
    current = forecast[0]!;
    const [drawn, afterDraw] = draw(seed);
    const [length, afterLength] = duration(afterDraw);
    forecast = [...forecast.slice(1), drawn];
    seed = afterLength;
    remaining += length;
    if (!seen.includes(current)) seen = [...seen, current];
  }
  return { ...state, weather: { current, remaining, forecast, seed, seen } };
}

export function weatherBonuses(source: {
  weather: Pick<WeatherState, 'current'>;
  seasons: number;
  cycles?: number;
  intro: IntroState;
}): readonly Bonus[] {
  return isWeatherOpen(source) ? WEATHER_BONUSES[source.weather.current] : [];
}

export function validWeather(raw: unknown, fallback: WeatherState): WeatherState {
  const data = (raw ?? {}) as Partial<Record<keyof WeatherState, unknown>>;
  const { current, remaining, forecast, seed, seen } = data;
  if (
    !isWeatherId(current) ||
    typeof remaining !== 'number' ||
    !(remaining > 0 && remaining <= WEATHER_SECONDS.max) ||
    !Array.isArray(forecast) ||
    forecast.length !== FORECAST_LENGTH ||
    !forecast.every(isWeatherId) ||
    typeof seed !== 'number' ||
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 0xffffffff
  ) {
    return fallback;
  }
  const lived = Array.isArray(seen) ? seen.filter(isWeatherId) : [];
  return {
    current,
    remaining,
    forecast: [...forecast],
    seed,
    seen: [...new Set<WeatherId>(lived)],
  };
}
