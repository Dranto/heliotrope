import { render } from '@testing-library/react';
import { CLICK_UPGRADE_IDS, UPGRADES } from '../game/upgrades';
import { UpgradeIcon, upgradeFamily } from './UpgradeIcon';

function paths(id: keyof typeof UPGRADES): string[] {
  const { container } = render(<UpgradeIcon upgrade={UPGRADES[id]} />);
  return [...container.querySelectorAll('path')].map((p) => p.getAttribute('d') ?? '');
}

describe('UpgradeIcon', () => {
  it('draws a building synergy as its building with the feeding one in a badge', () => {
    const [main, source] = paths('sunnyPots');
    const pot = paths('pot.1')[0];
    const panel = paths('balconyPanel.1')[0];
    expect(main).toBe(pot);
    expect(source).toBe(panel);
  });

  it('gives two synergies of the same building different icons', () => {
    expect(paths('sunnyPots')).not.toEqual(paths('wiredRoofs'));
  });

  it('tints a tile after the building it boosts, the click, or a shared synergy', () => {
    expect(upgradeFamily(UPGRADES['pot.1'])).toBe('pot');
    expect(upgradeFamily(UPGRADES.sunnyPots)).toBe('pot');
    expect(upgradeFamily(UPGRADES.tendedPots)).toBe('pot');
    expect(upgradeFamily(UPGRADES.sharedKnowledge)).toBe('synergy');
    expect(upgradeFamily(UPGRADES[CLICK_UPGRADE_IDS[0]])).toBe('click');
  });
});
