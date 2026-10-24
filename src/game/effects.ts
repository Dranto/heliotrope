// Temporary effects of the Golden Butterfly, the visits and the garden's beans (docs/game-design.md §9.2, §9.6). Data only, so the
// production formulas can read them without depending on the butterfly logic.

export const EFFECT_KINDS = [
  'bloom',
  'pollination',
  'shower',
  'birds',
  'beans',
  'grazing',
  'festival',
  'fireflies',
  'fleaMarket',
  'flight',
] as const;
/** The save keeps only effects whose kind is listed above, so the type is read from the list. */
export type EffectKind = (typeof EFFECT_KINDS)[number];

export interface ActiveEffect {
  kind: EffectKind;
  /** Seconds of play left before the effect ends. */
  remaining: number;
}

/**
 * Floraison: production ×3 for 60 s. Pollinisation: click value ×100 for 10 s. Averse d'été:
 * rooftop gardens, greenhouses and Water ×2 for 60 s. Nuée de migrateurs: biodiversity ×2 for
 * 90 s, plus 10 s per species of the Herbier (§9.6). Haricots grimpants (courtyard garden, §9.7):
 * rooftop gardens and greenhouses ×2 for 20 min. The visits of the city (§9.6, M18): the
 * transhumance makes the balcony panels ×3 for 60 s, the harvest festival the Golden Butterfly's
 * harvest ×2 for 120 s, the fireflies the click ×3 for 60 s, the solar flea market halves the
 * price of the most expensive building owned for 60 s. The pollen's flight (§5.6, M27): every
 * building ×1.5 for 10 s.
 */
export const EFFECTS: Record<EffectKind, { factor: number; seconds: number }> = {
  bloom: { factor: 3, seconds: 60 },
  pollination: { factor: 100, seconds: 10 },
  shower: { factor: 2, seconds: 60 },
  birds: { factor: 2, seconds: 90 },
  beans: { factor: 2, seconds: 20 * 60 },
  grazing: { factor: 3, seconds: 60 },
  festival: { factor: 2, seconds: 120 },
  fireflies: { factor: 3, seconds: 60 },
  fleaMarket: { factor: 0.5, seconds: 60 },
  flight: { factor: 1.5, seconds: 10 },
};

/** Extra seconds of the Nuée de migrateurs per species of the Herbier (§9.6). */
export const BIRDS_SECONDS_PER_SPECIES = 10;

/** Factor of one kind of effect while it is active, 1 otherwise. */
export function effectFactor(effects: readonly ActiveEffect[], kind: EffectKind): number {
  return effects.some((effect) => effect.kind === kind) ? EFFECTS[kind].factor : 1;
}

/**
 * The bouquet (§5.7, M31): each effect running beside the first adds BOUQUET_STEP to every
 * building's production, up to BOUQUET_MAX, so the player who makes the butterfly, the flight,
 * the visits and the helping hands meet is rewarded. It never takes anything away.
 */
export const BOUQUET_STEP = 0.1;
export const BOUQUET_MAX = 0.5;

/** Kinds of effect running at once. */
export function bouquetSize(effects: readonly ActiveEffect[]): number {
  return new Set(effects.map((effect) => effect.kind)).size;
}

/** Production bonus of the bouquet: 0 with fewer than two effects running. */
export function bouquetBonus(effects: readonly ActiveEffect[]): number {
  return Math.min(BOUQUET_MAX, BOUQUET_STEP * Math.max(0, bouquetSize(effects) - 1));
}
