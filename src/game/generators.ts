// Generator data (docs/game-design.md §4). Adding a generator only means adding a row here
// and its texts in src/i18n; the game logic reads everything from this table.
// Milestone 1 ships generators 1 to 4; the other four arrive with milestone 2.

export const GENERATOR_IDS = ['pot', 'balconyPanel', 'rooftopGarden', 'greenhouse'] as const;

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
  rooftopGarden: { id: 'rooftopGarden', baseCost: 1_100, baseProduction: 8 },
  greenhouse: { id: 'greenhouse', baseCost: 12_000, baseProduction: 47 },
};
