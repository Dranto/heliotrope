// The guided first minute (docs/game-design.md §10.6, M17): no text, only a golden halo that
// breathes on the next gesture to make, the flower, then the first building, then the first
// upgrade. It only ever shows in the very first Season and goes away for good once the three
// gestures are made.
import { GENERATOR_IDS, type GeneratorId } from './generators';
import { availableUpgrades } from './production';
import type { GameState } from './state';
import { canBuyGenerator, canBuyUpgrade } from './tick';
import type { UpgradeId } from './upgrades';

export type GuideStep =
  | { kind: 'flower' }
  | { kind: 'building'; generator: GeneratorId }
  | { kind: 'upgrade'; upgrade: UpgradeId };

function hasBuilt(state: GameState): boolean {
  return GENERATOR_IDS.some((id) => state.generators[id] > 0);
}

/**
 * The gesture the halo points at, or null when there is none to show: after the first Season,
 * once the first upgrade is bought, or while the next gesture cannot be made yet.
 */
export function guideStep(state: GameState): GuideStep | null {
  if (state.seasons > 0 || state.cycles > 0 || state.upgrades.length > 0) return null;
  if (state.clicks === 0) return { kind: 'flower' };
  if (!hasBuilt(state)) {
    return canBuyGenerator(state, 'pot') ? { kind: 'building', generator: 'pot' } : null;
  }
  const upgrade = availableUpgrades(state).find((u) => canBuyUpgrade(state, u.id));
  return upgrade ? { kind: 'upgrade', upgrade: upgrade.id } : null;
}
