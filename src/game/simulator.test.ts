import { GENERATOR_IDS } from './generators';
import { PACING_TARGETS, simulate, simulateTwoSeasons } from './simulator';

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

  it('makes the first Season advisable within ±30% of 1 h 55', () => {
    const ratio = result.advisedSeason! / PACING_TARGETS.advisedSeason;
    expect(ratio).toBeGreaterThanOrEqual(0.7);
    expect(ratio).toBeLessThanOrEqual(1.3);
  });
});

describe('two Seasons in a row', () => {
  // Milestone 3 exit criterion (docs/game-design.md §12): the second Season reaches every
  // pacing event sooner than the first.
  const { first, second } = simulateTwoSeasons();

  it('starts the second Season with the 10 advised Seeds', () => {
    expect(second.state.seasons).toBe(1);
    expect(second.state.seeds).toBe(10);
  });

  it.each(GENERATOR_IDS)('buys the first %s sooner in the second Season', (id) => {
    expect(second.firstGenerator[id]!).toBeLessThan(first.firstGenerator[id]!);
  });

  it('makes the next Season advisable sooner', () => {
    expect(second.advisedSeason!).toBeLessThan(first.advisedSeason!);
  });
});
