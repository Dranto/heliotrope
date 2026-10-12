import { describe, expect, it } from 'vitest';
import {
  allianceSlots,
  areAlliancesOpen,
  canTakeOut,
  chooseAlliance,
  isAwake,
  MAX_SLOTS,
  takeOutAlliance,
  windBikesRiding,
  workingAlliances,
} from './alliances';
import { factorOf, globalBonus } from './bonuses';
import { harvest } from './garden';
import { choosePath } from './growth';
import { handLimit, MAX_HANDS } from './requests';
import { runCooperatives } from './cooperatives';
import { unlockAchievements } from './achievements';
import { createInitialState, type GameState } from './state';
import { withAllIntroduced } from './introductions';
import { UPGRADES } from './upgrades';

/** A player in their 2nd Season, before the Bioregion. */
function second(extra: Partial<GameState> = {}): GameState {
  return { ...withAllIntroduced(createInitialState(0)), seasons: 1, ...extra };
}

/** Six paths working and four parcels restored: "Les formes du quartier" wakes. */
function shaped(): GameState {
  let state = second({
    parcels: ['gardenStreet', 'rainGardens', 'pollinatorStrip', 'river'],
  });
  state = {
    ...state,
    generators: { ...state.generators, pot: 100, balconyPanel: 100, rooftopGarden: 100 },
  };
  for (const id of ['pot', 'balconyPanel', 'rooftopGarden'] as const) {
    state = choosePath(choosePath(state, id, 0, 0), id, 1, 0);
  }
  return state;
}

describe('the alliances of the middle of the game (M34)', () => {
  it('open from the 2nd Season with two slots, three with the Bioregion, eight at most', () => {
    const state = shaped();
    expect(isAwake(state, 'neighbourhoodForms')).toBe(true);
    expect(areAlliancesOpen(state)).toBe(true);
    expect(allianceSlots(state)).toBe(2);
    expect(allianceSlots({ ...state, seasons: 0 })).toBe(0);
    expect(allianceSlots({ ...state, seasons: 3 })).toBe(3);
    const crowded = {
      ...state,
      seasons: 3,
      city: { ...state.city, founded: ['coast', 'forest', 'marsh', 'x', 'y', 'z'] },
    } as unknown as GameState;
    expect(allianceSlots(crowded)).toBe(MAX_SLOTS);
  });

  it('let one be taken out once per Season before the first Cycle', () => {
    let state = chooseAlliance(chooseAlliance(shaped(), 'neighbourhoodForms'), 'hivePollen');
    state = takeOutAlliance(state, 'hivePollen');
    expect(state.alliances.chosen).toEqual(['neighbourhoodForms']);
    expect(canTakeOut(state, 'neighbourhoodForms')).toBe(false);
    expect(canTakeOut({ ...state, seasons: 2 }, 'neighbourhoodForms')).toBe(true);
  });

  it('give +1% of production per working path with the forms of the neighbourhood', () => {
    const state = shaped();
    const chosen = chooseAlliance(state, 'neighbourhoodForms');
    expect(globalBonus(chosen) - globalBonus(state)).toBeCloseTo(0.06);
  });

  it('fill the pollen gauge faster with the hives', () => {
    const state = second({
      orchard: { ...second().orchard, hives: 1 },
      pollen: { ...second().pollen, flights: 50 },
    });
    const chosen = chooseAlliance(state, 'hivePollen');
    expect(workingAlliances(chosen)).toEqual(['hivePollen']);
    expect(factorOf(chosen, 'pollenFill') / factorOf(state, 'pollenFill')).toBeCloseTo(1.25);
  });

  it('give one more basket per harvest with the gardens in the rain', () => {
    const fresh = second();
    const state: GameState = {
      ...fresh,
      visits: { ...fresh.visits, shower: 10 },
      garden: {
        ...fresh.garden,
        varieties: ['flameRadish', 'blackRadish', 'purpleBean'],
        plots: [{ crop: 'radish', grown: 1e6 }, ...fresh.garden.plots.slice(1)],
      },
    };
    const plain = harvest(state, 0)!.state.garden.baskets;
    const chosen = chooseAlliance(state, 'showerGardens');
    expect(harvest(chosen, 0)!.state.garden.baskets).toBe(plain + 1);
  });

  it('keep one more helping hand with mutual aid', () => {
    const fresh = second();
    const state: GameState = {
      ...fresh,
      requests: { ...fresh.requests, served: 10, bonds: { tanneries: 2 } },
    };
    expect(handLimit(state)).toBe(MAX_HANDS);
    expect(handLimit(chooseAlliance(state, 'mutualAid'))).toBe(MAX_HANDS + 1);
  });

  it('make the cooperatives buy synergies in the wind with the bikes', () => {
    const fresh = second();
    let state: GameState = {
      ...fresh,
      talents: ['gardenersCoop', 'roofersCoop', 'farmersCoop'],
      weather: {
        ...fresh.weather,
        current: 'wind',
        seen: ['sun', 'shower', 'wind', 'mist', 'heat'],
      },
    };
    expect(isAwake(state, 'windBikes')).toBe(true);
    state = chooseAlliance(state, 'windBikes');
    expect(windBikesRiding(state)).toBe(true);
    // The pots and panels' synergy is unlocked, and just affordable.
    const ready: GameState = {
      ...state,
      resources: { ...state.resources, light: UPGRADES.sunnyPots.cost },
      generators: { ...state.generators, pot: 200, balconyPanel: 200 },
    };
    expect(runCooperatives(ready).upgrades).toContain('sunnyPots');
    const sunny = { ...ready, weather: { ...ready.weather, current: 'sun' as const } };
    expect(windBikesRiding(sunny)).toBe(false);
    expect(runCooperatives(sunny).upgrades).not.toContain('sunnyPots');
  });

  it('give a Milestone for five alliances at work', () => {
    let state: GameState = {
      ...shaped(),
      seasons: 3,
      orchard: { ...shaped().orchard, hives: 1 },
      pollen: { ...shaped().pollen, flights: 50 },
      requests: { ...shaped().requests, served: 10, bonds: { tanneries: 1 } },
      visits: { ...shaped().visits, birds: 10 },
      generators: { ...shaped().generators, urbanCanopy: 10 },
      city: { ...shaped().city, founded: ['coast'] },
      alliances: { ...shaped().alliances, bloomed: true },
    };
    for (const id of ['neighbourhoodForms', 'hivePollen', 'mutualAid', 'canopyFlocks'] as const) {
      state = chooseAlliance(state, id);
    }
    expect(workingAlliances(state)).toHaveLength(4);
    expect(unlockAchievements(state).achievements).not.toContain('livingWeb');
    state = chooseAlliance({ ...state, species: ['bee', 'bumblebee', 'ladybird'] }, 'orchardBees');
    expect(workingAlliances(state)).toHaveLength(5);
    expect(unlockAchievements(state).achievements).toContain('livingWeb');
  });
});
