// Upgrade data (docs/game-design.md §5). One-off purchases; their names and flavour lines live
// in src/i18n. Adding an upgrade only means adding a row here and its texts.
import { GENERATOR_IDS, GENERATORS, type GeneratorId } from './generators';

/** §5.1: owned thresholds that unlock a ×2 upgrade for a generator, with costs in base costs. */
export const GENERATOR_UPGRADE_TIERS = [
  { owned: 1, costFactor: 10 },
  { owned: 5, costFactor: 50 },
  { owned: 25, costFactor: 500 },
  { owned: 50, costFactor: 50_000 },
  { owned: 100, costFactor: 5_000_000 },
  { owned: 150, costFactor: 500_000_000 },
  { owned: 200, costFactor: 50_000_000_000 },
] as const;

export type GeneratorUpgradeTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type GeneratorUpgradeId = `${GeneratorId}.${GeneratorUpgradeTier}`;

export const CLICK_UPGRADE_IDS = [
  'warmHands',
  'gloves',
  'pruningShears',
  'helpingHands',
  'copperCan',
  'neighbourHands',
  'sunHat',
  'greenHands',
  'sharedGesture',
  'solarHarvest',
] as const;
export type ClickUpgradeId = (typeof CLICK_UPGRADE_IDS)[number];

export const SYNERGY_IDS = [
  // A dearer neighbour helps the cheaper one (§5.3).
  'sunnyPots',
  'wiredRoofs',
  'sharedCompost',
  'seedlingTowers',
  'reflectedLight',
  'coolMirrors',
  'livingRoots',
  // A cheaper neighbour, owned in numbers, helps the dearer one.
  'potCuttings',
  'rooftopSockets',
  'gardenersCorner',
  'nurseryFloors',
  'farmFlowers',
  'sunlitGlades',
  'usefulShade',
  'canopyCorridors',
  // Distant pairs.
  'recoveredHeat',
  'thousandPots',
  'citizenGrid',
] as const;
export type SynergyId = (typeof SYNERGY_IDS)[number];

/** §5.3: upgrades that grow with the other upgrades bought. */
export const UPGRADE_SYNERGY_IDS = ['sharedKnowledge', 'seedLibrary', 'commons'] as const;
export type UpgradeSynergyId = (typeof UPGRADE_SYNERGY_IDS)[number];

/** §5.3: buildings that grow with the click upgrades bought. */
export const CLICK_SYNERGY_IDS = ['tendedPots', 'gardenerRounds', 'handPollination'] as const;
export type ClickSynergyId = (typeof CLICK_SYNERGY_IDS)[number];

export type UpgradeId =
  GeneratorUpgradeId | ClickUpgradeId | SynergyId | UpgradeSynergyId | ClickSynergyId;

export type UpgradeEffect =
  /** Multiplies one generator's production. */
  | { kind: 'generatorMultiplier'; generator: GeneratorId; factor: number }
  /** Multiplies the base Light of a click. */
  | { kind: 'clickMultiplier'; factor: number }
  /** Adds a fraction of the Light per second to each click. */
  | { kind: 'clickFromProduction'; fraction: number }
  /** Adds `perUnit` base Light to each click per building owned (all types). */
  | { kind: 'clickPerBuilding'; perUnit: number }
  /** `generator` gains `bonusPerUpgrade` (additive) per click upgrade bought. */
  | { kind: 'clickSynergy'; generator: GeneratorId; bonusPerUpgrade: number }
  /** `generator` gains `bonusPerUnit` (additive) per unit of `source` owned. */
  | { kind: 'synergy'; generator: GeneratorId; source: GeneratorId; bonusPerUnit: number }
  /** Global production gains `bonusPerUpgrade` (additive) per upgrade of `counts` bought. */
  | { kind: 'upgradeSynergy'; counts: 'all' | 'synergies'; bonusPerUpgrade: number };

export interface UpgradeCondition {
  /** Minimum units owned of each listed generator. */
  owned?: Partial<Record<GeneratorId, number>>;
  /** Minimum Light earned during the current Season. */
  totalLight?: number;
  /** Minimum number of upgrades bought this Season. */
  upgrades?: number;
  /** Minimum number of building synergies bought this Season. */
  synergies?: number;
  /** Minimum number of clicks on the heliotrope (all Seasons). */
  clicks?: number;
  /** Minimum number of click upgrades bought this Season. */
  clickUpgrades?: number;
}

export interface UpgradeDef {
  id: UpgradeId;
  cost: number;
  condition: UpgradeCondition;
  effect: UpgradeEffect;
}

/** Synergies unlock when both generators reach this many units (§5.3). */
export const SYNERGY_OWNED = 10;
/** ...or this many when one of them is among the last three, scarcer buildings. */
export const SYNERGY_OWNED_LATE = 5;
const LATE_GENERATORS: readonly GeneratorId[] = GENERATOR_IDS.slice(-3);
/** Synergy cost, in base costs of the more expensive of the two generators (§5.3). */
export const SYNERGY_COST_FACTOR = 2_000;
/** ...or this many when the dearer one is the Vertical farm, whose base cost jumps ×33. */
export const SYNERGY_COST_FACTOR_FARM = 100;
/** ...or this many for the synergies of the last three buildings, so they pay off in time. */
export const SYNERGY_COST_FACTOR_LATE = 10;

function synergyCostFactor(dearer: GeneratorId): number {
  if (LATE_GENERATORS.includes(dearer)) return SYNERGY_COST_FACTOR_LATE;
  return dearer === 'verticalFarm' ? SYNERGY_COST_FACTOR_FARM : SYNERGY_COST_FACTOR;
}

function generatorUpgrades(): UpgradeDef[] {
  return GENERATOR_IDS.flatMap((generator) =>
    GENERATOR_UPGRADE_TIERS.map(({ owned, costFactor }, index) => ({
      id: `${generator}.${(index + 1) as GeneratorUpgradeTier}` as const,
      cost: GENERATORS[generator].baseCost * costFactor,
      condition: { owned: { [generator]: owned } },
      effect: { kind: 'generatorMultiplier', generator, factor: 2 } as const,
    })),
  );
}

const CLICK_UPGRADES: UpgradeDef[] = [
  {
    id: 'warmHands',
    cost: 15,
    condition: { clicks: 15, owned: { pot: 1 } },
    effect: { kind: 'clickMultiplier', factor: 2 },
  },
  {
    id: 'gloves',
    cost: 100,
    condition: { totalLight: 300 },
    effect: { kind: 'clickMultiplier', factor: 2 },
  },
  {
    id: 'pruningShears',
    cost: 500,
    condition: { clicks: 200 },
    effect: { kind: 'clickMultiplier', factor: 2 },
  },
  {
    id: 'helpingHands',
    cost: 2_000,
    condition: { owned: { pot: 10 } },
    effect: { kind: 'clickPerBuilding', perUnit: 0.05 },
  },
  {
    id: 'copperCan',
    cost: 10_000,
    condition: { totalLight: 50_000 },
    effect: { kind: 'clickMultiplier', factor: 2 },
  },
  {
    id: 'neighbourHands',
    cost: 50_000,
    condition: { owned: { balconyPanel: 25 } },
    effect: { kind: 'clickPerBuilding', perUnit: 0.1 },
  },
  {
    id: 'sunHat',
    cost: 200_000,
    condition: { clicks: 2_000 },
    effect: { kind: 'clickFromProduction', fraction: 0.005 },
  },
  {
    id: 'greenHands',
    cost: 1e6,
    condition: { totalLight: 1e7 },
    effect: { kind: 'clickFromProduction', fraction: 0.01 },
  },
  {
    id: 'sharedGesture',
    cost: 1e8,
    condition: { totalLight: 1e9 },
    effect: { kind: 'clickFromProduction', fraction: 0.01 },
  },
  {
    id: 'solarHarvest',
    cost: 1e10,
    condition: { totalLight: 1e11 },
    effect: { kind: 'clickFromProduction', fraction: 0.01 },
  },
];

function synergy(
  id: SynergyId,
  generator: GeneratorId,
  source: GeneratorId,
  bonusPerUnit: number,
): UpgradeDef {
  const late = LATE_GENERATORS.includes(generator) || LATE_GENERATORS.includes(source);
  const owned = late ? SYNERGY_OWNED_LATE : SYNERGY_OWNED;
  const dearer = GENERATORS[generator].baseCost >= GENERATORS[source].baseCost ? generator : source;
  return {
    id,
    cost: synergyCostFactor(dearer) * GENERATORS[dearer].baseCost,
    condition: { owned: { [generator]: owned, [source]: owned } },
    effect: { kind: 'synergy', generator, source, bonusPerUnit },
  };
}

const SYNERGIES: UpgradeDef[] = [
  synergy('sunnyPots', 'pot', 'balconyPanel', 0.05),
  synergy('wiredRoofs', 'balconyPanel', 'rooftopGarden', 0.05),
  synergy('sharedCompost', 'rooftopGarden', 'greenhouse', 0.05),
  synergy('seedlingTowers', 'greenhouse', 'verticalFarm', 0.04),
  synergy('reflectedLight', 'verticalFarm', 'mirrorPlant', 0.03),
  synergy('coolMirrors', 'mirrorPlant', 'urbanCanopy', 0.03),
  synergy('livingRoots', 'urbanCanopy', 'arcology', 0.03),
  synergy('potCuttings', 'balconyPanel', 'pot', 0.01),
  synergy('rooftopSockets', 'rooftopGarden', 'balconyPanel', 0.01),
  synergy('gardenersCorner', 'greenhouse', 'rooftopGarden', 0.01),
  synergy('nurseryFloors', 'verticalFarm', 'greenhouse', 0.01),
  synergy('farmFlowers', 'mirrorPlant', 'verticalFarm', 0.01),
  synergy('sunlitGlades', 'urbanCanopy', 'mirrorPlant', 0.01),
  synergy('usefulShade', 'urbanCanopy', 'balconyPanel', 0.01),
  synergy('canopyCorridors', 'arcology', 'urbanCanopy', 0.01),
  synergy('recoveredHeat', 'greenhouse', 'mirrorPlant', 0.02),
  synergy('thousandPots', 'arcology', 'pot', 0.005),
  synergy('citizenGrid', 'mirrorPlant', 'balconyPanel', 0.005),
];

function upgradeSynergy(
  id: UpgradeSynergyId,
  cost: number,
  condition: UpgradeCondition,
  counts: 'all' | 'synergies',
  bonusPerUpgrade: number,
): UpgradeDef {
  return { id, cost, condition, effect: { kind: 'upgradeSynergy', counts, bonusPerUpgrade } };
}

const UPGRADE_SYNERGIES: UpgradeDef[] = [
  upgradeSynergy('sharedKnowledge', 50_000, { upgrades: 10 }, 'all', 0.005),
  upgradeSynergy('seedLibrary', 50_000_000, { upgrades: 30 }, 'all', 0.005),
  upgradeSynergy('commons', 500_000_000, { synergies: 6 }, 'synergies', 0.03),
];

function clickSynergy(
  id: ClickSynergyId,
  cost: number,
  generator: GeneratorId,
  clickUpgrades: number,
  bonusPerUpgrade: number,
): UpgradeDef {
  return {
    id,
    cost,
    condition: { owned: { [generator]: SYNERGY_OWNED }, clickUpgrades },
    effect: { kind: 'clickSynergy', generator, bonusPerUpgrade },
  };
}

const CLICK_SYNERGIES: UpgradeDef[] = [
  clickSynergy('tendedPots', 1_000, 'pot', 3, 0.05),
  clickSynergy('gardenerRounds', 30_000, 'rooftopGarden', 5, 0.03),
  clickSynergy('handPollination', 300_000, 'greenhouse', 6, 0.03),
];

export const UPGRADE_LIST: readonly UpgradeDef[] = [
  ...generatorUpgrades(),
  ...CLICK_UPGRADES,
  ...SYNERGIES,
  ...UPGRADE_SYNERGIES,
  ...CLICK_SYNERGIES,
];

export const UPGRADES = Object.fromEntries(UPGRADE_LIST.map((u) => [u.id, u])) as Record<
  UpgradeId,
  UpgradeDef
>;

export function isUpgradeId(value: unknown): value is UpgradeId {
  return typeof value === 'string' && Object.hasOwn(UPGRADES, value);
}
