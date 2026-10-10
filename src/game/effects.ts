// Temporary effects of the Golden Butterfly (docs/game-design.md §9.2). Data only, so the
// production formulas can read them without depending on the butterfly logic.

export type EffectKind = 'bloom' | 'pollination';

export interface ActiveEffect {
  kind: EffectKind;
  /** Seconds of play left before the effect ends. */
  remaining: number;
}

/** Floraison: production ×3 for 60 s. Pollinisation: click value ×100 for 10 s. */
export const EFFECTS: Record<EffectKind, { factor: number; seconds: number }> = {
  bloom: { factor: 3, seconds: 60 },
  pollination: { factor: 100, seconds: 10 },
};

/** Factor of one kind of effect while it is active, 1 otherwise. */
export function effectFactor(effects: readonly ActiveEffect[], kind: EffectKind): number {
  return effects.some((effect) => effect.kind === kind) ? EFFECTS[kind].factor : 1;
}
