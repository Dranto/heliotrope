import { render } from '@testing-library/react';
import { Pond } from './BioregionArt';
import { PONDS } from './bioregionMap';

describe('the retention ponds', () => {
  it('have deep water, notched lily pads and one water lily each, not all alike', () => {
    const { container } = render(
      <svg>
        {PONDS.map((pond) => (
          <Pond key={`${pond.x},${pond.y}`} {...pond} />
        ))}
      </svg>,
    );
    const ponds = [...container.querySelectorAll('[data-pond]')];
    expect(ponds).toHaveLength(PONDS.length);
    for (const pond of ponds) {
      expect(pond.querySelectorAll('.pond-deep')).toHaveLength(1);
      expect(pond.querySelectorAll('path.lily')).toHaveLength(3);
      expect(pond.querySelectorAll('.lily-flower')).toHaveLength(1);
    }
    const pinks = container.querySelectorAll('.lily-flower.pink').length;
    expect(pinks).toBeGreaterThan(0);
    expect(pinks).toBeLessThan(PONDS.length);
    const firstPads = new Set(ponds.map((p) => p.querySelector('path.lily')?.getAttribute('d')));
    expect(firstPads.size).toBe(PONDS.length);
  });
});
