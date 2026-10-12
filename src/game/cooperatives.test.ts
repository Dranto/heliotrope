import {
  COOPERATIVE_GENERATORS,
  isCooperativeActive,
  runCooperatives,
  setThrifty,
  toggleCooperative,
} from './cooperatives';
import { generatorCost } from './production';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';
import type { TalentId } from './talents';
import { withAllIntroduced } from './introductions';

/** A new game whose mechanics are all introduced (§10.8), to test them directly. */
const openGame = (now: number) => withAllIntroduced(createInitialState(now));
function withTalents(talents: TalentId[], extra: Partial<GameState> = {}): GameState {
  return { ...openGame(0), seeds: 20, seasons: 1, talents, ...extra };
}

/** `light` in reserve; only the pots and panels shown, unless `earned` says otherwise. */
function rich(state: GameState, light: number, earned = 150): GameState {
  return { ...state, resources: { light, water: 0 }, totalLight: earned, allTimeLight: earned };
}

describe('Cooperatives (§7.2)', () => {
  it('do nothing until their talent is learnt', () => {
    const state = rich(openGame(0), 1000);
    expect(runCooperatives(state)).toBe(state);
    expect(isCooperativeActive(state, 'gardeners')).toBe(false);
  });

  it('the gardeners buy pots and panels with the Light in reserve', () => {
    const next = runCooperatives(rich(withTalents(['gardenersCoop']), 1000));
    expect(next.generators.pot + next.generators.balconyPanel).toBeGreaterThan(3);
    expect(next.resources.light).toBeLessThan(generatorCost(next, 'balconyPanel'));
    expect(next.cooperatives.purchases.gardeners).toBe(
      next.generators.pot + next.generators.balconyPanel,
    );
    // Only their own buildings.
    expect(next.generators.rooftopGarden).toBe(0);
  });

  it('are not the player: the hidden idle Milestone still counts', () => {
    const state = { ...rich(withTalents(['gardenersCoop']), 1000), idleSeconds: 300 };
    expect(runCooperatives(state).idleSeconds).toBe(300);
  });

  it('only spend a little when a better building is not theirs', () => {
    // A greenhouse pays back far faster than the 60th pot: the player is saving for it.
    const base = withTalents(['gardenersCoop']);
    const generators = { ...base.generators, pot: 60, balconyPanel: 40, greenhouse: 1 };
    const next = runCooperatives(rich({ ...base, generators }, 1e6, 1e6));
    expect(next.resources.light).toBeGreaterThan(0.6e6);
    expect(next.generators.greenhouse).toBe(1);
    // With a tenth of the reserve, nothing they own is affordable at 1 000 Light.
    const poor = rich({ ...base, generators }, 1000, 1e6);
    expect(runCooperatives(poor)).toBe(poor);
  });

  it('keep a reserve when asked: each purchase costs at most a tenth of it', () => {
    const state = setThrifty(rich(withTalents(['gardenersCoop']), 1000), true);
    const next = runCooperatives(state);
    expect(next.resources.light).toBeGreaterThan(500);
    expect(next.generators.pot + next.generators.balconyPanel).toBeGreaterThan(0);
  });

  it('stop while paused, and resume', () => {
    const state = toggleCooperative(rich(withTalents(['gardenersCoop']), 1000), 'gardeners');
    expect(runCooperatives(state).generators.pot).toBe(0);
    const resumed = toggleCooperative(state, 'gardeners');
    expect(runCooperatives(resumed).generators.pot).toBeGreaterThan(0);
  });

  it('the council buys upgrades, and the others save for an upgrade that is near', () => {
    const base = withTalents(['gardenersCoop', 'roofersCoop', 'neighbourhoodCouncil']);
    const state = rich({ ...base, generators: { ...base.generators, pot: 1 } }, 160);
    const next = runCooperatives(state);
    // pot.1 costs 150: bought first rather than spent on pots.
    expect(next.upgrades).toContain('pot.1');
    expect(next.cooperatives.purchases.council).toBeGreaterThanOrEqual(1);
  });

  it('cover every building exactly once', () => {
    const all = Object.values(COOPERATIVE_GENERATORS).flat();
    expect(new Set(all).size).toBe(8);
  });

  it('buy as time passes, in offline-sized steps as in short ticks', () => {
    const base = withTalents(['gardenersCoop']);
    const start = rich({ ...base, generators: { ...base.generators, pot: 5 } }, 20);
    const owned = (s: GameState) => s.generators.pot + s.generators.balconyPanel;
    let minutes = start;
    for (let i = 0; i < 30; i++) minutes = tick(minutes, 60);
    let seconds = start;
    for (let i = 0; i < 1800; i++) seconds = tick(seconds, 1);
    expect(owned(minutes)).toBeGreaterThan(owned(start));
    // Buying sooner compounds a little, but both stay close.
    expect(owned(minutes) / owned(seconds)).toBeGreaterThan(0.8);
  });
});
