import { describe, expect, it } from 'vitest';
import {
  ALLIANCE_IDS,
  allianceBonuses,
  allianceSlots,
  areAlliancesOpen,
  canTakeOut,
  checkBloom,
  chooseAlliance,
  isAwake,
  takeOutAlliance,
  validAlliances,
  workingAlliances,
} from './alliances';
import { costFactor, globalBonus } from './bonuses';
import { SITE_IDS } from './bioregion';
import { stageCount, WORK_IDS } from './greatWorks';
import { deserialize, serialize } from './save';
import { SPECIES_IDS } from './species';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';
import { withAllIntroduced } from './introductions';

/** A new game whose mechanics are all introduced (§10.8), to test them directly. */
const openGame = (now: number) => withAllIntroduced(createInitialState(now));
/** A player whose orchard bees and deep roots are awake. */
function grown(extra: Partial<GameState> = {}): GameState {
  const fresh = openGame(0);
  return {
    ...fresh,
    orchard: { ...fresh.orchard, hives: 1 },
    species: ['bee', 'bumblebee', 'ladybird'],
    canopy: { ...fresh.canopy, levels: { ...fresh.canopy.levels, sower: 10 } },
    delta: { ...fresh.delta, widths: { ...fresh.delta.widths, seedArm: 1 } },
    ...extra,
  };
}

/** Every great work complete. */
function allWorks(state: GameState): GameState['greatWorks'] {
  return {
    ...state.greatWorks,
    works: Object.fromEntries(
      WORK_IDS.map((id) => [id, { ...state.greatWorks.works[id], stage: stageCount(id) }]),
    ) as GameState['greatWorks']['works'],
  };
}

describe('the alliances (§9.9)', () => {
  it('wake once both sides have grown, and show from then on', () => {
    const fresh = openGame(0);
    expect(ALLIANCE_IDS.some((id) => isAwake(fresh, id))).toBe(false);
    expect(areAlliancesOpen(fresh)).toBe(false);
    const state = grown();
    expect(isAwake(state, 'orchardBees')).toBe(true);
    expect(isAwake(state, 'deepRoots')).toBe(true);
    expect(isAwake(state, 'tramMarket')).toBe(false);
    expect(areAlliancesOpen(state)).toBe(true);
    expect(isAwake({ ...state, species: ['bee'] }, 'orchardBees')).toBe(false);
  });

  it('work only while chosen and awake', () => {
    const state = grown();
    expect(allianceBonuses(state)).toEqual([]);
    const chosen = chooseAlliance(state, 'deepRoots');
    expect(workingAlliances(chosen)).toEqual(['deepRoots']);
    expect(costFactor(chosen)).toBeCloseTo(costFactor(state) * 0.9);
    // A chosen alliance whose side falls back asleep stops working but keeps its slot.
    const asleep = chooseAlliance(chosen, 'travellingSeeds');
    expect(asleep.alliances.chosen).toEqual(['deepRoots', 'travellingSeeds']);
    expect(workingAlliances(asleep)).toEqual(['deepRoots']);
  });

  it('fill three slots at first, more with the great works, sister cities and the bloom', () => {
    let state = grown();
    expect(allianceSlots(state)).toBe(3);
    for (const id of ['orchardBees', 'deepRoots', 'tramMarket'] as const) {
      state = chooseAlliance(state, id);
    }
    expect(state.alliances.chosen).toHaveLength(3);
    expect(chooseAlliance(state, 'villageFeast')).toBe(state);
    const more = {
      ...state,
      greatWorks: allWorks(state),
      city: { ...state.city, founded: ['coast' as const] },
      alliances: { ...state.alliances, bloomed: true },
    };
    expect(allianceSlots(more)).toBe(6);
  });

  it('take one out once per Cycle of water', () => {
    let state = chooseAlliance(chooseAlliance(grown(), 'orchardBees'), 'deepRoots');
    state = takeOutAlliance(state, 'orchardBees');
    expect(state.alliances.chosen).toEqual(['deepRoots']);
    expect(canTakeOut(state, 'deepRoots')).toBe(false);
    expect(takeOutAlliance(state, 'deepRoots')).toBe(state);
    // Choosing again stays free.
    expect(chooseAlliance(state, 'orchardBees').alliances.chosen).toHaveLength(2);
    const nextCycle = { ...state, cycles: state.cycles + 1 };
    expect(takeOutAlliance(nextCycle, 'deepRoots').alliances.chosen).toEqual([]);
  });

  it('do not touch the state they are given', () => {
    const state = grown();
    const before = JSON.stringify(state);
    chooseAlliance(state, 'orchardBees');
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('the grand bloom (§9.9)', () => {
  function restored(): GameState {
    const fresh = grown();
    return {
      ...fresh,
      greatWorks: allWorks(fresh),
      species: [...SPECIES_IDS],
      sites: Object.fromEntries(SITE_IDS.map((id) => [id, 5])) as GameState['sites'],
    };
  }

  it('comes with a tick once the whole region is restored, and resets nothing', () => {
    const almost = { ...restored(), sites: { ...restored().sites, hillsides: 4 } };
    expect(checkBloom(almost)).toBe(almost);
    const state = restored();
    const after = tick(state, 1);
    expect(after.alliances.bloomed).toBe(true);
    expect(after.resources.light).toBeGreaterThanOrEqual(state.resources.light);
    expect(after.seasons).toBe(state.seasons);
    expect(after.achievements).toContain('grandBloom');
    expect(allianceSlots(after)).toBe(allianceSlots(state) + 1);
  });
});

describe('saving the alliances', () => {
  it('survive a save and drop what a save cannot hold', () => {
    const state = chooseAlliance(grown(), 'deepRoots');
    const loaded = deserialize(serialize(state), 0)!;
    expect(loaded.alliances).toEqual(state.alliances);
    expect(globalBonus(loaded)).toBeCloseTo(globalBonus(state));
    expect(
      validAlliances({ chosen: ['deepRoots', 'nope', 'deepRoots'], changedCycle: 1.5, bloomed: 1 }),
    ).toEqual({ chosen: ['deepRoots'], changedCycle: -1, bloomed: false });
  });
});
