import { factorOf } from './bonuses';
import { globalMultiplier, clickValue, generatorCost } from './production';
import { districtCost } from './districts';
import { parcelCost, projectCost } from './restoration';
import { deserialize, serialize } from './save';
import { SEED_RIPENING_SECONDS, seasonRipeningSeconds, startNewSeason } from './seasons';
import { createInitialState, type GameState } from './state';
import {
  availableSeeds,
  canLearnTalent,
  canSwapTalent,
  FORK_IDS,
  FORKS,
  isCanopyOpen,
  isTalentExcluded,
  isTalentReachable,
  learnTalent,
  seedsSpent,
  swapTalent,
  TALENT_BRANCHES,
  TALENT_LIST,
  TALENTS,
  TREE_SIZE,
} from './talents';
import { offlineCap } from './offline';
import { effectSeconds } from './butterfly';

function withSeeds(seeds: number, extra: Partial<GameState> = {}): GameState {
  return { ...createInitialState(0), seeds, seasons: 1, ...extra };
}

describe('Tree of Seasons (§7.1)', () => {
  it('has four branches, each rooted in one talent, with parents learnt first', () => {
    for (const branch of TALENT_BRANCHES) {
      const talents = TALENT_LIST.filter((t) => t.branch === branch);
      expect(talents.filter((t) => t.parent === undefined)).toHaveLength(1);
      for (const t of talents) {
        if (t.parent) {
          expect(TALENTS[t.parent].branch).toBe(branch);
          expect(TALENT_LIST.indexOf(TALENTS[t.parent])).toBeLessThan(TALENT_LIST.indexOf(t));
        }
      }
    }
  });

  it('spends Seeds without lowering their production bonus', () => {
    const before = withSeeds(10);
    const after = learnTalent(before, 'gardenersCoop');
    expect(after.talents).toEqual(['gardenersCoop']);
    expect(after.seeds).toBe(10);
    expect(availableSeeds(after)).toBe(9);
    expect(seedsSpent(after.talents)).toBe(1);
    expect(globalMultiplier(after)).toBe(globalMultiplier(before));
  });

  it('needs the parent talent and enough Seeds left', () => {
    const state = withSeeds(2);
    expect(isTalentReachable(state, 'roofersCoop')).toBe(false);
    expect(learnTalent(state, 'roofersCoop')).toBe(state);
    const rooted = learnTalent(state, 'gardenersCoop');
    expect(isTalentReachable(rooted, 'roofersCoop')).toBe(true);
    // 1 Seed left, the roofers cost 2.
    expect(canLearnTalent(rooted, 'roofersCoop')).toBe(false);
    expect(learnTalent(rooted, 'gardenersCoop')).toBe(rooted);
  });

  it('is out of reach in the first Season, which has no Seed to spend (D3)', () => {
    const state = createInitialState(0);
    expect(TALENT_LIST.some((t) => canLearnTalent(state, t.id))).toBe(false);
  });

  it('keeps talents and cooperative settings across Seasons', () => {
    const state = learnTalent(withSeeds(5, { allTimeLight: 2e9 }), 'gardenersCoop');
    const paused = {
      ...state,
      cooperatives: { ...state.cooperatives, paused: ['gardeners' as const] },
    };
    const next = startNewSeason(paused);
    expect(next.talents).toEqual(['gardenersCoop']);
    expect(next.cooperatives.paused).toEqual(['gardeners']);
    expect(availableSeeds(next)).toBe(next.seeds - 1);
  });

  it('Boutures keeps a tenth of each building for the next Season', () => {
    const base = withSeeds(10, { allTimeLight: 9e9, seasonSeconds: SEED_RIPENING_SECONDS });
    const state = {
      ...learnTalent(learnTalent(base, 'mycorrhiza'), 'cuttings'),
      generators: { ...base.generators, pot: 75, balconyPanel: 9, arcology: 12 },
    };
    const next = startNewSeason(state);
    expect(next.generators.pot).toBe(7);
    expect(next.generators.balconyPanel).toBe(0);
    expect(next.generators.arcology).toBe(1);
    expect(startNewSeason({ ...state, talents: [] }).generators.pot).toBe(0);
  });

  it('Sol vivant grows with every Season completed', () => {
    const base = learnTalent(
      learnTalent(learnTalent(withSeeds(10), 'mycorrhiza'), 'cuttings'),
      'livingSoil',
    );
    const one = globalMultiplier({ ...base, seasons: 1 });
    const three = globalMultiplier({ ...base, seasons: 3 });
    expect(three / one).toBeCloseTo(1.15 / 1.05);
  });

  it('Forêt-mère grows with every building type owned', () => {
    const base = withSeeds(10, { talents: ['mycorrhiza', 'earlyDiversity', 'motherForest'] });
    const none = globalMultiplier(base);
    const two = globalMultiplier({
      ...base,
      generators: { ...base.generators, pot: 1, balconyPanel: 1 },
    });
    expect(two / none).toBeCloseTo(1.06);
  });

  it('pollinator and memory talents reach the click, the butterfly and offline play', () => {
    const base = withSeeds(20);
    const clicked = learnTalent(base, 'nectarFlowers');
    expect(clickValue(clicked)).toBe(2 * clickValue(base));
    const bloom = withSeeds(20, { talents: ['nectarFlowers', 'hedgerows', 'longBloom'] });
    expect(effectSeconds(bloom, 'bloom')).toBe(1.5 * effectSeconds(base, 'bloom'));
    const watched = withSeeds(20, { talents: ['gardenersCoop', 'nightWatch', 'longMemory'] });
    expect(offlineCap(watched)).toBe(24 * 3600);
  });

  it('the Quartier lowers the prices of the neighbourhood and brings the visitors back sooner', () => {
    const base = withSeeds(20);
    const quarter = withSeeds(20, {
      talents: ['tramMarket', 'commonWorks', 'deepRoots', 'landTrust', 'openStreets'],
    });
    expect(clickValue(learnTalent(base, 'tramMarket'))).toBe(2 * clickValue(base));
    expect(projectCost(quarter, 'seedSwap')).toBeCloseTo(0.75 * projectCost(base, 'seedSwap'));
    expect(parcelCost(quarter, 'gardenStreet')).toBeCloseTo(
      0.75 * parcelCost(base, 'gardenStreet'),
    );
    expect(districtCost(quarter, 'tanneries')).toBeCloseTo(0.75 * districtCost(base, 'tanneries'));
    expect(generatorCost(quarter, 'pot')).toBeLessThan(generatorCost(base, 'pot'));
    expect(factorOf(quarter, 'visitInterval')).toBeCloseTo(0.75 * factorOf(base, 'visitInterval'));
  });
});

describe('forks of the Tree of Seasons (§7.1, slimming plan lot 8)', () => {
  it('pairs two talents with the same parent and cost', () => {
    for (const fork of FORK_IDS) {
      const [a, b] = FORKS[fork].map((id) => TALENTS[id]);
      expect(a!.parent).toBe(b!.parent);
      expect(a!.cost).toBe(b!.cost);
      expect(a!.branch).toBe(b!.branch);
    }
    expect(TREE_SIZE).toBe(TALENT_LIST.length - 3);
  });

  it('learning one talent of a fork shuts its twin, and both lead on', () => {
    const rooted = learnTalent(withSeeds(20), 'mycorrhiza');
    const deep = learnTalent(rooted, 'deepSoil');
    expect(isTalentExcluded(deep, 'cuttings')).toBe(true);
    expect(canLearnTalent(deep, 'cuttings')).toBe(false);
    expect(learnTalent(deep, 'cuttings')).toBe(deep);
    expect(canLearnTalent(deep, 'livingSoil')).toBe(true);
    expect(seasonRipeningSeconds(rooted) - seasonRipeningSeconds(deep)).toBe(120);
  });

  it('swaps a fork once per Cycle of water, for the same Seeds', () => {
    const state = withSeeds(20, { talents: ['mycorrhiza', 'cuttings', 'livingSoil'] });
    expect(canSwapTalent(state, 'cuttings')).toBe(false);
    const swapped = swapTalent(state, 'deepSoil');
    expect(swapped.talents).toEqual(['mycorrhiza', 'deepSoil', 'livingSoil']);
    expect(availableSeeds(swapped)).toBe(availableSeeds(state));
    expect(canSwapTalent(swapped, 'cuttings')).toBe(false);
    expect(swapTalent(swapped, 'cuttings')).toBe(swapped);
    // Another fork has its own choice; the next Cycle opens this one again.
    expect(canSwapTalent(learnTalent(swapped, 'nectarFlowers'), 'cuttings')).toBe(false);
    expect(canSwapTalent({ ...swapped, cycles: 1 }, 'cuttings')).toBe(true);
  });

  it('opens the Canopy with one talent per fork', () => {
    const tree = TALENT_LIST.map((t) => t.id).filter(
      (id) => !FORK_IDS.some((fork) => FORKS[fork][0] === id),
    );
    expect(tree).toHaveLength(TREE_SIZE);
    expect(isCanopyOpen({ talents: tree })).toBe(true);
    expect(isCanopyOpen({ talents: tree.slice(1) })).toBe(false);
  });

  it('a save keeps the swaps and never both twins', () => {
    const state = swapTalent(
      withSeeds(20, { talents: ['gardenersCoop', 'nightWatch'], cycles: 2 }),
      'springWatch',
    );
    const loaded = deserialize(serialize(state), 0)!;
    expect(loaded.talents).toEqual(['gardenersCoop', 'springWatch']);
    expect(loaded.talentSwaps).toEqual({ watch: 2 });
    const cheat = deserialize(
      serialize({ ...state, talents: [...state.talents, 'nightWatch'] }),
      0,
    )!;
    expect(cheat.talents).toEqual(['gardenersCoop', 'springWatch']);
  });
});
