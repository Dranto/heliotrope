import { nextGoal, secondsToAfford } from './goals';
import { GENERATORS } from './generators';
import { generatorCost, lightPerSecond } from './production';
import { createInitialState, type GameState } from './state';

function withState(patch: Partial<GameState>): GameState {
  return { ...createInitialState(0), ...patch };
}

describe('time before purchase (§10.5)', () => {
  it('is zero when the reserve covers the cost', () => {
    expect(secondsToAfford(withState({ resources: { light: 50, water: 0 } }), 20)).toBe(0);
  });

  it('is infinite without production', () => {
    expect(secondsToAfford(createInitialState(0), 20)).toBe(Infinity);
  });

  it('divides the missing Light by the production', () => {
    const state = withState({
      resources: { light: 10, water: 0 },
      generators: { ...createInitialState(0).generators, pot: 5 },
    });
    expect(secondsToAfford(state, 110)).toBeCloseTo(100 / lightPerSecond(state));
  });
});

describe('next goal (§2, §10.5)', () => {
  it('starts with the first generator', () => {
    const goal = nextGoal(createInitialState(0));
    expect(goal).toMatchObject({ kind: 'generator', id: 'pot', discovered: true });
  });

  it('is the cheapest purchase the reserve does not cover', () => {
    const state = withState({
      resources: { light: 12, water: 0 },
      totalLight: 12,
      generators: { ...createInitialState(0).generators, pot: 1 },
    });
    const goal = nextGoal(state)!;
    expect(goal.cost).toBeGreaterThan(12);
    expect(goal).toMatchObject({ kind: 'generator', id: 'pot' });
    expect(goal.cost).toBe(generatorCost(state, 'pot'));
  });

  it('points at the generator still to discover with its base price', () => {
    const state = withState({
      resources: { light: 0, water: 0 },
      totalLight: GENERATORS.pot.baseCost,
      generators: { ...createInitialState(0).generators },
    });
    // Every pot affordable: the next goal is the silhouette of the Balcony Panel.
    const rich = { ...state, resources: { light: 60, water: 0 } };
    expect(nextGoal(rich)).toMatchObject({
      kind: 'generator',
      id: 'balconyPanel',
      discovered: false,
    });
  });
});
