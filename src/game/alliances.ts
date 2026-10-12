// The alliances and the grand bloom (docs/game-design.md §9.9, M24). An alliance is a synergy
// between two systems the player has grown, often of two layers: it wakes once both reach a
// threshold, and works only while chosen, in a few slots. The composition changes freely while
// slots are free; taking one out is allowed once per Cycle of water. The grand bloom comes when
// the whole region is restored: it opens the last slot and is celebrated on the map, without
// text, and nothing starts again.
import { isIntroduced } from './introductions';
import type { Bonus } from './bonuses';
import { longestCorridor } from './corridors';
import { worksBuilt } from './greatWorks';
import { isHerbierComplete, type SpeciesId } from './species';
import type { GameState } from './state';
import { cityVisits } from './visits';

export const ALLIANCE_IDS = [
  'orchardBees',
  'tramMarket',
  'nourishingRiver',
  'travellingSeeds',
  'villageFeast',
  'deepRoots',
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
};

/** Slots at first; one more with two great works complete, each sister city, the bloom. */
export const BASE_SLOTS = 3;

/** Sites of the Bioregion each need this level for the grand bloom. */
export const BLOOM_SITE_LEVEL = 5;

export interface AlliancesState {
  /** Alliances chosen, in order. */
  chosen: AllianceId[];
  /** The Cycle in which one was last taken out; -1 never. */
  changedCycle: number;
  /** The grand bloom came: kept forever. */
  bloomed: boolean;
}

export function createAlliancesState(): AlliancesState {
  return { chosen: [], changedCycle: -1, bloomed: false };
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
  return Math.min(
    ALLIANCE_IDS.length,
    BASE_SLOTS +
      Number(worksBuilt(state) >= 2) +
      state.city.founded.length +
      Number(state.alliances.bloomed),
  );
}

export function canChoose(state: GameState, id: AllianceId): boolean {
  const { chosen } = state.alliances;
  return !chosen.includes(id) && chosen.length < allianceSlots(state);
}

/** Taking an alliance out is allowed once per Cycle of water. */
export function canTakeOut(state: GameState, id: AllianceId): boolean {
  return state.alliances.chosen.includes(id) && state.alliances.changedCycle !== state.cycles;
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
  alliances.bloomed = data.bloomed === true;
  return alliances;
}
