import { describe, expect, it } from 'vitest';
import { unlockAchievements } from './achievements';
import { factorOf } from './bonuses';
import { FAMILIES, FAMILY_IDS, familyBonuses, familyOf } from './families';
import { createGreatWorksState, nextStageCost } from './greatWorks';
import { canGreet, GREET_COOLDOWN, greetSpecies, POLLEN_PER_GREETING } from './greetings';
import { choosePath, growthBonuses } from './growth';
import {
  canPlayHand,
  isRequestMet,
  playHand,
  serveRequest,
  validRequests,
  type Request,
} from './requests';
import { deserialize, serialize } from './save';
import { SPECIES_IDS } from './species';
import { createInitialState, type GameState } from './state';
import { withAllIntroduced } from './introductions';
import { generatorMultiplier } from './production';

/** A player in their 2nd Season, with every mechanic introduced. */
function second(extra: Partial<GameState> = {}): GameState {
  return { ...withAllIntroduced(createInitialState(0)), seasons: 1, ...extra };
}

describe('greeting a species on the map (M35)', () => {
  it('fills a step of the pollen gauge, once per passage', () => {
    const state = second({ species: ['bee'], playSeconds: 100 });
    expect(canGreet(state, 'frog')).toBe(false);
    const greeted = greetSpecies(state, 'bee');
    expect(greeted.pollen.gauge - state.pollen.gauge).toBeCloseTo(POLLEN_PER_GREETING);
    expect(greeted.greetings.counts.bee).toBe(1);
    expect(greetSpecies(greeted, 'bee')).toBe(greeted);
    const later = { ...greeted, playSeconds: 100 + GREET_COOLDOWN };
    expect(greetSpecies(later, 'bee').greetings.counts.bee).toBe(2);
    expect(greeted.achievements).toContain('hello');
  });

  it('keeps the greetings in the save', () => {
    const greeted = greetSpecies(second({ species: ['bee'] }), 'bee');
    expect(deserialize(serialize(greeted), 0)!.greetings).toEqual(greeted.greetings);
  });
});

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

  it('make the paths play ×1.75 under their sky with the weather family', () => {
    const base = second({ generators: { ...second().generators, balconyPanel: 100 } });
    const picked = choosePath(base, 'balconyPanel', 1, 0);
    const plain = generatorMultiplier(picked, 'balconyPanel');
    const family = generatorMultiplier(
      { ...picked, species: [...FAMILIES.weather] },
      'balconyPanel',
    );
    // Under the sun: the path ×1.5 plays ×1.75 (M33), then ×1.875 with the family.
    expect(family / plain).toBeCloseTo(1.875 / 1.75);
    expect(growthBonuses(picked, ['balconyPanel'], 1.75)).toHaveLength(1);
  });
});

describe('the neighbours ask for more (M35)', () => {
  const request = (need: Request['need'], hand: Request['hand'] = 'quarter'): Request => ({
    need,
    base: 0,
    hand,
    from: null,
  });

  it('ask to greet a species, and count only what comes after', () => {
    let state = second({ species: ['bee'] });
    state = {
      ...state,
      requests: { ...state.requests, open: [request({ kind: 'greet', species: 'bee', count: 1 })] },
    };
    expect(isRequestMet(state, state.requests.open[0]!)).toBe(false);
    state = greetSpecies(state, 'bee');
    expect(isRequestMet(state, state.requests.open[0]!)).toBe(true);
  });

  it('ask for a jar of honey, given when served', () => {
    let state = second({ orchard: { ...second().orchard, hives: 1, honey: 2 } });
    state = {
      ...state,
      requests: { ...state.requests, open: [request({ kind: 'honey', count: 1 })] },
    };
    const served = serveRequest(state, 0);
    expect(served.orchard.honey).toBe(1);
    expect(served.requests.hands).toEqual(['quarter']);
  });

  it('send two hands from a district whose bond is full', () => {
    let state = second();
    state = {
      ...state,
      districts: ['tanneries'],
      requests: {
        ...state.requests,
        bonds: { tanneries: 10 },
        open: [{ ...request({ kind: 'harvests', count: 0 + 1 }), from: 'tanneries' }],
      },
      garden: { ...state.garden, harvests: 1 },
    };
    expect(serveRequest(state, 0).requests.hands).toEqual(['quarter', 'quarter']);
  });

  it('offer a quarter of a great work stage', () => {
    const fresh = second({ seasons: 6, cycles: 1 });
    const state: GameState = {
      ...fresh,
      greatWorks: createGreatWorksState(),
      requests: { ...fresh.requests, hands: ['works'] },
    };
    expect(canPlayHand(state, 0)).toBe(true);
    const after = playHand(state, 0);
    const cost = nextStageCost(state, 'tram')!;
    expect(after.greatWorks.works.tram.paid.light).toBeCloseTo(cost.light / 4);
    expect(after.requests.hands).toEqual([]);
  });

  it('offer one more swap of the forecast', () => {
    const fresh = second();
    const state: GameState = {
      ...fresh,
      weather: { ...fresh.weather, swapped: 1, forecast: ['wind', 'mist', 'heat'] },
      requests: { ...fresh.requests, hands: ['sky'] },
    };
    expect(canPlayHand(state, 0)).toBe(true);
    const after = playHand(state, 0);
    expect(after.weather.swapped).not.toBe(1);
    expect(canPlayHand({ ...state, weather: { ...state.weather, swapped: 0 } }, 0)).toBe(false);
  });

  it('keep the new needs in the save', () => {
    const open = [
      request({ kind: 'greet', species: 'bee', count: 1 }),
      request({ kind: 'honey', count: 1 }, 'sky'),
      request({ kind: 'paths', count: 1 }, 'works'),
    ];
    const fresh = second();
    expect(validRequests({ ...fresh.requests, open }, fresh.requests).open).toEqual(open);
  });
});
