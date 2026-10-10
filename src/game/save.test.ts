import {
  clearSave,
  deserialize,
  exportSave,
  importSave,
  loadGame,
  SAVE_KEY,
  saveGame,
  serialize,
} from './save';
import { createInitialState, STATE_VERSION, type GameState } from './state';

function playedState(): GameState {
  const base = createInitialState(1000);
  return {
    ...base,
    resources: { light: 42.5 },
    generators: { ...base.generators, pot: 3, balconyPanel: 1 },
    upgrades: ['pot.1', 'gloves'],
    totalLight: 300,
    allTimeLight: 9e9,
    seeds: 12,
    seasons: 2,
    clicks: 120,
    playSeconds: 30_000,
    seasonSeconds: 600,
  };
}

describe('save', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips through serialize/deserialize', () => {
    const state = playedState();
    expect(deserialize(serialize(state), 0)).toEqual(state);
  });

  it('round-trips through localStorage', () => {
    const state = playedState();
    saveGame(state);
    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull();
    expect(loadGame(0)).toEqual(state);
    clearSave();
    expect(loadGame(0)).toBeNull();
  });

  it('rejects corrupt or future saves', () => {
    expect(deserialize('not json', 0)).toBeNull();
    expect(deserialize('null', 0)).toBeNull();
    expect(deserialize(JSON.stringify({ version: STATE_VERSION + 1 }), 0)).toBeNull();
  });

  it('fills missing or invalid fields with defaults', () => {
    const json = JSON.stringify({
      version: STATE_VERSION,
      resources: { light: 'lots' },
      generators: { pot: -1, balconyPanel: 2.5, rooftopGarden: null },
      totalLight: NaN,
      clicks: 'many',
      upgrades: 'all',
    });
    expect(deserialize(json, 500)).toEqual(createInitialState(500));
  });

  it('migrates a v1 placeholder save to a fresh game that keeps its timestamp', () => {
    const v1 = JSON.stringify({ version: 1, resources: { sunlight: 9000 }, lastUpdate: 1234 });
    expect(deserialize(v1, 0)).toEqual(createInitialState(1234));
  });

  it('keeps known upgrades once and drops unknown ones', () => {
    const json = JSON.stringify({
      version: STATE_VERSION,
      upgrades: ['pot.1', 'cheat', 'pot.1', 42, 'sharedCompost'],
    });
    expect(deserialize(json, 0)?.upgrades).toEqual(['pot.1', 'sharedCompost']);
  });

  it('migrates a v2 save, keeping its progress and adding no upgrades', () => {
    const v2 = JSON.stringify({
      version: 2,
      resources: { light: 77 },
      generators: { pot: 4, greenhouse: 1 },
      totalLight: 20_000,
      clicks: 300,
      lastUpdate: 5000,
    });
    const state = deserialize(v2, 0)!;
    expect(state.version).toBe(STATE_VERSION);
    expect(state.upgrades).toEqual([]);
    expect(state.resources.light).toBe(77);
    expect(state.generators.pot).toBe(4);
    expect(state.generators.greenhouse).toBe(1);
    expect(state.generators.arcology).toBe(0);
    expect(state.totalLight).toBe(20_000);
    expect(state.lastUpdate).toBe(5000);
  });

  it('migrates a v3 save into its first Season, counting its Light as all-time Light', () => {
    const v3 = JSON.stringify({
      version: 3,
      resources: { light: 10 },
      generators: { pot: 2 },
      upgrades: ['pot.1'],
      totalLight: 6e8,
      clicks: 40,
      lastUpdate: 7000,
    });
    const state = deserialize(v3, 0)!;
    expect(state).toMatchObject({
      version: STATE_VERSION,
      upgrades: ['pot.1'],
      totalLight: 6e8,
      allTimeLight: 6e8,
      seeds: 0,
      seasons: 0,
      clicks: 40,
      playSeconds: 0,
      seasonSeconds: 0,
    });
  });

  it('never lets the all-time Light fall below the Season total', () => {
    const json = JSON.stringify({ version: STATE_VERSION, totalLight: 500, allTimeLight: 100 });
    expect(deserialize(json, 0)?.allTimeLight).toBe(500);
  });
});

describe('export and import', () => {
  it('round-trips a game, resuming at the import time', () => {
    const state = playedState();
    const text = exportSave(state);
    expect(text).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(importSave(text, 99_000)).toEqual({ ...state, lastUpdate: 99_000 });
  });

  it('ignores whitespace around a pasted save', () => {
    const state = playedState();
    const text = exportSave(state);
    expect(importSave(`  ${text.slice(0, 10)}\n${text.slice(10)}  `, 0)?.clicks).toBe(120);
  });

  it('rejects text that is not a save', () => {
    expect(importSave('', 0)).toBeNull();
    expect(importSave('not base64 at all!', 0)).toBeNull();
    expect(importSave(btoa('{"version": 99}'), 0)).toBeNull();
    expect(importSave(btoa('\xff\xfe'), 0)).toBeNull();
  });
});
