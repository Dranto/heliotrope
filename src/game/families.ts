// The families of the Herbier (docs/game-design.md §9.15, M35): species group into families the
// game already shows, and a family whose species are all back gives a bonus tied to its world.
// Data only, so the bonus formulas can read it.
import type { Bonus } from './bonuses';
import type { SpeciesId } from './species';

export const FAMILY_IDS = ['pollinators', 'birds', 'river', 'night', 'weather'] as const;
export type FamilyId = (typeof FAMILY_IDS)[number];

export const FAMILIES: Record<FamilyId, readonly SpeciesId[]> = {
  pollinators: ['bee', 'bumblebee', 'brimstone', 'ladybird'],
  birds: ['sparrow', 'blueTit', 'robin', 'swift', 'skylark', 'swallow', 'redstart'],
  river: ['frog', 'kingfisher', 'newt', 'dragonfly', 'otter', 'salmon', 'blackStork'],
  night: ['hedgehog', 'glowWorm', 'bat', 'owl'],
  weather: ['snail', 'wallLizard', 'kestrel', 'salamander', 'cicada'],
};

/**
 * What a complete family gives: the pollinators the pollen gauge, the birds the Flock of
 * migrating birds, the river the Water, the night the fireflies, the weather's species the
 * biodiversity.
 */
export const FAMILY_BONUSES: Record<FamilyId, readonly Bonus[]> = {
  pollinators: [{ kind: 'pollenFill', factor: 1.15 }],
  birds: [{ kind: 'effectDuration', effect: 'birds', factor: 1.25 }],
  river: [{ kind: 'water', factor: 1.1 }],
  night: [{ kind: 'effectDuration', effect: 'fireflies', factor: 1.25 }],
  weather: [{ kind: 'biodiversityFactor', factor: 1.1 }],
};

export function familyOf(id: SpeciesId): FamilyId | null {
  return FAMILY_IDS.find((family) => FAMILIES[family].includes(id)) ?? null;
}

export function familyProgress(species: readonly SpeciesId[], family: FamilyId): number {
  return FAMILIES[family].filter((id) => species.includes(id)).length;
}

export function isFamilyComplete(species: readonly SpeciesId[], family: FamilyId): boolean {
  return familyProgress(species, family) === FAMILIES[family].length;
}

export function completeFamilies(species: readonly SpeciesId[]): FamilyId[] {
  return FAMILY_IDS.filter((family) => isFamilyComplete(species, family));
}

export function familyBonuses(species: readonly SpeciesId[]): Bonus[] {
  return completeFamilies(species).flatMap((family) => FAMILY_BONUSES[family]);
}
