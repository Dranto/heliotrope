// Parcels of the neighbourhood to restore (docs/game-design.md §6.1). Grey places of the map
// (an avenue, a car park, a warehouse…) restored once for Light; they stay restored from one
// Season to the next. Names live in src/i18n, places and art in src/ui.
import type { Bonus } from './bonuses';
import type { Phase } from './phases';

export const PARCEL_IDS = [
  'gardenStreet',
  'rainGardens',
  'pollinatorStrip',
  'river',
  'park',
  'orchard',
  'livingRoofs',
  'squares',
] as const;
export type ParcelId = (typeof PARCEL_IDS)[number];

export interface ParcelDef {
  id: ParcelId;
  cost: number;
  /** Phase from which the parcel is in view and can be offered. */
  phase: Phase;
  bonuses: readonly Bonus[];
  /**
   * Its second future (§6.5, M16): another drawing and an effect of the same
   * weight, chosen when restoring and changeable once per Cycle of water. Since lot 7 of the
   * slimming plan, the first future serves the Light and the second the Seeds or the Water.
   */
  second: readonly Bonus[];
}

/** The two futures of a parcel: 0 the first one, 1 the second. */
export type Future = 0 | 1;

/** A parcel is offered once the Season has earned this share of its cost (§6.1). */
export const PARCEL_REVEAL_SHARE = 0.5;

export const PARCEL_LIST: readonly ParcelDef[] = [
  {
    id: 'gardenStreet',
    cost: 1_500,
    phase: 1,
    bonuses: [{ kind: 'clickMultiplier', factor: 2 }],
    // The play street: the Season ripens sooner rather than a stronger click.
    second: [{ kind: 'ripening', seconds: 20 }],
  },
  {
    id: 'rainGardens',
    cost: 8_000,
    phase: 1,
    bonuses: [
      { kind: 'generatorMultiplier', generator: 'pot', factor: 2 },
      { kind: 'generatorMultiplier', generator: 'balconyPanel', factor: 1.5 },
      { kind: 'water', factor: 1.25 },
      { kind: 'effectDuration', effect: 'shower', factor: 2 },
    ],
    // The storm pond: the rain kept for the Bioregion.
    second: [
      { kind: 'water', factor: 1.5 },
      { kind: 'effectDuration', effect: 'shower', factor: 2 },
    ],
  },
  {
    id: 'pollinatorStrip',
    cost: 1e5,
    phase: 2,
    bonuses: [
      { kind: 'butterflyInterval', factor: 0.8 },
      { kind: 'visitInterval', factor: 0.8 },
    ],
    // The hedgerow: more visits, and the Seeds ripen sooner.
    second: [
      { kind: 'ripening', seconds: 20 },
      { kind: 'visitInterval', factor: 0.8 },
    ],
  },
  {
    id: 'river',
    cost: 2e6,
    phase: 2,
    bonuses: [
      { kind: 'offlineCap', seconds: 2 * 3600 },
      { kind: 'water', factor: 1.5 },
    ],
    // The bathing river: the Seeds ripen sooner, a shorter absence.
    second: [
      { kind: 'offlineCap', seconds: 3600 },
      { kind: 'ripening', seconds: 30 },
    ],
  },
  {
    id: 'park',
    cost: 3e7,
    phase: 3,
    bonuses: [{ kind: 'global', bonus: 0.1 }],
    // The covered market: the collectors' materials come cheaper.
    second: [{ kind: 'collectorDiscount', fraction: 0.2 }],
  },
  {
    id: 'orchard',
    cost: 3e8,
    phase: 3,
    bonuses: [
      { kind: 'generatorMultiplier', generator: 'rooftopGarden', factor: 1.5 },
      { kind: 'generatorMultiplier', generator: 'greenhouse', factor: 1.5 },
    ],
    // The warehouse glasshouses: seedlings ready sooner.
    second: [{ kind: 'ripening', seconds: 20 }],
  },
  {
    id: 'livingRoofs',
    cost: 3e9,
    phase: 3,
    bonuses: [{ kind: 'biodiversityFactor', factor: 2 }],
    // Kitchen-garden roofs: a little less biodiversity, the roofs gather rain.
    second: [
      { kind: 'biodiversityFactor', factor: 1.5 },
      { kind: 'water', factor: 1.5 },
    ],
  },
  {
    id: 'squares',
    cost: 3e10,
    phase: 3,
    bonuses: [{ kind: 'perAchievement', bonus: 0.01 }],
    // Fountain squares: the sites of the Bioregion cost less Water.
    second: [{ kind: 'siteDiscount', fraction: 0.2 }],
  },
];

export const PARCELS = Object.fromEntries(PARCEL_LIST.map((p) => [p.id, p])) as Record<
  ParcelId,
  ParcelDef
>;

export function isParcelId(value: unknown): value is ParcelId {
  return typeof value === 'string' && Object.hasOwn(PARCELS, value);
}

/** The effect of a parcel in the future chosen for it. */
export function parcelBonuses(id: ParcelId, future: Future = 0): readonly Bonus[] {
  return future === 1 ? PARCELS[id].second : PARCELS[id].bonuses;
}
