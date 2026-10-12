// The sister cities' data (docs/game-design.md §7.6, M23, M30): the five landscapes a new city can
// take, the bonus each city left behind sends to the network, and the Savoirs' workshop. Pure
// data and the bonus formula, read by bonuses.ts; the swarming itself lives in cities.ts.
import type { Bonus } from './bonuses';

export const LANDSCAPE_IDS = ['coast', 'mountain', 'plain', 'forest', 'marsh'] as const;
export type LandscapeId = (typeof LANDSCAPE_IDS)[number];
/** A city left behind: the home city, or a sister city of a landscape. */
export type CityKind = 'home' | LandscapeId;

export interface LandscapeDef {
  id: LandscapeId;
  /** The rule of the city while the player lives in it: a strength and a weakness. */
  rule: readonly Bonus[];
  /** What the city sends to the network once left behind. */
  network: readonly Bonus[];
}

export const LANDSCAPES: Record<LandscapeId, LandscapeDef> = {
  // The coast: Water counts double, but the sea wind wears the balcony panels.
  coast: {
    id: 'coast',
    rule: [
      { kind: 'water', factor: 2 },
      { kind: 'generatorMultiplier', generator: 'balconyPanel', factor: 0.5 },
    ],
    network: [{ kind: 'water', factor: 1.1 }],
  },
  // The mountain: the butterfly and the visits come more often, the springs give less.
  mountain: {
    id: 'mountain',
    rule: [
      { kind: 'butterflyInterval', factor: 0.75 },
      { kind: 'visitInterval', factor: 0.75 },
      { kind: 'water', factor: 0.75 },
    ],
    network: [{ kind: 'butterflyInterval', factor: 0.95 }],
  },
  // The plain: room to build, so buildings cost less, but the flower is clicked less.
  plain: {
    id: 'plain',
    rule: [
      { kind: 'discount', fraction: 0.15 },
      { kind: 'clickMultiplier', factor: 0.5 },
    ],
    network: [{ kind: 'discount', fraction: 0.03 }],
  },
  // The forest (M30): the trees of the parcels count double and the orchard grows faster, but
  // the mirrors stand in the shade.
  forest: {
    id: 'forest',
    rule: [
      { kind: 'perParcel', bonus: 0.04 },
      { kind: 'orchardGrowth', factor: 1.5 },
      { kind: 'generatorMultiplier', generator: 'mirrorPlant', factor: 0.5 },
    ],
    network: [{ kind: 'orchardGrowth', factor: 1.1 }],
  },
  // The marsh (M30): the species count more and the Water flows, but the vertical farms sink in
  // the soft ground.
  marsh: {
    id: 'marsh',
    rule: [
      { kind: 'biodiversityFactor', factor: 1.5 },
      { kind: 'water', factor: 1.5 },
      { kind: 'generatorMultiplier', generator: 'verticalFarm', factor: 0.5 },
    ],
    network: [{ kind: 'biodiversityFactor', factor: 1.05 }],
  },
};

/** What the home city sends once left: a little of everything. */
export const HOME_NETWORK: readonly Bonus[] = [{ kind: 'global', bonus: 0.03 }];

/** Every city left behind also sends cuttings (§7.1) to the start of each Season. */
export const NETWORK_CUTTINGS = 2;

/** Each Savoir ever earned adds this to global production. */
export const SAVOIR_BONUS = 0.03;

/** Each Savoir ever earned adds this much more per level of the schools. */
export const SCHOOL_BONUS = 0.01;

export const WORKSHOP_IDS = [
  'memory',
  'seedlings',
  'builders',
  'trade',
  'wells',
  'schools',
] as const;
export type WorkshopId = (typeof WORKSHOP_IDS)[number];
/** The level learnt of each rule of the workshop; a rule not learnt is absent. */
export type Workshop = Partial<Record<WorkshopId, number>>;

/**
 * The Savoirs' workshop: rules that change for every city to come, learnt level by level (M30),
 * one price per level.
 * memory: a new city starts with a quarter of the Sources left unspent per level;
 * seedlings: the Tree of Seasons and its Canopy are kept when swarming;
 * builders: the Bioregion's sites are raised on their own when the Water allows;
 * trade: the network sends one time more per level;
 * wells: a new city keeps a third of the water collectors per level;
 * schools: each Savoir ever earned adds 1% more production per level.
 */
export const WORKSHOP_COSTS: Record<WorkshopId, readonly number[]> = {
  memory: [5, 10, 20],
  seedlings: [6],
  builders: [8],
  trade: [12, 24, 48],
  wells: [6, 12, 24],
  schools: [10, 20, 40, 80, 160],
};

export function workshopLevel(workshop: Workshop, id: WorkshopId): number {
  return workshop[id] ?? 0;
}

/** The price of the next level of a rule, or null once it is learnt to the end. */
export function nextWorkshopCost(workshop: Workshop, id: WorkshopId): number | null {
  return WORKSHOP_COSTS[id][workshopLevel(workshop, id)] ?? null;
}

export function isLandscapeId(value: unknown): value is LandscapeId {
  return typeof value === 'string' && Object.hasOwn(LANDSCAPES, value);
}

export function isCityKind(value: unknown): value is CityKind {
  return value === 'home' || isLandscapeId(value);
}

export function isWorkshopId(value: unknown): value is WorkshopId {
  return typeof value === 'string' && Object.hasOwn(WORKSHOP_COSTS, value);
}

/** A network bonus `scale` times as strong. */
function scaled(bonus: Bonus, scale: number): Bonus {
  if (scale === 1) return bonus;
  if ('factor' in bonus) return { ...bonus, factor: 1 + (bonus.factor - 1) * scale };
  if ('bonus' in bonus) return { ...bonus, bonus: bonus.bonus * scale };
  if ('fraction' in bonus) return { ...bonus, fraction: bonus.fraction * scale };
  return bonus;
}

/** What one city left behind sends to the network. */
export function networkBonuses(kind: CityKind, scale = 1): Bonus[] {
  const own = kind === 'home' ? HOME_NETWORK : LANDSCAPES[kind].network;
  return [
    ...own.map((b) => scaled(b, scale)),
    { kind: 'cuttingsGift', units: NETWORK_CUTTINGS * scale },
  ];
}

export interface CitySource {
  landscape: LandscapeId | null;
  founded: readonly CityKind[];
  earned: number;
  workshop: Workshop;
}

/** What the Savoirs ever earned add to production, with the workshop's schools. */
export function savoirBonus(city: Pick<CitySource, 'earned' | 'workshop'>): number {
  return (SAVOIR_BONUS + SCHOOL_BONUS * workshopLevel(city.workshop, 'schools')) * city.earned;
}

/** The rule of the city lived in, the network of the cities left, and the Savoirs earned. */
export function cityBonuses(city: CitySource): Bonus[] {
  const scale = 1 + workshopLevel(city.workshop, 'trade');
  return [
    ...(city.landscape ? LANDSCAPES[city.landscape].rule : []),
    ...city.founded.flatMap((kind) => networkBonuses(kind, scale)),
    ...(city.earned > 0 ? [{ kind: 'global', bonus: savoirBonus(city) } as const] : []),
  ];
}
