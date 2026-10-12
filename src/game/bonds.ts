// The bonds with the neighbouring districts (docs/game-design.md §9.11, M29): every request of a
// restored district served adds a little production, kept for good. Data only, so the bonus
// formulas can read it without depending on the requests' logic.
import type { Bonus } from './bonuses';
import type { DistrictId } from './districts';

/** Production per request served for one district. */
export const BOND_BONUS = 0.01;
/** Requests of one district that still strengthen the bond. */
export const BOND_MAX = 10;

export type Bonds = Partial<Record<DistrictId, number>>;

export function bondBonuses(bonds: Bonds): Bonus[] {
  return Object.values(bonds)
    .filter((served): served is number => typeof served === 'number' && served > 0)
    .map((served) => ({ kind: 'global', bonus: BOND_BONUS * Math.min(BOND_MAX, served) }));
}
