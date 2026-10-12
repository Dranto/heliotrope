import { harvestAmount } from './butterfly';
import { generatorCost, generatorMultiplier, clickValue, fleaMarketGenerator } from './production';
import { deserialize, serialize } from './save';
import { CITY_SPECIES, isHerbierComplete, SPECIES_IDS, unlockSpecies } from './species';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';
import {
  CITY_VISITS,
  cityVisits,
  isVisitUnlocked,
  unlockedVisits,
  welcomeVisit,
  type VisitKind,
} from './visits';
import { withAllIntroduced } from './introductions';

/** A new game whose mechanics are all introduced (§10.8), to test them directly. */
const openGame = (now: number) => withAllIntroduced(createInitialState(now));
function withState(patch: Partial<GameState>): GameState {
  return { ...openGame(0), ...patch };
}

const owned = { ...openGame(0).generators, pot: 10, balconyPanel: 5, greenhouse: 3 };

/** A state with `kind` on the map. */
function visiting(kind: VisitKind, patch: Partial<GameState> = {}): GameState {
  return withState({ generators: owned, visit: { nextIn: 0, kind, visible: 10 }, ...patch });
}

describe('The visits of the city (§9.6, M18)', () => {
  it('come with the meadows and the neighbouring districts they belong to', () => {
    const base = withState({});
    for (const kind of CITY_VISITS) expect(isVisitUnlocked(base, kind)).toBe(false);
    const city = withState({
      sites: { ...base.sites, meadows: 1 },
      districts: [
        'tanneries',
        'railyard',
        'mall',
        'parkAndRide',
        'interchange',
        'offices',
        'industrialZone',
      ],
    });
    expect(unlockedVisits(city)).toEqual(['sheep', 'festival', 'fireflies', 'fleaMarket']);
  });

  it('the transhumance triples the balcony panels for a while', () => {
    const before = visiting('sheep');
    const after = welcomeVisit(before)!.state;
    const without = { ...after, effects: [] };
    expect(
      generatorMultiplier(after, 'balconyPanel') / generatorMultiplier(without, 'balconyPanel'),
    ).toBeCloseTo(3);
    expect(generatorMultiplier(after, 'pot')).toBeCloseTo(generatorMultiplier(without, 'pot'));
    expect(tick(after, 61).effects.some((e) => e.kind === 'grazing')).toBe(false);
  });

  it('the festival doubles the Harvest, the fireflies triple the click', () => {
    const rich = { resources: { light: 1e9, water: 0 } };
    const festival = visiting('festival', rich);
    // Compared with the same state without the effect: welcoming may also unlock Milestones.
    const feast = welcomeVisit(festival)!.state;
    expect(harvestAmount(feast) / harvestAmount({ ...feast, effects: [] })).toBeCloseTo(2);
    const fireflies = welcomeVisit(visiting('fireflies'))!.state;
    expect(clickValue(fireflies) / clickValue({ ...fireflies, effects: [] })).toBeCloseTo(3);
  });

  it('the flea market halves the price of the most expensive building owned', () => {
    const before = visiting('fleaMarket');
    const after = welcomeVisit(before)!.state;
    expect(fleaMarketGenerator(after)).toBe('greenhouse');
    expect(generatorCost(after, 'greenhouse') / generatorCost(before, 'greenhouse')).toBeCloseTo(
      0.5,
    );
    expect(generatorCost(after, 'pot')).toBe(generatorCost(before, 'pot'));
  });

  it('bring their species after five welcomes, beyond the Herbier of the neighbourhood', () => {
    const visits = {
      ...openGame(0).visits,
      sheep: 5,
      festival: 4,
      fireflies: 5,
      fleaMarket: 5,
    };
    expect(unlockSpecies(withState({ visits })).species).toEqual([
      'skylark',
      'dragonfly',
      'redstart',
    ]);
    const neighbourhood = SPECIES_IDS.filter(
      (id) => !CITY_SPECIES.includes(id) && !['otter', 'salmon', 'blackStork'].includes(id),
    );
    expect(isHerbierComplete({ species: neighbourhood })).toBe(true);
  });

  it('unlock their Milestones, count in the save, and migrate from v19', () => {
    const visits = {
      ...openGame(0).visits,
      sheep: 9,
      festival: 6,
      fireflies: 5,
      fleaMarket: 4,
    };
    const state = welcomeVisit(visiting('sheep', { visits }))!.state;
    expect(cityVisits(state)).toBe(25);
    expect(state.achievements).toEqual(expect.arrayContaining(['cityFestival', 'cityVisits.25']));
    expect(deserialize(serialize(state), 0)!.visits).toEqual(state.visits);
    const raw = JSON.parse(serialize(withState({})));
    raw.version = 19;
    delete raw.visits.sheep;
    expect(deserialize(JSON.stringify(raw), 0)!.visits.sheep).toBe(0);
  });
});
