// Generator data (docs/game-design.md §4). Adding a generator only means adding a row here
// and its texts in src/i18n; the game logic reads everything from this table.

export const GENERATOR_IDS = [
  'pot',
  'balconyPanel',
  'rooftopGarden',
  'greenhouse',
  'verticalFarm',
  'mirrorPlant',
  'urbanCanopy',
  'arcology',
] as const;

export type GeneratorId = (typeof GENERATOR_IDS)[number];

export interface GeneratorDef {
  id: GeneratorId;
  /** Light cost of the first unit. */
  baseCost: number;
  /** Light per second produced by one unit, before multipliers. */
  baseProduction: number;
}

/** Each extra unit costs 15% more than the previous one. */
export const COST_GROWTH = 1.15;

export const GENERATORS: Record<GeneratorId, GeneratorDef> = {
  pot: { id: 'pot', baseCost: 15, baseProduction: 0.1 },
  balconyPanel: { id: 'balconyPanel', baseCost: 100, baseProduction: 1 },
  rooftopGarden: { id: 'rooftopGarden', baseCost: 400, baseProduction: 8 },
  greenhouse: { id: 'greenhouse', baseCost: 6_000, baseProduction: 30 },
  verticalFarm: { id: 'verticalFarm', baseCost: 200_000, baseProduction: 260 },
  mirrorPlant: { id: 'mirrorPlant', baseCost: 3_000_000, baseProduction: 1_400 },
  urbanCanopy: { id: 'urbanCanopy', baseCost: 28_000_000, baseProduction: 7_800 },
  arcology: { id: 'arcology', baseCost: 200_000_000, baseProduction: 44_000 },
};
