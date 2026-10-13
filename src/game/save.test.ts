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
import { INTRO_GAP_SECONDS, withAllIntroduced } from './introductions';

/** A new game whose mechanics are all introduced (§10.8), to test them directly. */
const openGame = (now: number) => withAllIntroduced(createInitialState(now));
/** A save without introductions counts as older: nothing it shows is held back, nothing is new. */
const olderNewGame = (now: number) => ({
  ...createInitialState(now),
  intro: { introduced: [], sinceLast: INTRO_GAP_SECONDS },
});
function playedState(): GameState {
  const base = openGame(1000);
  return {
    ...base,
    resources: { water: 0, light: 42.5 },
    generators: { ...base.generators, pot: 3, balconyPanel: 1 },
    upgrades: ['pot.1', 'gloves'],
    totalLight: 300,
    allTimeLight: 9e9,
    seeds: 12,
    seasons: 2,
    history: [
      { season: 2, step: 60, points: [1, 4, 9] },
      { season: 3, step: 30, points: [2, 3] },
    ],
    clicks: 120,
    playSeconds: 30_000,
    seasonSeconds: 600,
    idleSeconds: 30,
    achievements: ['light.3', 'pot.1'],
    parcels: ['gardenStreet', 'river'],
    projects: ['seedSwap'],
    talents: ['gardenersCoop', 'roofersCoop', 'nectarFlowers'],
    challenge: 'frugal',
    challenges: ['cloudy'],
    species: ['frog', 'kingfisher'],
    cooperatives: {
      paused: ['roofers'],
      thrifty: true,
      purchases: {
        gardeners: 40,
        roofers: 7,
        farmers: 0,
        foresters: 0,
        council: 0,
        growers: 0,
        beekeepers: 0,
        fountaineers: 0,
      },
    },
    butterflies: 3,
    butterfly: { nextIn: 0, visible: 4.5 },
    effects: [{ kind: 'bloom', remaining: 20 }],
    rngSeed: 123_456,
    settings: {
      notation: 'scientific',
      reducedMotion: true,
      volume: 0.3,
      muted: true,
      language: 'en',
      music: 0.2,
      reminders: true,
    },
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
      resources: { water: 0, light: 'lots' },
      generators: { pot: -1, balconyPanel: 2.5, rooftopGarden: null },
      totalLight: NaN,
      clicks: 'many',
      upgrades: 'all',
    });
    expect(deserialize(json, 500)).toEqual(olderNewGame(500));
  });

  it('migrates a v1 placeholder save to a fresh game that keeps its timestamp', () => {
    const v1 = JSON.stringify({ version: 1, resources: { sunlight: 9000 }, lastUpdate: 1234 });
    expect(deserialize(v1, 0)).toEqual({ ...olderNewGame(0), lastUpdate: 1234 });
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
      resources: { water: 0, light: 77 },
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
      resources: { water: 0, light: 10 },
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
      resources: { water: 0, light: 50 },
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

  it('migrates a v10 save into the first Cycle, with no Water yet (§7.4)', () => {
    const v10 = JSON.stringify({
      version: 10,
      allTimeLight: 5e9,
      totalLight: 1e9,
      seeds: 15,
      seasons: 3,
      resources: { light: 200 },
    });
    const state = deserialize(v10, 0)!;
    expect(state.version).toBe(STATE_VERSION);
    expect(state.resources).toEqual({ light: 200, water: 0 });
    expect(state.lightBeforeCycle).toBe(0);
    expect(state.collectors).toEqual({ roofTanks: 0, swales: 0, ponds: 0, streams: 0 });
    expect(state.sources).toBe(0);
    expect(state.cycles).toBe(0);
  });

  it('migrates a v11 save with an empty production curve for the current Season (§10.5)', () => {
    const v11 = JSON.stringify({ version: 11, seasons: 4, resources: { light: 10 } });
    const state = deserialize(v11, 0)!;
    expect(state.version).toBe(STATE_VERSION);
    expect(state.history).toEqual([{ season: 5, step: 30, points: [] }]);
  });

  it('migrates a v38 save to a tree of its own that stays the same from load to load (§10.4)', () => {
    const v38 = JSON.stringify({ version: 38, rngSeed: 4242 });
    const first = deserialize(v38, 0)!;
    const again = deserialize(v38, 99_999)!;
    expect(first.treeSeed).toBe(again.treeSeed);
    expect(deserialize(JSON.stringify({ version: 38, rngSeed: 4243 }), 0)!.treeSeed).not.toBe(
      first.treeSeed,
    );
    // Saved again, the seed is kept as it is.
    expect(deserialize(serialize(first), 5)!.treeSeed).toBe(first.treeSeed);
  });

  it('migrates a v12 save with no visit yet, and keeps a visitor on the map (§9.6)', () => {
    const v12 = deserialize(JSON.stringify({ version: 12, resources: { light: 5 } }), 0)!;
    expect(v12.version).toBe(STATE_VERSION);
    expect(v12.visits).toEqual(openGame(0).visits);
    expect(v12.visit.kind).toBeNull();
    const json = JSON.stringify({
      version: STATE_VERSION,
      visits: { cuttings: 3, shower: -1, birds: 2.5 },
      visit: { nextIn: 0, kind: 'birds', visible: 12 },
      effects: [
        { kind: 'shower', remaining: 30 },
        { kind: 'storm', remaining: 30 },
      ],
    });
    const state = deserialize(json, 0)!;
    expect(state.visits).toEqual({ ...openGame(0).visits, cuttings: 3 });
    expect(state.visit).toEqual({ nextIn: 0, kind: 'birds', visible: 12 });
    expect(state.effects).toEqual([{ kind: 'shower', remaining: 30 }]);
    const unknown = JSON.stringify({
      version: STATE_VERSION,
      visit: { nextIn: 10, kind: 'parade', visible: 5 },
    });
    expect(deserialize(unknown, 0)!.visit.kind).toBeNull();
  });

  it('keeps the neighbouring districts restored and drops unknown ones (§6.4)', () => {
    const json = JSON.stringify({
      version: 13,
      districts: ['tanneries', 'moon', 'tanneries', 'railyard'],
    });
    expect(deserialize(json, 0)!.districts).toEqual(['tanneries', 'railyard']);
  });

  it('keeps well-formed production curves and drops broken ones', () => {
    const curves = [
      { season: 1, step: 30, points: [1, 2] },
      { season: 2, step: 60, points: [3] },
    ];
    const good = JSON.stringify({ version: STATE_VERSION, seasons: 1, history: curves });
    expect(deserialize(good, 0)!.history).toEqual(curves);
    const stale = JSON.stringify({ version: STATE_VERSION, seasons: 3, history: curves });
    expect(deserialize(stale, 0)!.history).toEqual([{ season: 4, step: 30, points: [] }]);
    const broken = JSON.stringify({
      version: STATE_VERSION,
      seasons: 0,
      history: [{ season: 1, step: 30, points: [-1] }],
    });
    expect(deserialize(broken, 0)!.history).toEqual([{ season: 1, step: 30, points: [] }]);
  });

  it('keeps the Bioregion and Cycle totals consistent', () => {
    const json = JSON.stringify({
      version: STATE_VERSION,
      allTimeLight: 1e9,
      totalLight: 1e8,
      lightBeforeCycle: 2e9,
      resources: { light: 0, water: 50 },
      allTimeWater: 10,
      waterBeforeCycle: 5,
      collectors: { roofTanks: 2, swales: -1, ponds: 1.5 },
      sites: { wetlands: 3, cheat: 9 },
      sources: 4,
      cycles: 1,
      rootedSeeds: 6,
      seeds: 2,
      talents: ['gardenersCoop', 'nightWatch', 'roofersCoop', 'mycorrhiza'],
    });
    const state = deserialize(json, 0)!;
    expect(state.lightBeforeCycle).toBe(0);
    expect(state.allTimeWater).toBe(50);
    expect(state.waterBeforeCycle).toBe(0);
    expect(state.collectors).toEqual({ roofTanks: 2, swales: 0, ponds: 0, streams: 0 });
    expect(state.sites).toEqual({
      wetlands: 3,
      meadows: 0,
      foodForests: 0,
      oldForest: 0,
      hillsides: 0,
    });
    expect(state.sources).toBe(4);
    expect(state.cycles).toBe(1);
    // The rooted Seeds still pay for the talents learnt before the Cycle.
    expect(state.talents).toEqual(['gardenersCoop', 'nightWatch', 'roofersCoop', 'mycorrhiza']);
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
    const fresh = openGame(0);
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

  it('accepts an effect lengthened by a project and a flight (§5.6), but no longer', () => {
    const json = (remaining: number) =>
      JSON.stringify({
        version: STATE_VERSION,
        projects: ['festival'],
        effects: [{ kind: 'bloom', remaining }],
      });
    expect(deserialize(json(85), 0)!.effects).toEqual([{ kind: 'bloom', remaining: 85 }]);
    // 90 s with the project, ×1.5 when the butterfly is caught during a pollen flight.
    expect(deserialize(json(135), 0)!.effects).toEqual([{ kind: 'bloom', remaining: 135 }]);
    expect(deserialize(json(140), 0)!.effects).toEqual([]);
  });

  it('migrates a v7 save with no talent learnt and every Seed to spend', () => {
    const v7 = JSON.stringify({ version: 7, seeds: 10, seasons: 1, parcels: ['river'] });
    const state = deserialize(v7, 0)!;
    expect(state.version).toBe(STATE_VERSION);
    expect(state.seeds).toBe(10);
    expect(state.parcels).toEqual(['river']);
    expect(state.talents).toEqual([]);
    expect(state.cooperatives).toEqual(openGame(0).cooperatives);
  });

  it('keeps only talents learnt after their parent and paid for by the Seeds', () => {
    const json = (seeds: number, talents: unknown[]) =>
      JSON.stringify({ version: STATE_VERSION, seeds, talents });
    // roofersCoop needs gardenersCoop; farmersCoop then needs roofersCoop.
    expect(deserialize(json(10, ['roofersCoop', 'farmersCoop', 'oak']), 0)!.talents).toEqual([]);
    expect(
      deserialize(json(10, ['gardenersCoop', 'roofersCoop', 'gardenersCoop']), 0)!.talents,
    ).toEqual(['gardenersCoop', 'roofersCoop']);
    // 1 + 2 Seeds spent; the 3-Seed farmers do not fit in 4 Seeds.
    expect(
      deserialize(json(4, ['gardenersCoop', 'roofersCoop', 'farmersCoop', 'nightWatch']), 0)!
        .talents,
    ).toEqual(['gardenersCoop', 'roofersCoop', 'nightWatch']);
  });

  it('drops unknown cooperatives and invalid purchase counts', () => {
    const state = deserialize(
      JSON.stringify({
        version: STATE_VERSION,
        cooperatives: {
          paused: ['council', 'robots', 'council'],
          thrifty: 'yes',
          purchases: { gardeners: 12, roofers: -3, farmers: 1.5 },
        },
      }),
      0,
    )!;
    expect(state.cooperatives.paused).toEqual(['council']);
    expect(state.cooperatives.thrifty).toBe(false);
    expect(state.cooperatives.purchases).toEqual({
      gardeners: 12,
      roofers: 0,
      farmers: 0,
      foresters: 0,
      council: 0,
      fountaineers: 0,
      growers: 0,
      beekeepers: 0,
    });
  });

  it('migrates a v8 save to the French interface and keeps a saved language', () => {
    const v8 = JSON.stringify({ version: 8, settings: { notation: 'scientific' } });
    expect(deserialize(v8, 0)!.settings).toMatchObject({ notation: 'scientific', language: 'fr' });
    const json = (language: unknown) =>
      JSON.stringify({ version: STATE_VERSION, settings: { language } });
    expect(deserialize(json('en'), 0)!.settings.language).toBe('en');
    expect(deserialize(json('klingon'), 0)!.settings.language).toBe('fr');
  });

  it('migrates a v9 save with no challenge and an empty Herbier, and drops unknown entries', () => {
    const v9 = deserialize(JSON.stringify({ version: 9, parcels: ['river'] }), 0)!;
    expect(v9).toMatchObject({ challenge: null, challenges: [], species: [] });
    const state = deserialize(
      JSON.stringify({
        version: STATE_VERSION,
        challenge: 'wild',
        challenges: ['cloudy', 'storm', 'cloudy'],
        species: ['frog', 'dragon', 'frog'],
      }),
      0,
    )!;
    expect(state).toMatchObject({ challenge: 'wild', challenges: ['cloudy'], species: ['frog'] });
    // A challenge already won cannot be running.
    const json = JSON.stringify({
      version: STATE_VERSION,
      challenge: 'cloudy',
      challenges: ['cloudy'],
    });
    expect(deserialize(json, 0)!.challenge).toBeNull();
  });
});
