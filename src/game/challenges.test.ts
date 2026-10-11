import { CHALLENGES, completeChallenge, generatorLimit, offeredChallenges } from './challenges';
import { runCooperatives } from './cooperatives';
import { availableUpgrades, globalMultiplier, maxAffordable } from './production';
import { SEED_RIPENING_SECONDS, startNewSeason } from './seasons';
import { createInitialState, type GameState } from './state';
import { buyGenerator, canBuyGenerator, tick } from './tick';

function state(patch: Partial<GameState> = {}): GameState {
  return { ...createInitialState(0), ...patch };
}

/** A game ready for its third Season, rich enough to buy anything. */
const veteran = () =>
  state({ allTimeLight: 1e12, seasons: 2, seeds: 10, seasonSeconds: SEED_RIPENING_SECONDS });

describe('challenge Seasons (§7.3)', () => {
  it('are offered from the second Season, until each one is won', () => {
    expect(offeredChallenges(state({ allTimeLight: 1e12 }))).toEqual([]);
    expect(offeredChallenges(veteran()).map((c) => c.id)).toEqual([
      'cloudy',
      'wild',
      'frugal',
      'hands',
    ]);
    expect(offeredChallenges({ ...veteran(), challenges: ['wild'] }).map((c) => c.id)).toEqual([
      'cloudy',
      'frugal',
      'hands',
    ]);
  });

  it('starts a new Season with the chosen challenge, never one not offered', () => {
    expect(startNewSeason(veteran(), 'cloudy').challenge).toBe('cloudy');
    expect(startNewSeason(veteran()).challenge).toBeNull();
    const won = { ...veteran(), challenges: ['cloudy' as const] };
    expect(startNewSeason(won, 'cloudy')).toBe(won);
  });

  it('blocks panels and mirror plants in the Season of clouds', () => {
    const s = { ...startNewSeason(veteran(), 'cloudy'), resources: { water: 0, light: 1e9 } };
    expect(generatorLimit(s, 'balconyPanel')).toBe(0);
    expect(canBuyGenerator(s, 'balconyPanel')).toBe(false);
    expect(buyGenerator(s, 'mirrorPlant')).toBe(s);
    expect(canBuyGenerator(s, 'pot')).toBe(true);
  });

  it('caps every building at 25 in the frugal Season, cooperatives included', () => {
    const base = startNewSeason(veteran(), 'frugal');
    const s = {
      ...base,
      resources: { water: 0, light: 1e12 },
      generators: { ...base.generators, pot: 20 },
      talents: ['gardenersCoop' as const],
    };
    expect(maxAffordable(s, 'pot')).toBe(5);
    expect(canBuyGenerator(s, 'pot', 6)).toBe(false);
    expect(runCooperatives(s).generators.pot).toBe(25);
  });

  it('offers no upgrade in the wild Season', () => {
    const base = state({ totalLight: 1e9, resources: { water: 0, light: 1e9 } });
    expect(availableUpgrades(base).length).toBeGreaterThan(0);
    expect(availableUpgrades({ ...base, challenge: 'wild' })).toEqual([]);
  });

  it('divides production by 10 in the Season of hands', () => {
    const base = state();
    expect(globalMultiplier({ ...base, challenge: 'hands' })).toBeCloseTo(
      globalMultiplier(base) / 10,
    );
  });

  it('is won when its goal is reached: the constraint lifts and the reward stays', () => {
    const s = state({ challenge: 'cloudy', totalLight: CHALLENGES.cloudy.goal - 1 });
    expect(completeChallenge(s)).toBe(s);
    const won = tick({ ...s, totalLight: CHALLENGES.cloudy.goal }, 0.1);
    expect(won.challenge).toBeNull();
    expect(won.challenges).toEqual(['cloudy']);
    expect(won.species).toContain('kingfisher');
    expect(generatorLimit(won, 'balconyPanel')).toBe(Infinity);
  });

  it('keeps kept buildings within the challenge limits', () => {
    const base = veteran();
    const s = {
      ...base,
      talents: ['cuttings' as const],
      generators: { ...base.generators, pot: 200, balconyPanel: 200 },
    };
    const next = startNewSeason(s, 'cloudy');
    expect(next.generators.pot).toBeGreaterThan(0);
    expect(next.generators.balconyPanel).toBe(0);
  });
});
