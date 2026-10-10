import { achievementBonus } from './achievements';
import { catchButterfly, effectSeconds, harvestAmount } from './butterfly';
import { EFFECTS } from './effects';
import { applyOfflineProgress, MAX_OFFLINE_SECONDS, offlineCap } from './offline';
import { PARCEL_LIST, PARCELS } from './parcels';
import {
  biodiversityBonus,
  clickValue,
  generatorCost,
  generatorMultiplier,
  globalMultiplier,
} from './production';
import { PROJECT_LIST } from './projects';
import {
  canCarryOutProject,
  canRestoreParcel,
  carryOutProject,
  isParcelOffered,
  isProjectUnlocked,
  offeredParcels,
  offeredProjects,
  restoreParcel,
} from './restoration';
import { startNewSeason } from './seasons';
import { createInitialState, type GameState } from './state';

function withState(patch: Partial<GameState>): GameState {
  return { ...createInitialState(0), ...patch };
}

const owned = (patch: Partial<GameState['generators']>) => ({
  ...createInitialState(0).generators,
  ...patch,
});

/** A state with plenty of Light, in phase 3. */
function rich(patch: Partial<GameState> = {}): GameState {
  return withState({ resources: { light: 1e12 }, totalLight: 1e12, allTimeLight: 1e12, ...patch });
}

describe('parcel and project data', () => {
  it('has 8 parcels and 15 projects, cheapest first, with unique ids (§6.1, §6.2)', () => {
    expect(PARCEL_LIST).toHaveLength(8);
    expect(PROJECT_LIST).toHaveLength(15);
    for (const list of [PARCEL_LIST, PROJECT_LIST]) {
      const costs = list.map((item) => item.cost);
      expect(costs).toEqual([...costs].sort((a, b) => a - b));
      expect(new Set(list.map((item) => item.id)).size).toBe(list.length);
    }
  });

  it('only asks projects for parcels that come before them', () => {
    for (const project of PROJECT_LIST) {
      for (const parcel of project.condition.parcels ?? []) {
        expect(PARCELS[parcel].cost).toBeLessThan(project.cost);
      }
    }
  });
});

describe('restoring parcels', () => {
  it('offers a parcel once the Season earned half its cost, in its phase', () => {
    expect(isParcelOffered(withState({ totalLight: 749 }), 'gardenStreet')).toBe(false);
    expect(isParcelOffered(withState({ totalLight: 750 }), 'gardenStreet')).toBe(true);
    // The park is only in view from phase 3 (§6.1).
    expect(isParcelOffered(withState({ totalLight: 9e6 }), 'park')).toBe(false);
    expect(isParcelOffered(withState({ totalLight: 1.5e7 }), 'park')).toBe(true);
  });

  it('restores a parcel for its cost, once', () => {
    const state = withState({ resources: { light: 2_000 }, totalLight: 2_000 });
    expect(canRestoreParcel(state, 'gardenStreet')).toBe(true);
    const next = restoreParcel(state, 'gardenStreet');
    expect(next.resources.light).toBe(500);
    expect(next.parcels).toEqual(['gardenStreet']);
    expect(state.parcels).toEqual([]);
    expect(restoreParcel(next, 'gardenStreet')).toBe(next);
    expect(offeredParcels(next).map((p) => p.id)).not.toContain('gardenStreet');
  });

  it('refuses a parcel the player cannot afford', () => {
    const state = withState({ resources: { light: 1_000 }, totalLight: 1_000 });
    expect(restoreParcel(state, 'gardenStreet')).toBe(state);
  });

  it('keeps restored parcels across Seasons, but not projects', () => {
    const state = rich({ parcels: ['gardenStreet', 'park'], projects: ['seedSwap'] });
    const next = startNewSeason(state);
    expect(next.parcels).toEqual(['gardenStreet', 'park']);
    expect(next.projects).toEqual([]);
  });
});

describe('neighbourhood projects', () => {
  it('unlocks a project from owned generators, phase and parcels', () => {
    expect(isProjectUnlocked(withState({ generators: owned({ pot: 4 }) }), 'seedSwap')).toBe(false);
    expect(isProjectUnlocked(withState({ generators: owned({ pot: 5 }) }), 'seedSwap')).toBe(true);
    expect(isProjectUnlocked(rich({ generators: owned({ verticalFarm: 1 }) }), 'rainwater')).toBe(
      false,
    );
    expect(
      isProjectUnlocked(
        rich({ generators: owned({ verticalFarm: 1 }), parcels: ['river'] }),
        'rainwater',
      ),
    ).toBe(true);
    expect(isProjectUnlocked(rich({ parcels: ['river', 'park'] }), 'assembly')).toBe(false);
    expect(isProjectUnlocked(withState({ totalLight: 1e6 }), 'repairCafe')).toBe(false);
  });

  it('carries out a project for its cost, once per Season', () => {
    const state = withState({ resources: { light: 300 }, generators: owned({ pot: 5 }) });
    expect(canCarryOutProject(state, 'seedSwap')).toBe(true);
    const next = carryOutProject(state, 'seedSwap');
    expect(next.resources.light).toBe(50);
    expect(next.projects).toEqual(['seedSwap']);
    expect(carryOutProject(next, 'seedSwap')).toBe(next);
    expect(offeredProjects(next)).toEqual([]);
  });
});

describe('bonuses of parcels and projects', () => {
  it('Rue jardin doubles the click, Troc de graines adds Light per pot', () => {
    const base = withState({ generators: owned({ pot: 10 }) });
    expect(clickValue(base)).toBe(1);
    expect(clickValue({ ...base, parcels: ['gardenStreet'] })).toBe(2);
    expect(clickValue({ ...base, projects: ['seedSwap'] })).toBeCloseTo(3);
    expect(clickValue({ ...base, parcels: ['gardenStreet'], projects: ['seedSwap'] })).toBeCloseTo(
      6,
    );
  });

  it('multiplies generators and adds per-type bonuses', () => {
    const state = withState({ generators: owned({ pot: 1, balconyPanel: 1, rooftopGarden: 1 }) });
    expect(generatorMultiplier({ ...state, parcels: ['rainGardens'] }, 'pot')).toBe(2);
    expect(generatorMultiplier({ ...state, parcels: ['rainGardens'] }, 'balconyPanel')).toBe(1.5);
    // Batteries partagées: +5% per type owned, three types here.
    expect(
      generatorMultiplier({ ...state, projects: ['sharedBatteries'] }, 'balconyPanel'),
    ).toBeCloseTo(1.15);
  });

  it('adds global bonuses, per restored parcel with the bike lanes', () => {
    const state = withState({ parcels: ['park', 'river'] });
    expect(globalMultiplier(state)).toBeCloseTo(1.1);
    expect(globalMultiplier({ ...state, projects: ['bikeLanes'] })).toBeCloseTo(1.14);
  });

  it('lowers generator costs with the tool library and the repair café', () => {
    const state = withState({ projects: ['toolLibrary', 'repairCafe'] });
    expect(generatorCost(state, 'pot')).toBeCloseTo(15 * 0.9 * 0.9);
  });

  it('extends biodiversity from 5 units and doubles it with living roofs', () => {
    const state = withState({ generators: owned({ pot: 5, balconyPanel: 10 }) });
    expect(biodiversityBonus(state)).toBeCloseTo(0.02);
    expect(biodiversityBonus({ ...state, projects: ['compost'] })).toBeCloseTo(0.06);
    expect(biodiversityBonus({ ...state, parcels: ['livingRoofs'] })).toBeCloseTo(0.04);
  });

  it('raises the bonus of each Milestone with the squares and the tram', () => {
    const state = withState({ achievements: ['light.3', 'pot.1'] });
    expect(achievementBonus(state)).toBeCloseTo(0.02);
    expect(achievementBonus({ ...state, parcels: ['squares'], projects: ['tram'] })).toBeCloseTo(
      0.05,
    );
  });

  it('lengthens butterfly effects, enlarges the harvest and brings butterflies sooner', () => {
    const state = rich({ projects: ['festival', 'market'] });
    expect(effectSeconds(state, 'bloom')).toBe(EFFECTS.bloom.seconds * 1.5);
    expect(harvestAmount(state)).toBe(harvestAmount(rich()) * 2);
    const visible = { ...state, butterfly: { nextIn: 0, visible: 5 } };
    const plain = catchButterfly({ ...visible, projects: [] })!;
    const sooner = catchButterfly({ ...visible, parcels: ['pollinatorStrip'] })!;
    expect(sooner.state.butterfly.nextIn).toBeCloseTo(plain.state.butterfly.nextIn * 0.8);
  });

  it('raises the offline cap by two hours with the river', () => {
    const state = withState({ parcels: ['river'], lastUpdate: 0 });
    expect(offlineCap(state)).toBe(MAX_OFFLINE_SECONDS + 7200);
    expect(applyOfflineProgress(state, 24 * 3600 * 1000).elapsedSeconds).toBe(10 * 3600);
  });
});
