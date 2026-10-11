import { CURVE_FIRST_STEP, CURVE_MAX_POINTS, CURVES_KEPT, emptyCurve, startCurve } from './history';
import { SEED_RIPENING_SECONDS, startNewSeason } from './seasons';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';

function withState(patch: Partial<GameState>): GameState {
  return { ...createInitialState(0), ...patch };
}

describe('production curves (§10.5)', () => {
  it('samples Light per second every step of the Season', () => {
    let state = withState({ generators: { ...createInitialState(0).generators, pot: 10 } });
    state = tick(state, 1);
    expect(state.history).toHaveLength(1);
    expect(state.history[0]!.points).toHaveLength(1);
    expect(state.history[0]!.points[0]).toBeGreaterThan(0);
    state = tick(state, CURVE_FIRST_STEP * 3);
    expect(state.history[0]!.points).toHaveLength(4);
  });

  it('doubles the step instead of growing past the maximum', () => {
    let state = withState({ generators: { ...createInitialState(0).generators, pot: 1 } });
    for (let i = 0; i < 300; i += 1) state = tick(state, CURVE_FIRST_STEP);
    const curve = state.history[0]!;
    expect(curve.points.length).toBeLessThanOrEqual(CURVE_MAX_POINTS);
    expect(curve.step).toBe(CURVE_FIRST_STEP * 4);
    // The curve still covers the whole Season.
    expect(curve.points.length * curve.step).toBeGreaterThan(state.seasonSeconds);
  });

  it('draws a flat stretch over a long catch-up rather than inventing a shape', () => {
    const state = tick(
      withState({ generators: { ...createInitialState(0).generators, pot: 3 } }),
      600,
    );
    const points = state.history[0]!.points;
    expect(points.length).toBe(21);
    expect(new Set(points).size).toBe(1);
  });

  it('opens a new curve with each Season and keeps the last few', () => {
    let state = withState({ totalLight: 1e9, allTimeLight: 1e9 });
    state = tick(state, SEED_RIPENING_SECONDS);
    state = startNewSeason(state);
    expect(state.history.map((c) => c.season)).toEqual([1, 2]);
    expect(state.history[1]).toEqual(emptyCurve(2));

    let history = [emptyCurve(1)];
    for (let season = 2; season <= 10; season += 1) history = startCurve(history, season);
    expect(history).toHaveLength(CURVES_KEPT);
    expect(history[history.length - 1]!.season).toBe(10);
  });
});
