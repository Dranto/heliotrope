import { render } from '@testing-library/react';
import { ParcelArt } from './RestorationArt';
import { PARCEL_PLACES } from './restorationMap';

describe('the park on the old car park', () => {
  it('edges its lawn with flowering shrubs and leaves tufts and daisies in the grass', () => {
    const { container } = render(
      <svg className="parcels">
        <ParcelArt id="park" />
      </svg>,
    );
    const [x, y, w, h] = PARCEL_PLACES.park;
    const shrubs = [...container.querySelectorAll('.hedge')];
    expect(shrubs.length).toBe(15);
    for (const shrub of shrubs) {
      const cx = Number(shrub.getAttribute('cx'));
      const cy = Number(shrub.getAttribute('cy'));
      expect(cx).toBeGreaterThan(x);
      expect(cx).toBeLessThan(x + w);
      expect(cy).toBeGreaterThan(y);
      expect(cy).toBeLessThan(y + h);
    }
    expect(container.querySelectorAll('.blossom').length).toBeGreaterThanOrEqual(5);
    expect(container.querySelector('.tuft')).not.toBeNull();
  });
});
