// The fruit trees of the orchard and their old varieties (docs/game-design.md §9.8, M22). Pure
// data, read by the bonus formulas and by the orchard; names live in src/i18n.
import type { Bonus } from './bonuses';

export const FRUIT_IDS = ['apple', 'pear', 'cherry', 'plum'] as const;
export type FruitId = (typeof FRUIT_IDS)[number];

export interface FruitDef {
  id: FruitId;
  /** Baskets of the garden (§9.7) the tree costs to plant; the first one is free. */
  baskets: number;
  /** The old variety the tree can give at a harvest, a bonus kept for good. */
  variety: readonly Bonus[];
}

export const FRUITS: Record<FruitId, FruitDef> = {
  // Reinette apple: the whole city.
  apple: { id: 'apple', baskets: 0, variety: [{ kind: 'global', bonus: 0.05 }] },
  // Curé pear: Water.
  pear: { id: 'pear', baskets: 10, variety: [{ kind: 'water', factor: 1.1 }] },
  // Burlat cherry: the Golden Butterfly.
  cherry: { id: 'cherry', baskets: 20, variety: [{ kind: 'butterflyInterval', factor: 0.95 }] },
  // Reine-claude plum: the garden.
  plum: { id: 'plum', baskets: 40, variety: [{ kind: 'gardenGrowth', factor: 1.1 }] },
};

export function isFruitId(value: unknown): value is FruitId {
  return typeof value === 'string' && Object.hasOwn(FRUITS, value);
}

/** Bonuses of the old varieties found. */
export function fruitVarietyBonuses(varieties: readonly FruitId[]): Bonus[] {
  return varieties.flatMap((id) => FRUITS[id].variety);
}
