// The seed bank of the courtyard garden (docs/game-design.md §9.7, M14): the crops and the
// varieties two of them can give, each with a lasting bonus. Data only, so the bonus formulas
// (bonuses.ts) can read it without depending on the garden logic.
import type { Bonus } from './bonuses';

export const CROP_IDS = ['radish', 'sunflower', 'beans', 'squash', 'strawberry'] as const;
export type CropId = (typeof CROP_IDS)[number];

export const VARIETY_IDS = [
  'flameRadish',
  'blackRadish',
  'goldenTurnip',
  'purpleBean',
  'redSunflower',
  'threeSisters',
  'woodStrawberry',
  'gariguette',
  'maraDesBois',
  'pineberry',
] as const;
export type VarietyId = (typeof VARIETY_IDS)[number];

export interface VarietyDef {
  id: VarietyId;
  /** The two crops that, grown side by side, can give it. */
  parents: readonly [CropId, CropId];
  bonuses: readonly Bonus[];
}

export const VARIETIES: Record<VarietyId, VarietyDef> = {
  flameRadish: {
    id: 'flameRadish',
    parents: ['radish', 'sunflower'],
    bonuses: [{ kind: 'clickMultiplier', factor: 1.5 }],
  },
  blackRadish: {
    id: 'blackRadish',
    parents: ['radish', 'beans'],
    bonuses: [{ kind: 'generatorMultiplier', generator: 'pot', factor: 1.5 }],
  },
  goldenTurnip: {
    id: 'goldenTurnip',
    parents: ['radish', 'squash'],
    bonuses: [{ kind: 'generatorMultiplier', generator: 'rooftopGarden', factor: 1.5 }],
  },
  purpleBean: {
    id: 'purpleBean',
    parents: ['sunflower', 'beans'],
    bonuses: [{ kind: 'generatorMultiplier', generator: 'greenhouse', factor: 1.5 }],
  },
  redSunflower: {
    id: 'redSunflower',
    parents: ['sunflower', 'squash'],
    bonuses: [{ kind: 'butterflyInterval', factor: 0.95 }],
  },
  threeSisters: {
    id: 'threeSisters',
    parents: ['beans', 'squash'],
    bonuses: [{ kind: 'biodiversityFactor', factor: 1.25 }],
  },
  // The strawberries' varieties (M32), each tied to a system of the later milestones.
  woodStrawberry: {
    id: 'woodStrawberry',
    parents: ['radish', 'strawberry'],
    bonuses: [{ kind: 'pollenFill', factor: 1.2 }],
  },
  gariguette: {
    id: 'gariguette',
    parents: ['sunflower', 'strawberry'],
    bonuses: [{ kind: 'harvestFactor', factor: 1.25 }],
  },
  maraDesBois: {
    id: 'maraDesBois',
    parents: ['beans', 'strawberry'],
    bonuses: [{ kind: 'effectDuration', effect: 'beans', factor: 1.25 }],
  },
  pineberry: {
    id: 'pineberry',
    parents: ['squash', 'strawberry'],
    bonuses: [{ kind: 'gardenGrowth', factor: 1.1 }],
  },
};

export function isVarietyId(value: unknown): value is VarietyId {
  return typeof value === 'string' && Object.hasOwn(VARIETIES, value);
}

/** Bonuses of the varieties in the seed bank. */
export function varietyBonuses(varieties: readonly VarietyId[]): Bonus[] {
  return varieties.flatMap((id) => VARIETIES[id].bonuses);
}
