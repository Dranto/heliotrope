import { applyOfflineProgress, MAX_OFFLINE_SECONDS } from './offline';
import { createInitialState, type GameState } from './state';
import { lightPerSecond } from './production';
import { tick, unlockProgress } from './tick';

function withPanels(now: number): GameState {
  const base = createInitialState(now);
  // Milestones already earned, so production stays steady over a short absence.
  return unlockProgress({ ...base, generators: { ...base.generators, balconyPanel: 2 } });
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
    const capped = applyOfflineProgress(withPanels(0), MAX_OFFLINE_SECONDS * 1000).state;
    expect(state.resources.light).toBeCloseTo(capped.resources.light);
    expect(state.lastUpdate).toBe(now);
  });

  it('pauses Golden Butterfly effects and the butterfly clock while away (§9.1)', () => {
    const start: GameState = {
      ...withPanels(0),
      effects: [{ kind: 'bloom', remaining: 30 }],
      butterfly: { nextIn: 0, visible: 5 },
    };
    const { state } = applyOfflineProgress(start, 100_000);
    expect(state.resources.light).toBeCloseTo(lightPerSecond(withPanels(0)) * 100);
    expect(state.effects).toEqual(start.effects);
    expect(state.butterfly).toEqual(start.butterfly);
  });

  it('does nothing when the clock went backwards', () => {
    const { state, elapsedSeconds } = applyOfflineProgress(withPanels(10_000), 5_000);
    expect(elapsedSeconds).toBe(0);
    expect(state.resources.light).toBe(0);
  });
});
