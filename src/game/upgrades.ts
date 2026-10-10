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
  'gloves',
  'copperCan',
  'greenHands',
  'sharedGesture',
  'solarHarvest',
] as const;
export type ClickUpgradeId = (typeof CLICK_UPGRADE_IDS)[number];

export const SYNERGY_IDS = ['sharedCompost', 'usefulShade', 'recoveredHeat'] as const;
export type SynergyId = (typeof SYNERGY_IDS)[number];

export type UpgradeId = GeneratorUpgradeId | ClickUpgradeId | SynergyId;

export type UpgradeEffect =
  /** Multiplies one generator's production. */
  | { kind: 'generatorMultiplier'; generator: GeneratorId; factor: number }
  /** Multiplies the base Light of a click. */
  | { kind: 'clickMultiplier'; factor: number }
  /** Adds a fraction of the Light per second to each click. */
  | { kind: 'clickFromProduction'; fraction: number }
  /** `generator` gains `bonusPerUnit` (additive) per unit of `source` owned. */
  | { kind: 'synergy'; generator: GeneratorId; source: GeneratorId; bonusPerUnit: number };

export interface UpgradeCondition {
  /** Minimum units owned of each listed generator. */
  owned?: Partial<Record<GeneratorId, number>>;
  /** Minimum Light earned during the current Season. */
  totalLight?: number;
}

export interface UpgradeDef {
  id: UpgradeId;
  cost: number;
  condition: UpgradeCondition;
  effect: UpgradeEffect;
}

/** Synergies unlock when both generators reach this many units (§5.3). */
export const SYNERGY_OWNED = 15;
/** Synergy cost, in base costs of the more expensive of the two generators (§5.3). */
export const SYNERGY_COST_FACTOR = 10_000;

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
    id: 'gloves',
    cost: 100,
    condition: { totalLight: 1_000 },
    effect: { kind: 'clickMultiplier', factor: 2 },
  },
  {
    id: 'copperCan',
    cost: 10_000,
    condition: { totalLight: 100_000 },
    effect: { kind: 'clickMultiplier', factor: 2 },
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
  return {
    id,
    cost:
      SYNERGY_COST_FACTOR * Math.max(GENERATORS[generator].baseCost, GENERATORS[source].baseCost),
    condition: { owned: { [generator]: SYNERGY_OWNED, [source]: SYNERGY_OWNED } },
    effect: { kind: 'synergy', generator, source, bonusPerUnit },
  };
}

const SYNERGIES: UpgradeDef[] = [
  synergy('sharedCompost', 'rooftopGarden', 'greenhouse', 0.05),
  synergy('usefulShade', 'urbanCanopy', 'balconyPanel', 0.01),
  synergy('recoveredHeat', 'greenhouse', 'mirrorPlant', 0.02),
];

export const UPGRADE_LIST: readonly UpgradeDef[] = [
  ...generatorUpgrades(),
  ...CLICK_UPGRADES,
  ...SYNERGIES,
];

export const UPGRADES = Object.fromEntries(UPGRADE_LIST.map((u) => [u.id, u])) as Record<
  UpgradeId,
  UpgradeDef
>;

export function isUpgradeId(value: unknown): value is UpgradeId {
  return typeof value === 'string' && Object.hasOwn(UPGRADES, value);
}
