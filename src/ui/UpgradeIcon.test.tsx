import { render } from '@testing-library/react';
import { UPGRADES } from '../game/upgrades';
import { UpgradeIcon } from './UpgradeIcon';

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
});
