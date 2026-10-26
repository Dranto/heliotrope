import { describe, expect, it } from 'vitest';
import { butterflyOdds, BUTTERFLY_ODDS, butterflyOutcome, catchButterfly } from './butterfly';
import {
  addPollen,
  POLLEN_PER_CLICK,
  POLLEN_PER_MOMENT,
  pollenFill,
  pollinate,
  SEASON_START_FILL,
  SEASON_START_SECONDS,
} from './pollen';
import { createInitialState, type GameState } from './state';
import { welcomeVisit } from './visits';
import { withAllIntroduced } from './introductions';

/** A second Season whose mechanics are all introduced (§10.8). */
function fresh(extra: Partial<GameState> = {}): GameState {
  const state = withAllIntroduced(createInitialState(0));
  return {
    ...state,
    seasons: 1,
    generators: { ...state.generators, pot: 10, balconyPanel: 5 },
    seasonSeconds: SEASON_START_SECONDS + 1,
    ...extra,
  };
}

describe('the moments that chain together (§5.7, M31)', () => {
  it('gives the butterfly the colour of the weather once the sky is open', () => {
    const first = fresh({ seasons: 0 });
    expect(butterflyOdds(first)).toEqual(BUTTERFLY_ODDS);
    const sunny = fresh({ seasons: 1, weather: { ...first.weather, current: 'sun' } });
    const windy = fresh({ seasons: 1, weather: { ...first.weather, current: 'wind' } });
    const misty = fresh({ seasons: 1, weather: { ...first.weather, current: 'mist' } });
    const hot = fresh({ seasons: 1, weather: { ...first.weather, current: 'heat' } });
    expect(butterflyOdds(sunny).bloom).toBeGreaterThan(BUTTERFLY_ODDS.bloom);
    expect(butterflyOdds(windy).harvest).toBeGreaterThan(BUTTERFLY_ODDS.harvest);
    expect(butterflyOutcome(0.95, butterflyOdds(misty))).toBe('pollination');
    expect(butterflyOutcome(0.85, butterflyOdds(misty))).toBe('pollination');
    expect(butterflyOdds(hot)).toEqual(BUTTERFLY_ODDS);
    // Every effect keeps a chance under every sky.
    for (const odds of [sunny, windy, misty, hot].map(butterflyOdds)) {
      expect(odds.bloom).toBeGreaterThan(0);
      expect(odds.harvest).toBeGreaterThan(0);
      expect(odds.bloom + odds.harvest).toBeLessThan(1);
    }
  });

  it('leaves pollen on the flower when the butterfly is caught or a visitor welcomed', () => {
    const butterfly = fresh({ butterfly: { nextIn: 0, visible: 5 } });
    expect(catchButterfly(butterfly)!.state.pollen.gauge).toBeCloseTo(POLLEN_PER_MOMENT);
    const visit = fresh({ visit: { kind: 'shower', nextIn: 0, visible: 10 } });
    expect(welcomeVisit(visit)!.state.pollen.gauge).toBeCloseTo(POLLEN_PER_MOMENT);
  });

  it('sends a flight when a moment fills the gauge', () => {
    const almost = fresh({ pollen: { gauge: 0.95, flights: 0 } });
    const full = addPollen(almost, POLLEN_PER_MOMENT);
    expect(full.pollen.flights).toBe(1);
    expect(full.pollen.gauge).toBeCloseTo(0.05);
    expect(full.effects.some((e) => e.kind === 'flight')).toBe(true);
  });

  it('fills the gauge faster in the first seconds of a Season', () => {
    const start = fresh({ seasonSeconds: 0 });
    const later = fresh();
    expect(pollenFill(start) / pollenFill(later)).toBeCloseTo(SEASON_START_FILL);
    expect(pollinate(start).pollen.gauge).toBeCloseTo(POLLEN_PER_CLICK * SEASON_START_FILL);
  });
});
