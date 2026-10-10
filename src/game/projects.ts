// Neighbourhood projects (docs/game-design.md §6.2): one-off decisions of the neighbourhood that
// change a rule rather than multiply a number. Carried out again each Season, like upgrades.
// Names live in src/i18n, their mark on the map in src/ui.
import type { Bonus } from './bonuses';
import type { GeneratorId } from './generators';
import type { ParcelId } from './parcels';
import type { Phase } from './phases';

export const PROJECT_IDS = [
  'seedSwap',
  'toolLibrary',
  'compost',
  'sharedBatteries',
  'beehives',
  'festival',
  'bikeLanes',
  'market',
  'repairCafe',
  'rainwater',
  'butterflyGarden',
  'solarCanopy',
  'tram',
  'assembly',
  'lightFestival',
] as const;
export type ProjectId = (typeof PROJECT_IDS)[number];

export interface ProjectCondition {
  /** Minimum units owned of each listed generator, this Season. */
  owned?: Partial<Record<GeneratorId, number>>;
  /** Minimum phase this Season. */
  phase?: Phase;
  /** Parcels that must be restored. */
  parcels?: readonly ParcelId[];
  /** Minimum number of restored parcels. */
  parcelCount?: number;
}

export interface ProjectDef {
  id: ProjectId;
  cost: number;
  condition: ProjectCondition;
  bonuses: readonly Bonus[];
}

export const PROJECT_LIST: readonly ProjectDef[] = [
  {
    id: 'seedSwap',
    cost: 250,
    condition: { owned: { pot: 5 } },
    bonuses: [{ kind: 'clickPerUnit', generator: 'pot', amount: 0.2 }],
  },
  {
    id: 'toolLibrary',
    cost: 2_000,
    condition: { owned: { balconyPanel: 5 } },
    bonuses: [{ kind: 'discount', fraction: 0.1 }],
  },
  {
    id: 'compost',
    cost: 20_000,
    condition: { owned: { rooftopGarden: 5 } },
    bonuses: [{ kind: 'biodiversityThreshold', threshold: 5 }],
  },
  {
    id: 'sharedBatteries',
    cost: 50_000,
    condition: { owned: { balconyPanel: 25 } },
    bonuses: [{ kind: 'perType', generator: 'balconyPanel', bonus: 0.05 }],
  },
  {
    id: 'beehives',
    cost: 150_000,
    condition: { phase: 2, owned: { greenhouse: 1 } },
    bonuses: [{ kind: 'butterflyInterval', factor: 0.8 }],
  },
  {
    id: 'festival',
    cost: 800_000,
    condition: { owned: { greenhouse: 10 } },
    bonuses: [{ kind: 'effectDuration', effect: 'bloom', factor: 1.5 }],
  },
  {
    id: 'bikeLanes',
    cost: 3e6,
    condition: { owned: { verticalFarm: 1 }, parcelCount: 2 },
    bonuses: [{ kind: 'perParcel', bonus: 0.02 }],
  },
  {
    id: 'market',
    cost: 2e7,
    condition: { owned: { verticalFarm: 10 } },
    bonuses: [{ kind: 'harvestFactor', factor: 2 }],
  },
  {
    id: 'repairCafe',
    cost: 5e7,
    condition: { phase: 3 },
    bonuses: [{ kind: 'discount', fraction: 0.1 }],
  },
  {
    id: 'rainwater',
    cost: 1e8,
    condition: { parcels: ['river'], owned: { verticalFarm: 1 } },
    bonuses: [
      { kind: 'generatorMultiplier', generator: 'greenhouse', factor: 1.25 },
      { kind: 'generatorMultiplier', generator: 'verticalFarm', factor: 1.25 },
    ],
  },
  {
    id: 'butterflyGarden',
    cost: 2e8,
    condition: { parcels: ['pollinatorStrip'], phase: 3 },
    bonuses: [{ kind: 'effectDuration', effect: 'pollination', factor: 2 }],
  },
  {
    id: 'solarCanopy',
    cost: 5e8,
    condition: { owned: { mirrorPlant: 10 } },
    bonuses: [{ kind: 'perType', generator: 'mirrorPlant', bonus: 0.1 }],
  },
  {
    id: 'tram',
    cost: 2e9,
    condition: { owned: { urbanCanopy: 10 } },
    bonuses: [{ kind: 'perAchievement', bonus: 0.005 }],
  },
  {
    id: 'assembly',
    cost: 1e10,
    condition: { parcelCount: 5, phase: 3 },
    bonuses: [{ kind: 'synergyFactor', factor: 1.5 }],
  },
  {
    id: 'lightFestival',
    cost: 3e10,
    condition: { owned: { arcology: 1 } },
    bonuses: [{ kind: 'global', bonus: 0.25 }],
  },
];

export const PROJECTS = Object.fromEntries(PROJECT_LIST.map((p) => [p.id, p])) as Record<
  ProjectId,
  ProjectDef
>;

export function isProjectId(value: unknown): value is ProjectId {
  return typeof value === 'string' && Object.hasOwn(PROJECTS, value);
}
