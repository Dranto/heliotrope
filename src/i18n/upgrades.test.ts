import { UPGRADE_LIST, UPGRADES } from '../game/upgrades';
import { upgradeEffectText } from './upgrades';

describe('upgrade effect texts in French', () => {
  it('names a building synergy without an adjective that would need to agree with it', () => {
    // "par Serre communautaire possédé" was masculine for a feminine building.
    expect(upgradeEffectText(UPGRADES.sharedCompost)).toBe(
      'Potager sur le toit : +5 % par Serre communautaire',
    );
    for (const upgrade of UPGRADE_LIST.filter((u) => u.effect.kind === 'synergy')) {
      expect(upgradeEffectText(upgrade)).not.toMatch(/possédée?s?$/);
    }
  });
});
