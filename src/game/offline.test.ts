import { applyOfflineProgress, MAX_OFFLINE_SECONDS } from './offline';
import { createInitialState, type GameState } from './state';
import { lightPerSecond, tick } from './tick';

function withPanels(now: number): GameState {
  const base = createInitialState(now);
  return { ...base, generators: { ...base.generators, balconyPanel: 2 } };
}

describe('applyOfflineProgress', () => {
  it('simulates the time spent away like online play', () => {
    const start = withPanels(0);
    const { state, elapsedSeconds } = applyOfflineProgress(start, 125_000);
    expect(elapsedSeconds).toBe(125);
    expect(state.resources.light).toBeCloseTo(lightPerSecond(start) * 125);
    expect(state.resources.light).toBeCloseTo(tick(start, 125).resources.light);
    expect(state.lastUpdate).toBe(125_000);
  });

  it('caps the simulated time', () => {
    const now = (MAX_OFFLINE_SECONDS + 3600) * 1000;
    const { state, elapsedSeconds } = applyOfflineProgress(withPanels(0), now);
    expect(elapsedSeconds).toBe(MAX_OFFLINE_SECONDS);
    expect(state.resources.light).toBeCloseTo(2 * MAX_OFFLINE_SECONDS);
    expect(state.lastUpdate).toBe(now);
  });

  it('does nothing when the clock went backwards', () => {
    const { state, elapsedSeconds } = applyOfflineProgress(withPanels(10_000), 5_000);
    expect(elapsedSeconds).toBe(0);
    expect(state.resources.light).toBe(0);
  });
});
