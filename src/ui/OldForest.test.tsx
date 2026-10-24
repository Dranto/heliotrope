import { render } from '@testing-library/react';
import { OldCrown } from './BioregionArt';
import { OLD_FOREST } from './bioregionMap';

describe('the old-growth forest', () => {
  it('mixes oaks, beeches, birches and pines', () => {
    const { container } = render(
      <svg>
        {OLD_FOREST.map((crown) => (
          <OldCrown key={`${crown.x},${crown.y}`} {...crown} />
        ))}
      </svg>,
    );
    const kinds = [...container.querySelectorAll('[data-tree]')].map((g) =>
      g.getAttribute('data-tree'),
    );
    expect(kinds).toHaveLength(OLD_FOREST.length);
    for (const kind of ['oak', 'beech', 'birch', 'pine']) expect(kinds).toContain(kind);
    expect(kinds.filter((k) => k === 'oak').length).toBeGreaterThan(kinds.length / 3);
    expect(container.querySelectorAll('[data-tree="pine"] .pine')).toHaveLength(
      kinds.filter((k) => k === 'pine').length,
    );
  });
});
