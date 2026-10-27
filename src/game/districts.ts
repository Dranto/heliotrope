// The neighbouring districts (docs/game-design.md §6.4): once the home neighbourhood is fully
// restored, the grey blocks around the city open one by one. Each is restored once for Light and
// stays restored for good, through Seasons and Cycles, and brings a rule rather than raw speed,
// an effect on the pace (Seeds that ripen sooner, cheaper collectors or sites, slimming plan
// lot 7) and the +3% of production the seed tower gave.
// Names live in src/i18n, places and art in src/ui.
import { discountFactor, type Bonus } from './bonuses';
import { PARCEL_IDS } from './parcels';
import type { GameState } from './state';

export const DISTRICT_IDS = [
  'tanneries',
  'railyard',
  'mall',
  'parkAndRide',
  'interchange',
  'offices',
  'industrialZone',
  'chimneys',
] as const;
export type DistrictId = (typeof DISTRICT_IDS)[number];

export interface DistrictDef {
  id: DistrictId;
  cost: number;
  bonuses: readonly Bonus[];
}

/** Production each district adds, the seed tower's share of the old great works (lot 7). */
export const DISTRICT_PRODUCTION = 0.03;

/** A district is offered once the Season has earned this share of its cost, like a parcel. */
export const DISTRICT_REVEAL_SHARE = 0.5;

export const DISTRICT_LIST: readonly DistrictDef[] = [
  {
    // The old tanneries become water gardens.
    id: 'tanneries',
    cost: 1e11,
    bonuses: [
      { kind: 'water', factor: 1.5 },
      { kind: 'effectDuration', effect: 'shower', factor: 1.5 },
      { kind: 'siteDiscount', fraction: 0.1 },
      { kind: 'global', bonus: DISTRICT_PRODUCTION },
    ],
  },
  {
    // The railyard becomes a linear forest along the old tracks.
    id: 'railyard',
    cost: 5e11,
    bonuses: [
      { kind: 'generatorMultiplier', generator: 'urbanCanopy', factor: 2 },
      { kind: 'effectDuration', effect: 'birds', factor: 1.5 },
      { kind: 'ripening', seconds: 30 },
      { kind: 'global', bonus: DISTRICT_PRODUCTION },
    ],
  },
  {
    // The shopping mall becomes an orchard.
    id: 'mall',
    cost: 2.5e12,
    bonuses: [
      { kind: 'cuttingsGift', units: 1 },
      { kind: 'generatorMultiplier', generator: 'rooftopGarden', factor: 1.5 },
      { kind: 'collectorDiscount', fraction: 0.1 },
      { kind: 'global', bonus: DISTRICT_PRODUCTION },
    ],
  },
  {
    // The park-and-ride becomes covered farmers' halls.
    id: 'parkAndRide',
    cost: 1.25e13,
    bonuses: [
      { kind: 'harvestFactor', factor: 1.5 },
      { kind: 'siteDiscount', fraction: 0.1 },
      // The tram of the old great works stops here: +1% per district restored.
      { kind: 'perDistrict', bonus: 0.01 },
      { kind: 'global', bonus: DISTRICT_PRODUCTION },
    ],
  },
  {
    // The motorway interchange becomes a hillside park.
    id: 'interchange',
    cost: 6e13,
    bonuses: [
      { kind: 'visitInterval', factor: 0.8 },
      { kind: 'butterflyInterval', factor: 0.9 },
      { kind: 'collectorDiscount', fraction: 0.1 },
      { kind: 'global', bonus: DISTRICT_PRODUCTION },
    ],
  },
  {
    // The office towers become a third place with a planted plaza.
    id: 'offices',
    cost: 3e14,
    bonuses: [
      { kind: 'synergyFactor', factor: 1.25 },
      { kind: 'collectorDiscount', fraction: 0.1 },
      { kind: 'global', bonus: DISTRICT_PRODUCTION },
    ],
  },
  {
    // The industrial zone becomes a solar workshop under green roofs.
    id: 'industrialZone',
    cost: 1.5e15,
    bonuses: [
      { kind: 'discount', fraction: 0.1 },
      { kind: 'siteDiscount', fraction: 0.1 },
      { kind: 'global', bonus: DISTRICT_PRODUCTION },
    ],
  },
  {
    // The chimney quarter becomes living towers with planted terraces.
    id: 'chimneys',
    cost: 7.5e15,
    bonuses: [
      { kind: 'generatorMultiplier', generator: 'arcology', factor: 2 },
      { kind: 'perAchievement', bonus: 0.005 },
      { kind: 'ripening', seconds: 30 },
      { kind: 'global', bonus: DISTRICT_PRODUCTION },
    ],
  },
];

/** Seconds the districts take off the Seeds' ripening, all together. */
export const DISTRICTS_RIPENING_SECONDS = DISTRICT_LIST.flatMap((d) => d.bonuses).reduce(
  (sum, bonus) => sum + (bonus.kind === 'ripening' ? bonus.seconds : 0),
  0,
);

export const DISTRICTS = Object.fromEntries(DISTRICT_LIST.map((d) => [d.id, d])) as Record<
  DistrictId,
  DistrictDef
>;

export function isDistrictId(value: unknown): value is DistrictId {
  return typeof value === 'string' && (DISTRICT_IDS as readonly string[]).includes(value);
}

/** The districts open once every parcel of the home neighbourhood is restored (§6.1). */
export function areDistrictsOpen(state: Pick<GameState, 'parcels'>): boolean {
  return PARCEL_IDS.every((id) => state.parcels.includes(id));
}

/** The next district to restore, in order; null once all are. */
export function nextDistrict(state: Pick<GameState, 'districts'>): DistrictDef | null {
  return DISTRICT_LIST.find((d) => !state.districts.includes(d.id)) ?? null;
}

/**
 * A district is offered when the neighbourhood is fully restored, every district before it is
 * too, and the Season has earned half its cost.
 */
export function offeredDistrict(state: GameState): DistrictDef | null {
  if (!areDistrictsOpen(state)) return null;
  const next = nextDistrict(state);
  return next && state.totalLight >= next.cost * DISTRICT_REVEAL_SHARE ? next : null;
}

/** Light a district costs, with the talents of the Quartier (§7.1). */
export function districtCost(state: GameState, id: DistrictId): number {
  return DISTRICTS[id].cost * discountFactor(state, 'landDiscount');
}

export function canRestoreDistrict(state: GameState, id: DistrictId): boolean {
  return offeredDistrict(state)?.id === id && state.resources.light >= districtCost(state, id);
}

/** Player action: restore a district. It stays restored in every later Season and Cycle. */
export function restoreDistrict(state: GameState, id: DistrictId): GameState {
  if (!canRestoreDistrict(state, id)) return state;
  return {
    ...state,
    resources: { ...state.resources, light: state.resources.light - districtCost(state, id) },
    districts: [...state.districts, id],
    idleSeconds: 0,
  };
}
