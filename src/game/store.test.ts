import { exportSave, saveGame } from './save';
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

  it('loads an imported game and saves it', () => {
    const store = new GameStore(localStorage, () => 1000);
    const imported = { ...withPanel(1000), clicks: 50 };
    store.load(imported);
    expect(store.getState()).toBe(imported);
    expect(new GameStore(localStorage, () => 1000).getState().clicks).toBe(50);
  });

  it('resets to a fresh game and overwrites the save', () => {
    saveGame(withPanel(0));
    const store = new GameStore(localStorage, () => 5000);
    store.reset();
    expect(store.getState()).toEqual(createInitialState(5000));
    expect(new GameStore(localStorage, () => 5000).getState().generators.balconyPanel).toBe(0);
  });

  it('imports an exported save, or refuses invalid text', () => {
    const store = new GameStore(localStorage, () => 7000);
    expect(store.importText('garbage')).toBe(false);
    expect(store.getState()).toEqual(createInitialState(7000));
    expect(store.importText(exportSave({ ...withPanel(0), clicks: 9 }))).toBe(true);
    expect(store.getState().clicks).toBe(9);
    expect(store.getState().lastUpdate).toBe(7000);
  });
});
