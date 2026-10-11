// Temporary effects of the Golden Butterfly, the visits and the garden's beans (docs/game-design.md §9.2, §9.6). Data only, so the
// production formulas can read them without depending on the butterfly logic.

export type EffectKind =
  | 'bloom'
  | 'pollination'
  | 'shower'
  | 'birds'
  | 'beans'
  | 'grazing'
  | 'festival'
  | 'fireflies'
  | 'fleaMarket';

export const EFFECT_KINDS: readonly EffectKind[] = [
  'bloom',
  'pollination',
  'shower',
  'birds',
  'beans',
  'grazing',
  'festival',
  'fireflies',
  'fleaMarket',
];

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
 * price of the most expensive building owned for 60 s.
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
};

/** Extra seconds of the Nuée de migrateurs per species of the Herbier (§9.6). */
export const BIRDS_SECONDS_PER_SPECIES = 10;

/** Factor of one kind of effect while it is active, 1 otherwise. */
export function effectFactor(effects: readonly ActiveEffect[], kind: EffectKind): number {
  return effects.some((effect) => effect.kind === kind) ? EFFECTS[kind].factor : 1;
}
