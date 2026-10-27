import { describe, expect, it } from 'vitest';
import { simulateTwoSeasons } from './simulator';
import {
  ATTENTIVE_SEASON_TARGET,
  ATTENTIVE_TARGETS,
  attentiveSessions,
  simulateWholeGame,
} from './wholeGame';

// The attentive player (docs/game-design.md §8, slimming plan lot 9): it never leaves, tends the
// garden every three minutes and welcomes every visitor. Its own file so it runs beside the
// reference player's whole game.
const run = simulateWholeGame({ attentive: true });

describe('the attentive player (§8)', () => {
  it('plays its first Season within ±30% of its target', () => {
    const { first } = simulateTwoSeasons({ tend: attentiveSessions().tend });
    const ratio = first.seconds / ATTENTIVE_SEASON_TARGET;
    expect(ratio).toBeGreaterThanOrEqual(0.7);
    expect(ratio).toBeLessThanOrEqual(1.3);
  });

  it.each(ATTENTIVE_TARGETS.map((target, i) => [i + 1, target] as const))(
    'founds sister city %i within ±30% of its target',
    (n, target) => {
      const ratio = run.swarms[n - 1]!.played / target;
      expect(ratio).toBeGreaterThanOrEqual(0.7);
      expect(ratio).toBeLessThanOrEqual(1.3);
    },
  );

  it('welcomes the visitors and never leaves', () => {
    expect(Object.values(run.state.visits).every((n) => n > 0)).toBe(true);
    expect(run.state.garden.harvests).toBeGreaterThan(0);
    expect(run.swarms[0]!.real).toBe(run.swarms[0]!.played);
  });
});
