import { describe, expect, it } from 'vitest';
import { WHOLE_GAME_TARGETS, simulateWholeGame, tendLoops, tendWorkshop } from './wholeGame';
import { createInitialState } from './state';

// The whole game (docs/game-design.md §8, M30): the reference player, in sessions of an hour of
// play and three hours away, from the first click to the second sister city. Its own file so it
// runs beside the other simulator tests.
const run = simulateWholeGame();

describe('the whole game (§8, M30)', () => {
  it.each(WHOLE_GAME_TARGETS.map((target, i) => [i + 1, target] as const))(
    'founds sister city %i within ±30% of its target',
    (n, target) => {
      const ratio = run.swarms[n - 1]!.played / target;
      expect(ratio).toBeGreaterThanOrEqual(0.7);
      expect(ratio).toBeLessThanOrEqual(1.3);
    },
  );

  it('plays every loop on the way: works, orchard, alliances, requests, workshop', () => {
    const { state } = run;
    expect(state.city.founded).toEqual(['home', 'plain']);
    expect(state.city.landscape).toBe('forest');
    expect(Object.values(state.greatWorks.works).every((w) => w.stage > 0)).toBe(true);
    expect(state.orchard.hives).toBeGreaterThan(0);
    expect(state.alliances.chosen.length).toBeGreaterThanOrEqual(3);
    expect(state.requests.served).toBeGreaterThan(0);
    expect(Object.keys(state.city.workshop).length).toBeGreaterThan(0);
    // Real time runs four times as fast as play: an hour played for three away.
    expect(run.swarms[0]!.real).toBeCloseTo(run.swarms[0]!.played * 4, -4);
  });

  it('leaves a fresh game alone, with nothing to tend', () => {
    const fresh = createInitialState(0);
    expect(tendLoops(fresh)).toEqual(fresh);
    expect(tendWorkshop(fresh)).toBe(fresh);
  });
});
