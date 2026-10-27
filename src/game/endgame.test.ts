import { isDeltaComplete, ripeningSeconds } from './delta';
import { CYCLE_TARGETS, simulateCycles, simulateFirstCycle, simulateTwoSeasons } from './simulator';
import { isCanopyComplete } from './talents';
import { RULES_RIPENING_SECONDS } from './upgrades';
import { DISTRICTS_RIPENING_SECONDS } from './districts';

// The endgame (docs/game-design.md §8, M19): the reference player goes on from the first Cycle of
// water, opening the delta, widening its arms and sowing the tree, each Cycle played until it
// brings its Sources to ×1.5. Its own file so it runs beside the other simulator tests.
const { first, second } = simulateTwoSeasons();
const firstCycle = simulateFirstCycle({
  from: second.state,
  elapsed: first.seconds + second.seconds,
});
const run = simulateCycles({ from: firstCycle.state, count: CYCLE_TARGETS.length });

describe('the Cycles after the first (§8, M19)', () => {
  it.each(CYCLE_TARGETS.map((target, i) => [i + 2, target] as const))(
    'plays Cycle %i within ±30% of its target',
    (n, target) => {
      const ratio = run.cycles[n - 2]!.seconds / target;
      expect(ratio).toBeGreaterThanOrEqual(0.7);
      expect(ratio).toBeLessThanOrEqual(1.3);
    },
  );

  it('grows the Sources by half at least, Cycle after Cycle', () => {
    let sources = firstCycle.state.sources;
    for (const cycle of run.cycles) {
      expect(cycle.sources).toBeGreaterThanOrEqual(Math.ceil(sources * 1.5));
      sources = cycle.sources;
    }
  });

  it('keeps every Season at least as long as its Seeds take to ripen', () => {
    // The rules of the buildings and the districts (lots 6 and 7) shorten the ripening.
    const shortest =
      ripeningSeconds(run.state) - RULES_RIPENING_SECONDS - DISTRICTS_RIPENING_SECONDS;
    for (const cycle of run.cycles) {
      for (const seconds of cycle.seasons.slice(0, -1)) {
        expect(seconds).toBeGreaterThanOrEqual(shortest - 1);
      }
    }
  });

  it('completes the Canopy, and opens the delta step by step', () => {
    expect(isCanopyComplete(run.state)).toBe(true);
    expect(run.state.delta.levels.seedArm).toBeGreaterThan(0);
    expect(isDeltaComplete(run.state)).toBe(false);
  });
});
