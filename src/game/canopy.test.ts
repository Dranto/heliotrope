import { factorOf, keptGeneratorShare } from './bonuses';
import { runCooperatives } from './cooperatives';
import { startNewCycle, waterForSources } from './cycles';
import { lightForSeeds, runSower, SEED_RIPENING_SECONDS } from './seasons';
import { createInitialState, type GameState } from './state';
import { deserialize, serialize } from './save';
import {
  availableSeeds,
  CANOPY,
  CANOPY_IDS,
  canopyLevelCost,
  canopySeedsSpent,
  canRaiseCanopy,
  canSowInTree,
  isCanopyOpen,
  raiseCanopy,
  seedsSpent,
  setSowerFactor,
  TALENT_LIST,
  type CanopyId,
} from './talents';
import { tick } from './tick';

const ALL_TALENTS = TALENT_LIST.map((t) => t.id);

/** A player who learnt the whole tree and has `spare` Seeds left to sow. */
function fullTree(spare: number, extra: Partial<GameState> = {}): GameState {
  const seeds = seedsSpent(ALL_TALENTS) + spare;
  return {
    ...createInitialState(0),
    seeds,
    seasons: 10,
    talents: ALL_TALENTS,
    allTimeLight: lightForSeeds(seeds),
    ...extra,
  };
}

function withLevel(state: GameState, id: CanopyId, level: number): GameState {
  return { ...state, canopy: { ...state.canopy, levels: { ...state.canopy.levels, [id]: level } } };
}

describe('Canopy of the Tree of Seasons (§7.1, M13)', () => {
  it('opens only once every talent of the tree is learnt', () => {
    const almost = { ...fullTree(100), talents: ALL_TALENTS.slice(1) };
    expect(isCanopyOpen(almost)).toBe(false);
    expect(raiseCanopy(almost, 'rootsBough')).toBe(almost);
    expect(isCanopyOpen(fullTree(100))).toBe(true);
  });

  it('spends Seeds level after level, each level dearer than the last', () => {
    const state = fullTree(20);
    expect(canopyLevelCost('rootsBough', 0)).toBe(5);
    expect(canopyLevelCost('rootsBough', 1)).toBeGreaterThan(5);
    const once = raiseCanopy(state, 'rootsBough');
    expect(once.canopy.levels.rootsBough).toBe(1);
    expect(availableSeeds(once)).toBe(15);
    expect(once.seeds).toBe(state.seeds);
    const twice = raiseCanopy(once, 'rootsBough');
    expect(availableSeeds(twice)).toBe(15 - canopyLevelCost('rootsBough', 1));
  });

  it('stops at the last level and when Seeds run out', () => {
    const maxed = withLevel(fullTree(10_000), 'nursery', CANOPY.nursery.maxLevel);
    expect(canRaiseCanopy(maxed, 'nursery')).toBe(false);
    expect(raiseCanopy(maxed, 'nursery')).toBe(maxed);
    const poor = fullTree(4);
    expect(canRaiseCanopy(poor, 'rootsBough')).toBe(false);
    expect(canSowInTree(poor)).toBe(false);
    expect(canSowInTree(fullTree(5))).toBe(true);
  });

  it('the boughs strengthen the synergies, the butterfly and the visits', () => {
    const state = withLevel(
      withLevel(withLevel(fullTree(0), 'rootsBough', 10), 'pollinatorsBough', 10),
      'memoryBough',
      10,
    );
    const base = fullTree(0);
    expect(factorOf(state, 'synergyFactor') / factorOf(base, 'synergyFactor')).toBeCloseTo(1.5);
    expect(factorOf(state, 'butterflyInterval') / factorOf(base, 'butterflyInterval')).toBeCloseTo(
      0.7,
    );
    expect(factorOf(state, 'visitInterval') / factorOf(base, 'visitInterval')).toBeCloseTo(0.7);
  });

  it('the nursery keeps more of each building than the Boutures, up to half', () => {
    expect(keptGeneratorShare(fullTree(0))).toBeCloseTo(0.1);
    expect(keptGeneratorShare(withLevel(fullTree(0), 'nursery', 4))).toBeCloseTo(0.5);
  });

  it('is rooted by a Cycle of water: its Seeds are not asked for again', () => {
    const sown = raiseCanopy(fullTree(5), 'rootsBough');
    const ready = { ...sown, allTimeWater: waterForSources(1) };
    const next = startNewCycle(ready);
    expect(next.seeds).toBe(0);
    expect(next.canopy.levels.rootsBough).toBe(1);
    expect(next.rootedSeeds).toBe(seedsSpent(ALL_TALENTS) + 5);
    expect(availableSeeds(next)).toBe(0);
  });

  it('every canopy talent costs Seeds and has at least one level', () => {
    for (const id of CANOPY_IDS) {
      expect(CANOPY[id].maxLevel).toBeGreaterThanOrEqual(1);
      expect(canopyLevelCost(id, 0)).toBeGreaterThan(0);
    }
    const full = Object.fromEntries(CANOPY_IDS.map((id) => [id, CANOPY[id].maxLevel])) as Record<
      CanopyId,
      number
    >;
    // A long-term sink: far more Seeds than the 44 of the talents.
    expect(canopySeedsSpent(full)).toBeGreaterThan(1000);
  });
});

describe('The sower (§7.1, M13)', () => {
  /** A ripe Season whose Seeds would double the `seeds` owned. */
  function ripe(seeds: number, extra: Partial<GameState> = {}): GameState {
    const state = withLevel(fullTree(0, { seeds }), 'sower', 1);
    return {
      ...state,
      talents: ALL_TALENTS,
      rootedSeeds: seedsSpent(ALL_TALENTS) + 15,
      allTimeLight: lightForSeeds(seeds * 2),
      totalLight: lightForSeeds(seeds * 2),
      seasonSeconds: SEED_RIPENING_SECONDS,
      ...extra,
    };
  }

  it('stays off until the player switches it on', () => {
    const state = ripe(50);
    expect(runSower(state)).toBe(state);
  });

  it('relaunches a free Season once the ripe Seeds reach the chosen factor', () => {
    const on = setSowerFactor(ripe(50), 2);
    const next = runSower(on);
    expect(next.seasons).toBe(on.seasons + 1);
    expect(next.seeds).toBe(100);
    expect(next.challenge).toBeNull();
    expect(next.canopy.sowerSeasons).toBe(1);
    expect(next.canopy.sowerFactor).toBe(2);
  });

  it('waits while the factor is not reached or the Seeds are not ripe', () => {
    const higher = setSowerFactor(ripe(50), 3);
    expect(runSower(higher)).toBe(higher);
    const green = setSowerFactor(ripe(50, { seasonSeconds: 60 }), 2);
    expect(runSower(green)).toBe(green);
  });

  it('never interrupts a challenge Season', () => {
    const state = setSowerFactor(ripe(50, { challenge: 'cloudy' }), 1.5);
    expect(runSower(state)).toBe(state);
  });

  it('works from the tick, so offline progress sows too', () => {
    const next = tick(setSowerFactor(ripe(50), 2), 1);
    expect(next.seasons).toBe(11);
    expect(next.seasonSeconds).toBe(0);
  });

  it('refuses factors it does not offer', () => {
    const state = ripe(50);
    expect(setSowerFactor(state, 7)).toBe(state);
  });

  it('earns "Semis spontané" after ten Seasons', () => {
    const state = setSowerFactor(ripe(50), 2);
    const many = { ...state, canopy: { ...state.canopy, sowerSeasons: 9 } };
    expect(runSower(many).achievements).toContain('selfSown');
  });
});

describe('The fountaineers (§7.2, Canopy)', () => {
  function bioregion(light: number, sown: boolean): GameState {
    const state = fullTree(20, {
      resources: { light, water: 0 },
      totalLight: 1e7,
      cooperatives: { ...createInitialState(0).cooperatives, paused: ['gardeners'] },
    });
    return sown ? withLevel(state, 'fountaineers', 1) : state;
  }

  it('build a collector once it costs at most a tenth of the reserve', () => {
    const next = runCooperatives(bioregion(2e7, true));
    expect(next.collectors.roofTanks).toBe(1);
    expect(next.cooperatives.purchases.fountaineers).toBe(1);
  });

  it('leave the reserve alone when a collector would cost more', () => {
    const next = runCooperatives(bioregion(5e6, true));
    expect(next.collectors.roofTanks).toBe(0);
  });

  it('do nothing before they are sown', () => {
    const next = runCooperatives(bioregion(2e7, false));
    expect(next.collectors.roofTanks).toBe(0);
  });
});

describe('Canopy saves (v15)', () => {
  it('round-trips levels and the sower', () => {
    const state = setSowerFactor(withLevel(raiseCanopy(fullTree(30), 'sower'), 'rootsBough', 1), 3);
    const loaded = deserialize(serialize(state), 0)!;
    expect(loaded.canopy).toEqual(state.canopy);
  });

  it('drops canopy levels the Seeds cannot pay for, or without the whole tree', () => {
    const cheat = withLevel(fullTree(0), 'rootsBough', 10);
    expect(deserialize(serialize(cheat), 0)!.canopy.levels.rootsBough).toBe(0);
    const partial = withLevel({ ...fullTree(1000), talents: ALL_TALENTS.slice(1) }, 'sower', 1);
    expect(deserialize(serialize(partial), 0)!.canopy.levels.sower).toBe(0);
  });

  it('a v14 save loads with nothing sown and the sower off', () => {
    const { canopy: _canopy, ...rest } = fullTree(10);
    const loaded = deserialize(JSON.stringify({ ...rest, version: 14 }), 0)!;
    expect(loaded.canopy.levels.rootsBough).toBe(0);
    expect(loaded.canopy.sowerFactor).toBe(0);
  });
});
