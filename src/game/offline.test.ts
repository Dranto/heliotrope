import { applyOfflineProgress, MAX_OFFLINE_SECONDS } from './offline';
import { createInitialState } from './state';

describe('applyOfflineProgress', () => {
  it('simulates the time spent away', () => {
    const { state, elapsedSeconds } = applyOfflineProgress(createInitialState(0), 125_000);
    expect(elapsedSeconds).toBe(125);
    expect(state.resources.sunlight).toBeCloseTo(125);
    expect(state.lastUpdate).toBe(125_000);
  });

  it('caps the simulated time', () => {
    const now = (MAX_OFFLINE_SECONDS + 3600) * 1000;
    const { state, elapsedSeconds } = applyOfflineProgress(createInitialState(0), now);
    expect(elapsedSeconds).toBe(MAX_OFFLINE_SECONDS);
    expect(state.resources.sunlight).toBeCloseTo(MAX_OFFLINE_SECONDS);
    expect(state.lastUpdate).toBe(now);
  });

  it('does nothing when the clock went backwards', () => {
    const { state, elapsedSeconds } = applyOfflineProgress(createInitialState(10_000), 5_000);
    expect(elapsedSeconds).toBe(0);
    expect(state.resources.sunlight).toBe(0);
  });
});
