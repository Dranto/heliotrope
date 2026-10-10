import { createInitialState } from './state';
import { gather, tick } from './tick';

describe('tick', () => {
  it('adds passive production proportional to elapsed time', () => {
    const state = tick(createInitialState(0), 2.5);
    expect(state.resources.sunlight).toBeCloseTo(2.5);
    expect(state.lastUpdate).toBe(2500);
  });

  it('ignores non-positive time steps', () => {
    const state = createInitialState(0);
    expect(tick(state, 0)).toBe(state);
    expect(tick(state, -1)).toBe(state);
  });

  it('does not mutate the input state', () => {
    const state = createInitialState(0);
    tick(state, 10);
    expect(state.resources.sunlight).toBe(0);
  });
});

describe('gather', () => {
  it('adds a manual amount', () => {
    expect(gather(createInitialState(0), 'sunlight', 3).resources.sunlight).toBe(3);
  });
});
