import { saveGame } from './save';
import { createInitialState } from './state';
import { GameStore } from './store';
import { gather } from './tick';

describe('GameStore', () => {
  beforeEach(() => localStorage.clear());

  it('starts fresh without a save', () => {
    const store = new GameStore(localStorage, () => 1000);
    expect(store.getState()).toEqual(createInitialState(1000));
    expect(store.offlineSeconds).toBe(0);
  });

  it('applies offline progress from an existing save', () => {
    saveGame(createInitialState(0));
    const store = new GameStore(localStorage, () => 60_000);
    expect(store.offlineSeconds).toBe(60);
    expect(store.getState().resources.sunlight).toBeCloseTo(60);
  });

  it('steps to the current time and notifies subscribers', () => {
    let now = 0;
    const store = new GameStore(localStorage, () => now);
    const listener = vi.fn();
    store.subscribe(listener);
    now = 3000;
    store.step();
    expect(store.getState().resources.sunlight).toBeCloseTo(3);
    store.dispatch((s) => gather(s, 'sunlight'));
    expect(store.getState().resources.sunlight).toBeCloseTo(4);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
