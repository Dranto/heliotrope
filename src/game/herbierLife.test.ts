import { describe, expect, it } from 'vitest';
import { unlockAchievements } from './achievements';
import { factorOf } from './bonuses';
import { FAMILIES, FAMILY_IDS, familyBonuses, familyOf } from './families';
import { SPECIES_IDS } from './species';
import { createInitialState, type GameState } from './state';
import { withAllIntroduced } from './introductions';

/** A player in their 2nd Season, with every mechanic introduced. */
function second(extra: Partial<GameState> = {}): GameState {
  return { ...withAllIntroduced(createInitialState(0)), seasons: 1, ...extra };
}

describe('the families of the Herbier (M35)', () => {
  it('put each species in one family at most', () => {
    for (const id of SPECIES_IDS) {
      expect(FAMILY_IDS.filter((f) => FAMILIES[f].includes(id)).length).toBeLessThanOrEqual(1);
    }
    expect(familyOf('bee')).toBe('pollinators');
    expect(familyOf('poppy')).toBeNull();
  });

  it('give their bonus once complete', () => {
    const almost = second({ species: ['bee', 'bumblebee', 'brimstone'] });
    const complete = second({ species: [...FAMILIES.pollinators] });
    expect(familyBonuses(almost.species)).toEqual([]);
    expect(factorOf(complete, 'pollenFill') / factorOf(almost, 'pollenFill')).toBeCloseTo(1.15);
    expect(unlockAchievements(complete).achievements).not.toContain('wholeFamily');
    const two = second({ species: [...FAMILIES.pollinators, ...FAMILIES.night] });
    expect(unlockAchievements(two).achievements).toContain('wholeFamily');
  });

  it('give biodiversity ×1.1 with the weather family (slimming plan, lot 2)', () => {
    const base = second();
    const family: GameState = { ...base, species: [...FAMILIES.weather] };
    expect(factorOf(family, 'biodiversityFactor')).toBeCloseTo(
      1.1 * factorOf(base, 'biodiversityFactor'),
    );
  });
});
