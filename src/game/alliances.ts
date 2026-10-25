// The alliances and the grand bloom (docs/game-design.md §9.9, M24). An alliance is a synergy
// between two systems the player has grown, often of two layers: it wakes once both reach a
// threshold, and works only while chosen, in a few slots. The composition changes freely while
// slots are free; taking one out is allowed once per Cycle of water (once per Season before the
// first Cycle, M34). The grand bloom comes when
// the whole region is restored: it opens the last slot and is celebrated on the map, without
// text, and nothing starts again.
import { isIntroduced } from './introductions';
import type { Bonus } from './bonuses';
import { longestCorridor } from './corridors';
import { worksBuilt } from './greatWorks';
import { isHerbierComplete, type SpeciesId } from './species';
import type { GameState } from './state';
import { cityVisits } from './visits';
import { pathsWorking } from './growth';
import { unlockedCooperatives } from './cooperatives';
import { isWeatherOpen } from './weather';
import { isBioregionOpen } from './bioregion';
import { completeFamilies } from './families';
import { completeMilestoneFamilies } from './milestoneFamilies';

export const ALLIANCE_IDS = [
  'orchardBees',
  'tramMarket',
  'nourishingRiver',
  'travellingSeeds',
  'villageFeast',
  'deepRoots',
  // M33-M34: the alliances of the middle of the game, between the systems of v4.
  'hivePollen',
  'showerGardens',
  'neighbourhoodForms',
  'mutualAid',
  'windBikes',
  'canopyFlocks',
  // M37: the alliances that count the families of Milestones complete.
  'garlands',
  'almanac',
] as const;
export type AllianceId = (typeof ALLIANCE_IDS)[number];

/** One of the two things an alliance links, with how far the player has grown it. */
export interface AllianceSide {
  /** Key of its name in the texts. */
  key: string;
  need: number;
  have: (state: GameState) => number;
}

export interface AllianceDef {
  id: AllianceId;
  sides: readonly [AllianceSide, AllianceSide];
  bonuses: readonly Bonus[];
}

/** The pollinators of the Herbier that count for the orchard's bees. */
export const POLLINATORS: readonly SpeciesId[] = ['bee', 'bumblebee', 'brimstone', 'ladybird'];

const sum = (values: Record<string, number>) => Object.values(values).reduce((a, b) => a + b, 0);

export const ALLIANCES: Record<AllianceId, AllianceDef> = {
  // The orchard's bees (§9.8) and the pollinators back in the Herbier: the butterfly follows them.
  orchardBees: {
    id: 'orchardBees',
    sides: [
      { key: 'hives', need: 1, have: (s) => s.orchard.hives },
      {
        key: 'pollinators',
        need: 3,
        have: (s) => POLLINATORS.filter((id) => s.species.includes(id)).length,
      },
    ],
    bonuses: [{ kind: 'butterflyInterval', factor: 0.85 }],
  },
  // The solar tram (§6.6) and the neighbouring districts (§6.4): a market at every stop.
  tramMarket: {
    id: 'tramMarket',
    sides: [
      { key: 'tram', need: 1, have: (s) => s.greatWorks.works.tram.stage },
      { key: 'districts', need: 2, have: (s) => s.districts.length },
    ],
    bonuses: [{ kind: 'clickMultiplier', factor: 2 }],
  },
  // The blue corridor (§6.7) and the hillsides arm of the delta (§7.5): water for the garden.
  nourishingRiver: {
    id: 'nourishingRiver',
    sides: [
      { key: 'blueCorridor', need: 2, have: (s) => longestCorridor(s, 'blue') },
      { key: 'hillsArm', need: 1, have: (s) => s.delta.levels.hillsArm },
    ],
    bonuses: [{ kind: 'gardenGrowth', factor: 1.3 }],
  },
  // The sister cities (§7.6) and the garden's seed bank (§9.7): seeds travel between them.
  travellingSeeds: {
    id: 'travellingSeeds',
    sides: [
      { key: 'sisterCities', need: 1, have: (s) => s.city.founded.length },
      { key: 'varieties', need: 3, have: (s) => s.garden.varieties.length },
    ],
    bonuses: [{ kind: 'global', bonus: 0.1 }],
  },
  // The visits of the city (§9.6) and the food hall (§6.6): the feast makes harvests last.
  villageFeast: {
    id: 'villageFeast',
    sides: [
      { key: 'cityVisits', need: 10, have: (s) => cityVisits(s) },
      { key: 'hall', need: 1, have: (s) => s.greatWorks.works.hall.stage },
    ],
    bonuses: [{ kind: 'effectDuration', effect: 'beans', factor: 1.5 }],
  },
  // The Canopy (§7.1) and the widened arms of the delta (M19): deep roots make building cheaper.
  deepRoots: {
    id: 'deepRoots',
    sides: [
      { key: 'canopy', need: 10, have: (s) => sum(s.canopy.levels) },
      { key: 'widths', need: 1, have: (s) => sum(s.delta.widths) },
    ],
    bonuses: [{ kind: 'discount', fraction: 0.1 }],
  },
  // The orchard's hives (§9.8) and the pollen flights (§5.6): the bees carry the pollen.
  hivePollen: {
    id: 'hivePollen',
    sides: [
      { key: 'hives', need: 1, have: (s) => s.orchard.hives },
      { key: 'flights', need: 50, have: (s) => s.pollen.flights },
    ],
    bonuses: [{ kind: 'pollenFill', factor: 1.25 }],
  },
  // The neighbours' showers (§9.6) and the seed bank (§9.7): the watered beds give more.
  showerGardens: {
    id: 'showerGardens',
    sides: [
      { key: 'showers', need: 10, have: (s) => s.visits.shower },
      { key: 'varieties', need: 3, have: (s) => s.garden.varieties.length },
    ],
    bonuses: [{ kind: 'harvestBaskets', units: 1 }],
  },
  // The buildings' paths (§5.5) and the restored parcels (§6.1): every form shapes the district.
  neighbourhoodForms: {
    id: 'neighbourhoodForms',
    sides: [
      { key: 'paths', need: 6, have: (s) => pathsWorking(s) },
      { key: 'parcels', need: 4, have: (s) => s.parcels.length },
    ],
    bonuses: [{ kind: 'perPath', bonus: 0.01 }],
  },
  // The neighbours' requests (§9.11) and a district bound to ours: help comes back.
  mutualAid: {
    id: 'mutualAid',
    sides: [
      { key: 'requests', need: 10, have: (s) => s.requests.served },
      {
        key: 'bonds',
        need: 1,
        have: (s) => Object.values(s.requests.bonds).filter((n) => (n ?? 0) > 0).length,
      },
    ],
    bonuses: [{ kind: 'handSlots', units: 1 }],
  },
  // The Cooperatives (§7.2) and the weathers lived (§9.10): the cargo bikes ride the wind.
  windBikes: {
    id: 'windBikes',
    sides: [
      { key: 'cooperatives', need: 3, have: (s) => unlockedCooperatives(s).length },
      { key: 'weathers', need: 5, have: (s) => s.weather.seen.length },
    ],
    bonuses: [],
  },
  // The flocks of migrating birds (§9.6) and the urban canopy: the flocks rest in the trees.
  canopyFlocks: {
    id: 'canopyFlocks',
    sides: [
      { key: 'flocks', need: 10, have: (s) => s.visits.birds },
      { key: 'urbanCanopy', need: 10, have: (s) => s.generators.urbanCanopy },
    ],
    bonuses: [{ kind: 'effectDuration', effect: 'birds', factor: 1.5 }],
  },
  // The families of Milestones (§9.16) and those of the Herbier (§9.15): garlands for each.
  garlands: {
    id: 'garlands',
    sides: [
      {
        key: 'milestoneFamilies',
        need: 1,
        have: (s) => completeMilestoneFamilies(s.achievements).length,
      },
      { key: 'herbierFamilies', need: 2, have: (s) => completeFamilies(s.species).length },
    ],
    bonuses: [{ kind: 'perAchievement', bonus: 0.002 }],
  },
  // The families of Milestones and the requests served (§9.11): the neighbours' almanac.
  almanac: {
    id: 'almanac',
    sides: [
      {
        key: 'milestoneFamilies',
        need: 3,
        have: (s) => completeMilestoneFamilies(s.achievements).length,
      },
      { key: 'requests', need: 20, have: (s) => s.requests.served },
    ],
    bonuses: [{ kind: 'harvestBaskets', units: 1 }],
  },
};

/**
 * "Les vélos dans le vent" (M34): under the wind, the Cooperatives also buy the synergies, as the
 * council would.
 */
export function windBikesRiding(state: GameState): boolean {
  return (
    workingAlliances(state).includes('windBikes') &&
    isWeatherOpen(state) &&
    state.weather.current === 'wind'
  );
}

/**
 * Slots once the Bioregion is open; two from the 2nd Season before it (M34). One more with two
 * great works complete, each sister city and the bloom, up to MAX_SLOTS.
 */
export const BASE_SLOTS = 3;
export const EARLY_SLOTS = 2;
export const MAX_SLOTS = 8;

/** Sites of the Bioregion each need this level for the grand bloom. */
export const BLOOM_SITE_LEVEL = 5;

export interface AlliancesState {
  /** Alliances chosen, in order. */
  chosen: AllianceId[];
  /** The Cycle in which one was last taken out; -1 never. */
  changedCycle: number;
  /** The Season in which one was last taken out (M34); -1 never. */
  changedSeason: number;
  /** The grand bloom came: kept forever. */
  bloomed: boolean;
}

export function createAlliancesState(): AlliancesState {
  return { chosen: [], changedCycle: -1, changedSeason: -1, bloomed: false };
}

export function isAllianceId(value: unknown): value is AllianceId {
  return typeof value === 'string' && Object.hasOwn(ALLIANCES, value);
}

/** Both sides have grown enough: the alliance can work. */
export function isAwake(state: GameState, id: AllianceId): boolean {
  return ALLIANCES[id].sides.every((side) => side.have(state) >= side.need);
}

/** The alliances show once one is awake, and stay. */
export function areAlliancesOpen(state: GameState): boolean {
  return (
    isIntroduced(state, 'alliances') &&
    (state.alliances.chosen.length > 0 || ALLIANCE_IDS.some((id) => isAwake(state, id)))
  );
}

export function allianceSlots(state: GameState): number {
  const base = isBioregionOpen(state) ? BASE_SLOTS : state.seasons > 0 ? EARLY_SLOTS : 0;
  return Math.min(
    MAX_SLOTS,
    base +
      Number(worksBuilt(state) >= 2) +
      state.city.founded.length +
      Number(state.alliances.bloomed),
  );
}

/** What can still open an alliance slot, in the order a player usually meets it. */
export type SlotSource = 'bioregion' | 'works' | 'bloom' | 'sister';

/** The ways left to gain a slot; empty once every slot is open. */
export function slotSourcesLeft(state: GameState): SlotSource[] {
  if (allianceSlots(state) >= MAX_SLOTS) return [];
  const left: SlotSource[] = [];
  if (!isBioregionOpen(state)) left.push('bioregion');
  if (worksBuilt(state) < 2) left.push('works');
  if (!state.alliances.bloomed) left.push('bloom');
  left.push('sister');
  return left;
}

export function canChoose(state: GameState, id: AllianceId): boolean {
  const { chosen } = state.alliances;
  return !chosen.includes(id) && chosen.length < allianceSlots(state);
}

/**
 * Taking an alliance out is allowed once per Cycle of water; before the first Cycle, once per
 * Season (M34).
 */
export function canTakeOut(state: GameState, id: AllianceId): boolean {
  if (!state.alliances.chosen.includes(id)) return false;
  if (state.cycles === 0) return state.alliances.changedSeason !== state.seasons;
  return state.alliances.changedCycle !== state.cycles;
}

/** Player action: choose an alliance for a free slot. */
export function chooseAlliance(state: GameState, id: AllianceId): GameState {
  if (!canChoose(state, id)) return state;
  return {
    ...state,
    alliances: { ...state.alliances, chosen: [...state.alliances.chosen, id] },
  };
}

/** Player action: take an alliance out of its slot, once per Cycle. */
export function takeOutAlliance(state: GameState, id: AllianceId): GameState {
  if (!canTakeOut(state, id)) return state;
  return {
    ...state,
    alliances: {
      ...state.alliances,
      chosen: state.alliances.chosen.filter((c) => c !== id),
      changedCycle: state.cycles,
      changedSeason: state.seasons,
    },
  };
}

/** Alliances chosen and awake: the ones that work. */
export function workingAlliances(state: GameState): AllianceId[] {
  return state.alliances.chosen.filter((id) => isAwake(state, id));
}

/** Bonuses of the alliances that work. */
export function allianceBonuses(state: GameState): Bonus[] {
  return workingAlliances(state).flatMap((id) => ALLIANCES[id].bonuses);
}

/** The whole region is restored: every great work, the Herbier, every site at its level. */
export function isRegionRestored(state: GameState): boolean {
  return (
    worksBuilt(state) >= 4 &&
    isHerbierComplete(state) &&
    Object.values(state.sites).every((level) => level >= BLOOM_SITE_LEVEL)
  );
}

/** The grand bloom comes once the region is restored. Called by every tick. */
export function checkBloom(state: GameState): GameState {
  if (state.alliances.bloomed || !isRegionRestored(state)) return state;
  return { ...state, alliances: { ...state.alliances, bloomed: true } };
}

/** Keep only what a save can hold. */
export function validAlliances(raw: unknown): AlliancesState {
  const alliances = createAlliancesState();
  if (typeof raw !== 'object' || raw === null) return alliances;
  const data = raw as Record<string, unknown>;
  if (Array.isArray(data.chosen)) {
    alliances.chosen = [...new Set<AllianceId>(data.chosen.filter(isAllianceId))];
  }
  if (typeof data.changedCycle === 'number' && Number.isInteger(data.changedCycle)) {
    alliances.changedCycle = data.changedCycle;
  }
  if (typeof data.changedSeason === 'number' && Number.isInteger(data.changedSeason)) {
    alliances.changedSeason = data.changedSeason;
  }
  alliances.bloomed = data.bloomed === true;
  return alliances;
}
