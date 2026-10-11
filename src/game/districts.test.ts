import { achievementBonus, unlockAchievements } from './achievements';
import { startNewCycle } from './cycles';
import {
  areDistrictsOpen,
  canRestoreDistrict,
  DISTRICT_IDS,
  DISTRICT_LIST,
  DISTRICTS,
  nextDistrict,
  offeredDistrict,
  restoreDistrict,
} from './districts';
import { generatorCost, generatorMultiplier } from './production';
import { PARCEL_IDS } from './parcels';
import { startNewSeason } from './seasons';
import { createInitialState, type GameState } from './state';
import { cuttingsUnits } from './visits';

/** A neighbourhood fully restored, with `light` in reserve and earned this Season. */
function restored(light: number, patch: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(0),
    parcels: [...PARCEL_IDS],
    resources: { light, water: 0 },
    totalLight: light,
    allTimeLight: light,
    ...patch,
  };
}

describe('neighbouring districts (§6.4)', () => {
  it('has eight districts with growing costs', () => {
    expect(DISTRICT_LIST.map((d) => d.id)).toEqual([...DISTRICT_IDS]);
    for (let i = 1; i < DISTRICT_LIST.length; i += 1) {
      expect(DISTRICT_LIST[i]!.cost).toBeGreaterThan(DISTRICT_LIST[i - 1]!.cost);
    }
  });

  it('opens once every parcel is restored', () => {
    const almost = restored(1e12, { parcels: PARCEL_IDS.slice(1) });
    expect(areDistrictsOpen(almost)).toBe(false);
    expect(offeredDistrict(almost)).toBeNull();
    expect(areDistrictsOpen(restored(0))).toBe(true);
  });

  it('offers the next district once the Season earned half its cost', () => {
    const first = DISTRICTS.tanneries.cost;
    expect(offeredDistrict(restored(first / 2 - 1))).toBeNull();
    expect(offeredDistrict(restored(first / 2))?.id).toBe('tanneries');
    expect(canRestoreDistrict(restored(first / 2), 'tanneries')).toBe(false);
    expect(canRestoreDistrict(restored(first), 'tanneries')).toBe(true);
    // Only in order: the second waits for the first.
    expect(canRestoreDistrict(restored(1e16), 'railyard')).toBe(false);
  });

  it('restores a district for Light, for good, through Seasons and Cycles', () => {
    let state = restoreDistrict(restored(DISTRICTS.tanneries.cost + 5), 'tanneries');
    expect(state.districts).toEqual(['tanneries']);
    expect(state.resources.light).toBe(5);
    expect(nextDistrict(state)?.id).toBe('railyard');
    // Restoring twice or out of order changes nothing.
    expect(restoreDistrict(state, 'tanneries')).toBe(state);
    expect(restoreDistrict(state, 'mall')).toBe(state);

    state = startNewSeason({ ...state, totalLight: 1e12, allTimeLight: 1e12 });
    expect(state.districts).toEqual(['tanneries']);
    state = startNewCycle({ ...state, allTimeWater: 1e8 });
    expect(state.districts).toEqual(['tanneries']);
  });

  it('brings its rules through the shared bonus shape', () => {
    const base = restored(0);
    const railyard = { ...base, districts: ['tanneries', 'railyard'] as GameState['districts'] };
    expect(generatorMultiplier(railyard, 'urbanCanopy')).toBe(
      generatorMultiplier(base, 'urbanCanopy') * 2,
    );
    const mall = {
      ...railyard,
      districts: [...railyard.districts, 'mall'] as GameState['districts'],
    };
    expect(cuttingsUnits(mall)).toBe(cuttingsUnits(base) + 1);
    const workshops = { ...base, districts: ['industrialZone'] as GameState['districts'] };
    expect(generatorCost(workshops, 'pot')).toBeCloseTo(generatorCost(base, 'pot') * 0.9);
    const towers = {
      ...base,
      achievements: ['light.3', 'light.6'] as GameState['achievements'],
      districts: ['chimneys'] as GameState['districts'],
    };
    expect(achievementBonus(towers)).toBeGreaterThan(
      achievementBonus({ ...towers, districts: [] }),
    );
  });

  it('unlocks its Milestone', () => {
    const state = restoreDistrict(restored(DISTRICTS.tanneries.cost), 'tanneries');
    expect(unlockAchievements(state).achievements).toContain('districts.1');
  });
});
