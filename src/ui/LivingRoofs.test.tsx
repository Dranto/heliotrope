import { render } from '@testing-library/react';
import { ParcelArt } from './RestorationArt';
import { LIVING_ROOFS } from './restorationMap';

describe('the living roofs', () => {
  it('give each roof a lit parapet, a stepping-stone path and rounded shrubs', () => {
    const { container } = render(
      <svg className="parcels">
        <ParcelArt id="livingRoofs" />
      </svg>,
    );
    expect(container.querySelectorAll('.roof-lip')).toHaveLength(LIVING_ROOFS.length);
    expect(container.querySelectorAll('.roof-lip-shade')).toHaveLength(LIVING_ROOFS.length);
    expect(container.querySelectorAll('.roof-steps')).toHaveLength(LIVING_ROOFS.length);
    const shrubs = container.querySelectorAll('.roof-clump');
    expect(shrubs.length).toBeGreaterThanOrEqual(2 * LIVING_ROOFS.length);
    for (const shrub of shrubs) {
      expect(shrub.querySelector('.roof-clump-shadow')).not.toBeNull();
      expect(shrub.querySelector('.roof-clump-light')).not.toBeNull();
    }
  });
});
