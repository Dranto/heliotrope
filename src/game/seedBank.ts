// The seed bank of the courtyard garden (docs/game-design.md §9.7, M14): the crops and the
// varieties two of them can give, each with a lasting bonus. Data only, so the bonus formulas
// (bonuses.ts) can read it without depending on the garden logic.
import type { Bonus } from './bonuses';

export const CROP_IDS = ['radish', 'sunflower', 'beans', 'squash'] as const;
export type CropId = (typeof CROP_IDS)[number];

export const VARIETY_IDS = [
  'flameRadish',
  'blackRadish',
  'goldenTurnip',
  'purpleBean',
  'redSunflower',
  'threeSisters',
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
};

export function isVarietyId(value: unknown): value is VarietyId {
  return typeof value === 'string' && Object.hasOwn(VARIETIES, value);
}

/** Bonuses of the varieties in the seed bank. */
export function varietyBonuses(varieties: readonly VarietyId[]): Bonus[] {
  return varieties.flatMap((id) => VARIETIES[id].bonuses);
}
