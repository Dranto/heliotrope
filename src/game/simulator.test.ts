import { BASIN_SITE_IDS } from './bioregion';
import { availableSeeds } from './talents';
import { GENERATOR_IDS } from './generators';
import { CHALLENGE_IDS, type ChallengeId } from './challenges';
import { SEED_RIPENING_SECONDS, startNewSeason } from './seasons';
import {
  ADVISED_CYCLE_TARGET,
  learnReferenceTalents,
  PACING_TARGETS,
  simulate,
  simulateFirstCycle,
  simulateSeasonsAfterCycle,
  simulateTwoSeasons,
} from './simulator';

// Shared by the describes below: playing two Seasons is the slow part.
const twoSeasons = simulateTwoSeasons();

describe('balancing simulator', () => {
  // Milestone 2 exit criterion (docs/game-design.md §12): the simulator reproduces the §8 pacing
  // targets within ±30%. The first pot only has an upper bound ("< 15 s").
  const result = simulate({ maxSeconds: 4.5 * 3600 });

  it('buys the first pot within 15 seconds', () => {
    expect(result.firstGenerator.pot).toBeLessThanOrEqual(PACING_TARGETS.pot);
  });

  it.each(GENERATOR_IDS.filter((id) => id !== 'pot'))(
    'buys the first %s within ±30% of its target',
    (id) => {
      const ratio = result.firstGenerator[id]! / PACING_TARGETS[id];
      expect(ratio).toBeGreaterThanOrEqual(0.7);
      expect(ratio).toBeLessThanOrEqual(1.3);
    },
  );

  it('makes the first Season advisable within ±30% of 1 h 20', () => {
    const ratio = result.advisedSeason! / PACING_TARGETS.advisedSeason;
    expect(ratio).toBeGreaterThanOrEqual(0.7);
    expect(ratio).toBeLessThanOrEqual(1.3);
  });
});

describe('two Seasons in a row', () => {
  // Milestone 3 exit criterion (docs/game-design.md §12): the second Season reaches every
  // pacing event sooner than the first.
  const { first, second } = twoSeasons;

  it('starts the second Season with the 10 advised Seeds', () => {
    expect(second.state.seasons).toBe(1);
    expect(second.state.seeds).toBe(10);
  });

  it('sows its 10 Seeds in the Tree of Seasons, and the cooperatives buy for it (§7)', () => {
    expect(availableSeeds(second.state)).toBe(0);
    expect(second.state.talents).toContain('gardenersCoop');
    expect(second.state.cooperatives.purchases.gardeners).toBeGreaterThan(0);
  });

  it.each(GENERATOR_IDS)('buys the first %s sooner in the second Season', (id) => {
    expect(second.firstGenerator[id]!).toBeLessThan(first.firstGenerator[id]!);
  });

  it('makes the next Season advisable sooner', () => {
    expect(second.advisedSeason!).toBeLessThan(first.advisedSeason!);
  });
});

describe('challenge Seasons (§7.3)', () => {
  // Third Season of the reference player, as a challenge: each one should take a little longer
  // than a free Season (about 30 min at this point), and stay winnable within the hour.
  const { second } = twoSeasons;
  const start = (id: ChallengeId) => learnReferenceTalents(startNewSeason(second.state, id));

  it.each(CHALLENGE_IDS)(
    'wins %s between 20 minutes and an hour',
    (id) => {
      const { challengeWon } = simulate({ state: start(id), maxSeconds: 3600, stopWhenWon: true });
      expect(challengeWon).toBeGreaterThan(20 * 60);
      expect(challengeWon).toBeLessThan(60 * 60);
    },
    30_000,
  );
});

describe('the Bioregion and the first Cycle of water (§7.4)', () => {
  // The reference player goes on from the second Season, each Season played until it doubles
  // its Seeds, with the Bioregion from the third one.
  const { first, second } = twoSeasons;
  const run = simulateFirstCycle({ from: second.state, elapsed: first.seconds + second.seconds });

  it('opens the Bioregion with the third Season, after two hours or so', () => {
    expect(run.bioregionOpened).toBeGreaterThan(90 * 60);
    expect(run.bioregionOpened).toBeLessThan(3 * 3600);
  });

  it('builds collectors and raises every site before the first Cycle', () => {
    expect(Object.values(run.state.collectors).every((n) => n > 0)).toBe(true);
    expect(BASIN_SITE_IDS.every((id) => run.state.sites[id] > 0)).toBe(true);
  });

  it('keeps every later Season at least as long as the Seeds take to ripen (§7)', () => {
    // The first one finishes the second Season, the last one is cut short by the Cycle.
    for (const seconds of run.seasons.slice(1, -1)) {
      expect(seconds).toBeGreaterThanOrEqual(SEED_RIPENING_SECONDS);
    }
  });

  it('makes the first Cycle advisable within ±30% of its target', () => {
    const ratio = run.advisedCycle! / ADVISED_CYCLE_TARGET;
    expect(ratio).toBeGreaterThanOrEqual(0.7);
    expect(ratio).toBeLessThanOrEqual(1.3);
  });
});

describe('later Seasons, after the first Cycle (§7)', () => {
  // Before the ripening Seeds and the deeper soil, these Seasons lasted one to three minutes.
  const { first, second } = twoSeasons;
  const cycle = simulateFirstCycle({ from: second.state, elapsed: first.seconds + second.seconds });
  const { seasons } = simulateSeasonsAfterCycle({ from: cycle.state, count: 5 });

  it('lasts at least the ripening time, Season after Season', () => {
    for (const seconds of seasons) expect(seconds).toBeGreaterThanOrEqual(SEED_RIPENING_SECONDS);
  });

  it('grows longer once doubling the Seeds asks for more than the ripening time', () => {
    expect(seasons.at(-1)!).toBeGreaterThan(20 * 60);
  });
});
