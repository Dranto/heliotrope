import { globalMultiplier, clickValue } from './production';
import { startNewSeason } from './seasons';
import { createInitialState, type GameState } from './state';
import {
  availableSeeds,
  canLearnTalent,
  isTalentReachable,
  learnTalent,
  seedsSpent,
  TALENT_BRANCHES,
  TALENT_LIST,
  TALENTS,
} from './talents';
import { offlineCap } from './offline';
import { effectSeconds } from './butterfly';

function withSeeds(seeds: number, extra: Partial<GameState> = {}): GameState {
  return { ...createInitialState(0), seeds, seasons: 1, ...extra };
}

describe('Tree of Seasons (§7.1)', () => {
  it('has three branches, each rooted in one talent, with parents learnt first', () => {
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
    const base = withSeeds(10, { allTimeLight: 9e9 });
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
});
