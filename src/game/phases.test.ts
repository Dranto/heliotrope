import { PHASE_THRESHOLDS, phaseOf } from './phases';
import { createInitialState } from './state';

const withSeasonLight = (totalLight: number) => ({ ...createInitialState(0), totalLight });

describe('progression phases (§6)', () => {
  it('opens Le Quartier at 10 000 Light earned in the Season and La Ville at 10 million', () => {
    expect(PHASE_THRESHOLDS).toEqual({ 2: 1e4, 3: 1e7 });
    expect(phaseOf(withSeasonLight(0))).toBe(1);
    expect(phaseOf(withSeasonLight(9_999))).toBe(1);
    expect(phaseOf(withSeasonLight(10_000))).toBe(2);
    expect(phaseOf(withSeasonLight(9_999_999))).toBe(2);
    expect(phaseOf(withSeasonLight(10_000_000))).toBe(3);
    expect(phaseOf(withSeasonLight(1e300))).toBe(3);
  });

  it('follows the Light of the current Season, not the all-time total', () => {
    const state = { ...createInitialState(0), totalLight: 50, allTimeLight: 1e12, seasons: 3 };
    expect(phaseOf(state)).toBe(1);
  });
});
