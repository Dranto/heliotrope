import { render } from '@testing-library/react';
import { Hills } from './BioregionArt';
import { HILLS } from './bioregionMap';

describe('the Bioregion hills', () => {
  it('carry grass, heather, broom and boulders on their open slopes', () => {
    const { container } = render(
      <svg>
        <Hills />
      </svg>,
    );
    const slopes = [...container.querySelectorAll('.hill-growth')];
    expect(slopes).toHaveLength(HILLS.length);
    const kinds = [...container.querySelectorAll('[data-clump]')].map((el) =>
      el.getAttribute('data-clump'),
    );
    for (const kind of ['tuft', 'heather', 'broom', 'boulder']) expect(kinds).toContain(kind);
    expect(kinds.filter((k) => k === 'tuft').length).toBeGreaterThan(kinds.length / 3);
    const firstKinds = slopes.map((g) =>
      [...g.querySelectorAll('[data-clump]')].map((el) => el.getAttribute('data-clump')).join(),
    );
    expect(new Set(firstKinds).size).toBe(HILLS.length);
  });
});
