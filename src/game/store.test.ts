import { saveGame } from './save';
import { createInitialState } from './state';
import { GameStore } from './store';
import { clickHeliotrope } from './tick';

function withPanel(now: number) {
  const base = createInitialState(now);
  return { ...base, generators: { ...base.generators, balconyPanel: 1 } };
}

describe('GameStore', () => {
  beforeEach(() => localStorage.clear());

  it('starts fresh without a save', () => {
    const store = new GameStore(localStorage, () => 1000);
    expect(store.getState()).toEqual(createInitialState(1000));
    expect(store.offlineSeconds).toBe(0);
    expect(store.offlineLight).toBe(0);
  });

  it('applies offline progress from an existing save', () => {
    saveGame(withPanel(0));
    const store = new GameStore(localStorage, () => 60_000);
    expect(store.offlineSeconds).toBe(60);
    expect(store.offlineLight).toBeCloseTo(60);
    expect(store.getState().resources.light).toBeCloseTo(60);
  });

  it('steps to the current time and notifies subscribers', () => {
    let now = 0;
    saveGame(withPanel(0));
    const store = new GameStore(localStorage, () => now);
    const listener = vi.fn();
    store.subscribe(listener);
    now = 3000;
    store.step();
    expect(store.getState().resources.light).toBeCloseTo(3);
    store.dispatch(clickHeliotrope);
    expect(store.getState().resources.light).toBeCloseTo(4);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
