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
import { createInitialState, DEFAULT_SETTINGS, STATE_VERSION, type GameState } from './state';

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
    idleSeconds: 30,
    achievements: ['light.3', 'pot.1'],
    parcels: ['gardenStreet', 'river'],
    projects: ['seedSwap'],
    butterflies: 3,
    butterfly: { nextIn: 0, visible: 4.5 },
    effects: [{ kind: 'bloom', remaining: 20 }],
    rngSeed: 123_456,
    settings: { notation: 'scientific', reducedMotion: true, volume: 0.3, muted: true },
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
    expect(deserialize(v1, 0)).toEqual({ ...createInitialState(0), lastUpdate: 1234 });
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

  it('migrates a v4 save, keeping its progress with no Milestones yet', () => {
    const v4 = JSON.stringify({
      version: 4,
      resources: { light: 50 },
      generators: { pot: 2 },
      upgrades: ['pot.1'],
      totalLight: 900,
      allTimeLight: 5e9,
      seeds: 10,
      seasons: 1,
      clicks: 40,
      playSeconds: 9000,
      seasonSeconds: 300,
      lastUpdate: 77,
    });
    const state = deserialize(v4, 0)!;
    expect(state.version).toBe(STATE_VERSION);
    expect(state.seeds).toBe(10);
    expect(state.generators.pot).toBe(2);
    expect(state.achievements).toEqual([]);
    expect(state).not.toHaveProperty('journal');
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
    expect(state.butterfly.visible).toBe(0);
  });

  it('migrates a v5 save, dropping the journal and keeping everything else', () => {
    const played = playedState();
    const v5 = JSON.stringify({
      ...played,
      version: 5,
      journal: ['firstLight', 'firstPot'],
    });
    const state = deserialize(v5, 0)!;
    expect(state).toEqual(played);
    expect(state).not.toHaveProperty('journal');
  });

  it('drops invalid Milestones, effects and settings', () => {
    const json = JSON.stringify({
      version: STATE_VERSION,
      achievements: ['pot.1', 'cheat', 'pot.1'],
      butterflies: -2,
      butterfly: { nextIn: 1e9, visible: 99 },
      effects: [{ kind: 'bloom', remaining: 1e6 }, { kind: 'magic', remaining: 3 }, null],
      rngSeed: -5,
      settings: { notation: 'roman', reducedMotion: 'yes', volume: 3, muted: 'no' },
    });
    const state = deserialize(json, 0)!;
    const fresh = createInitialState(0);
    expect(state.achievements).toEqual(['pot.1']);
    expect(state.butterflies).toBe(0);
    expect(state.butterfly).toEqual({ nextIn: 8 * 60, visible: 12 });
    expect(state.effects).toEqual([]);
    expect(state.rngSeed).toBe(fresh.rngSeed);
    expect(state.settings).toEqual(fresh.settings);
  });

  it('migrates a v6 save with nothing restored and the sound on', () => {
    const v6 = JSON.stringify({
      version: 6,
      generators: { pot: 3 },
      seeds: 4,
      settings: { notation: 'scientific', reducedMotion: true },
    });
    const state = deserialize(v6, 0)!;
    expect(state.version).toBe(STATE_VERSION);
    expect(state.generators.pot).toBe(3);
    expect(state.parcels).toEqual([]);
    expect(state.projects).toEqual([]);
    expect(state.settings).toEqual({
      ...DEFAULT_SETTINGS,
      notation: 'scientific',
      reducedMotion: true,
    });
  });

  it('keeps known parcels and projects once and drops unknown ones', () => {
    const json = JSON.stringify({
      version: STATE_VERSION,
      parcels: ['river', 'moon', 'river'],
      projects: ['tram', 42, 'tram'],
    });
    const state = deserialize(json, 0)!;
    expect(state.parcels).toEqual(['river']);
    expect(state.projects).toEqual(['tram']);
  });

  it('accepts an effect lengthened by a project, but no longer', () => {
    const json = (remaining: number) =>
      JSON.stringify({
        version: STATE_VERSION,
        projects: ['festival'],
        effects: [{ kind: 'bloom', remaining }],
      });
    expect(deserialize(json(85), 0)!.effects).toEqual([{ kind: 'bloom', remaining: 85 }]);
    expect(deserialize(json(95), 0)!.effects).toEqual([]);
  });
});
