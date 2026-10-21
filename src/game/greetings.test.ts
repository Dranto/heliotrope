import { describe, expect, it } from 'vitest';
import {
  canGreet,
  createGreetingsState,
  GREET_COOLDOWN,
  greetSpecies,
  totalGreetings,
  validGreetings,
} from './greetings';
import { withAllIntroduced } from './introductions';
import { createInitialState, type GameState } from './state';

function withBee(extra: Partial<GameState> = {}): GameState {
  return { ...withAllIntroduced(createInitialState(0)), species: ['bee'], ...extra };
}

describe('totalGreetings', () => {
  it('adds the greetings of every species', () => {
    expect(totalGreetings({ greetings: createGreetingsState() })).toBe(0);
    expect(totalGreetings({ greetings: { counts: { bee: 3, frog: 2 }, last: {} } })).toBe(5);
  });
});

describe('canGreet', () => {
  it('waits for the next passage, counted in play time', () => {
    const greeted = greetSpecies(withBee({ playSeconds: 500 }), 'bee');
    expect(canGreet({ ...greeted, playSeconds: 500 + GREET_COOLDOWN - 1 }, 'bee')).toBe(false);
    expect(canGreet({ ...greeted, playSeconds: 500 + GREET_COOLDOWN }, 'bee')).toBe(true);
  });

  it('never locks a species whose last greeting lies ahead of the play time', () => {
    // An imported save can carry a later greeting than its own play time.
    const state = withBee({
      playSeconds: 10,
      greetings: { counts: { bee: 1 }, last: { bee: 5000 } },
    });
    expect(canGreet(state, 'bee')).toBe(true);
    expect(greetSpecies(state, 'bee').greetings.last.bee).toBe(10);
  });
});

describe('validGreetings', () => {
  it('starts empty from anything that is not an object', () => {
    for (const raw of [undefined, null, 3, 'bee', true]) {
      expect(validGreetings(raw)).toEqual(createGreetingsState());
    }
  });

  it('keeps whole positive counts of known species only', () => {
    const counts = { bee: 2, frog: 0, otter: -1, salmon: 1.5, dragon: 4, hedgehog: '3' };
    expect(validGreetings({ counts }).counts).toEqual({ bee: 2 });
  });

  it('keeps finite, non-negative greeting times of known species only', () => {
    const last = { bee: 0, frog: 120.5, otter: -1, salmon: Infinity, dragon: 10, hedgehog: NaN };
    expect(validGreetings({ last }).last).toEqual({ bee: 0, frog: 120.5 });
  });

  it('ignores counts and times that are not objects', () => {
    expect(validGreetings({ counts: 3, last: null })).toEqual(createGreetingsState());
  });
});
