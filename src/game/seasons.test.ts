import { visualSeason } from './phases';
import { globalMultiplier, lightPerSecond } from './production';
import {
  areSeedsRipe,
  canStartNewSeason,
  DEEP_SOIL_SEEDS,
  isSeasonPremature,
  isSeasonsScreenUnlocked,
  lightForSeeds,
  lightToNextSeed,
  seasonRipeness,
  secondsToRipeness,
  seedBonus,
  seedsForLight,
  seedsGrowing,
  seedsToGain,
  SEED_RIPENING_SECONDS,
  startNewSeason,
} from './seasons';
import { createInitialState, type GameState } from './state';
import { earnLight, tick } from './tick';

function lateGame(allTimeLight: number, extra: Partial<GameState> = {}): GameState {
  const base = createInitialState(1000);
  return {
    ...base,
    resources: { water: 0, light: 1234 },
    generators: { ...base.generators, pot: 40, balconyPanel: 12, arcology: 2 },
    upgrades: ['pot.1', 'gloves'],
    totalLight: allTimeLight,
    allTimeLight,
    clicks: 500,
    playSeconds: 7200,
    seasonSeconds: 7200,
    ...extra,
  };
}

describe('Seeds formula (§7)', () => {
  it('matches the reference points of the design doc', () => {
    expect(seedsForLight(0)).toBe(0);
    expect(seedsForLight(1.99e7)).toBe(0);
    expect(seedsForLight(2e7)).toBe(1);
    expect(seedsForLight(2e9)).toBe(10);
    expect(seedsForLight(2e11)).toBe(100);
  });

  it('deepens past 100 Seeds: doubling them asks for 8 times the Light (§7)', () => {
    expect(DEEP_SOIL_SEEDS).toBe(100);
    expect(seedsForLight(8 * 2e11)).toBe(200);
    expect(seedsForLight(1000 * 2e11)).toBe(1000);
    expect(lightForSeeds(101)).toBeGreaterThan(lightForSeeds(100));
    expect(lightForSeeds(400) / lightForSeeds(200)).toBeCloseTo(8);
  });

  it('inverts with lightForSeeds', () => {
    for (const seeds of [1, 7, 10, 100, 123, 1000, 54_321]) {
      expect(seedsForLight(lightForSeeds(seeds))).toBe(seeds);
      expect(seedsForLight(lightForSeeds(seeds) * (1 - 1e-9))).toBe(seeds - 1);
    }
  });

  it('only counts Seeds not obtained yet', () => {
    expect(seedsToGain(lateGame(2e9))).toBe(10);
    expect(seedsToGain(lateGame(2e9, { seeds: 4 }))).toBe(6);
    expect(seedsToGain(lateGame(2e9, { seeds: 10 }))).toBe(0);
  });

  it('measures the Light missing before the next Seed', () => {
    expect(lightToNextSeed(lateGame(0))).toBe(2e7);
    expect(lightToNextSeed(lateGame(2e9))).toBeCloseTo(lightForSeeds(11) - 2e9);
    // Seeds already obtained raise the bar.
    expect(lightToNextSeed(lateGame(2e9, { seeds: 10 }))).toBeCloseTo(lightForSeeds(11) - 2e9);
  });

  it('adds +5% of global production per Seed', () => {
    expect(seedBonus(10)).toBeCloseTo(0.5);
    const without = lateGame(0);
    const withSeeds = { ...without, seeds: 10 };
    expect(globalMultiplier(withSeeds) / globalMultiplier(without)).toBeCloseTo(1.5);
    expect(lightPerSecond(withSeeds) / lightPerSecond(without)).toBeCloseTo(1.5);
  });
});

describe('new Season', () => {
  it('is available from one Seed, and advised against before 10 for the first one', () => {
    const early = lateGame(1.6e7);
    expect(canStartNewSeason(early)).toBe(false);
    expect(isSeasonsScreenUnlocked(early)).toBe(false);
    const one = lateGame(2e7);
    expect(canStartNewSeason(one)).toBe(true);
    expect(isSeasonsScreenUnlocked(one)).toBe(true);
    expect(isSeasonPremature(one)).toBe(true);
    expect(isSeasonPremature(lateGame(2e9))).toBe(false);
    // Only the first Season comes with the advice.
    expect(isSeasonPremature(lateGame(6e9, { seeds: 10, seasons: 1 }))).toBe(false);
  });

  it('refuses to start when no Seed would be gained', () => {
    const state = lateGame(2e9, { seeds: 10, seasons: 1 });
    expect(startNewSeason(state)).toBe(state);
  });

  it('resets the Season and keeps Seeds, statistics and the clock', () => {
    const state = lateGame(2e9, { seeds: 0 });
    const before = structuredClone(state);
    const next = startNewSeason(state);
    expect(state).toEqual(before);
    expect(next).toEqual({
      ...createInitialState(1000),
      allTimeLight: 2e9,
      seeds: 10,
      seasons: 1,
      clicks: 500,
      playSeconds: 7200,
      seasonSeconds: 0,
      achievements: [
        'light.3',
        'light.6',
        'light.9',
        'clicks.10',
        'clicks.100',
        'seasons.1',
        'playHours.1',
      ],
      butterfly: { nextIn: state.butterfly.nextIn, visible: 0 },
    });
    expect(isSeasonsScreenUnlocked(next)).toBe(true);
  });

  it('counts the Light of every Season towards the next Seeds', () => {
    let state = startNewSeason(lateGame(2e9));
    expect(seedsToGain(state)).toBe(0);
    state = earnLight(state, lightForSeeds(11) - 2e9);
    expect(state.totalLight).toBeCloseTo(lightForSeeds(11) - 2e9);
    // The new Seed grows at once but is only harvested ripe.
    expect(seedsGrowing(state)).toBe(1);
    expect(seedsToGain(state)).toBe(0);
    state = { ...state, seasonSeconds: SEED_RIPENING_SECONDS };
    expect(seedsToGain(state)).toBe(1);
    expect(startNewSeason(state).seeds).toBe(11);
  });
});

describe('ripening Seeds (§7)', () => {
  it('lets a new Season harvest its Seeds only after 15 minutes of Season', () => {
    expect(SEED_RIPENING_SECONDS).toBe(15 * 60);
    const fresh = lateGame(2e9, { seasonSeconds: 0 });
    expect(seedsGrowing(fresh)).toBe(10);
    expect(seedsToGain(fresh)).toBe(0);
    expect(areSeedsRipe(fresh)).toBe(false);
    expect(canStartNewSeason(fresh)).toBe(false);
    expect(startNewSeason(fresh)).toBe(fresh);
    // The Seasons screen and the first-Season advice already follow the growing Seeds.
    expect(isSeasonsScreenUnlocked(lateGame(2e7, { seasonSeconds: 0 }))).toBe(true);
    expect(isSeasonPremature(lateGame(2e7, { seasonSeconds: 0 }))).toBe(true);
    expect(isSeasonPremature(fresh)).toBe(false);
  });

  it('ripens with elapsed time, offline included', () => {
    const fresh = lateGame(2e9, { seasonSeconds: 0 });
    const halfway = tick(fresh, SEED_RIPENING_SECONDS / 2);
    expect(seasonRipeness(halfway)).toBeCloseTo(0.5);
    expect(secondsToRipeness(halfway)).toBeCloseTo(SEED_RIPENING_SECONDS / 2);
    const ripe = tick(halfway, SEED_RIPENING_SECONDS / 2);
    expect(areSeedsRipe(ripe)).toBe(true);
    expect(secondsToRipeness(ripe)).toBe(0);
    expect(seedsToGain(ripe)).toBeGreaterThanOrEqual(10);
    expect(startNewSeason(ripe).seeds).toBe(seedsToGain(ripe));
  });

  it('tints the scene of later Seasons with the ripening: spring, summer, then autumn (§6)', () => {
    expect(visualSeason(lateGame(2e9, { seasonSeconds: 0 }))).toBeNull();
    const later = (seasonSeconds: number) =>
      lateGame(2e9, { seasons: 1, seeds: 10, seasonSeconds });
    expect(visualSeason(later(0))).toBe('spring');
    expect(visualSeason(later(SEED_RIPENING_SECONDS / 2))).toBe('summer');
    expect(visualSeason(later(SEED_RIPENING_SECONDS))).toBe('autumn');
    expect(visualSeason(later(10 * SEED_RIPENING_SECONDS))).toBe('autumn');
  });
});

describe('play time', () => {
  it('accumulates elapsed time over the game and the Season', () => {
    const state = tick(lateGame(0, { playSeconds: 100, seasonSeconds: 40 }), 2.5);
    expect(state.playSeconds).toBe(102.5);
    expect(state.seasonSeconds).toBe(42.5);
  });
});
