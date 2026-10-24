import { render } from '@testing-library/react';
import { FieldArt } from './BioregionArt';

const draw = (crop: number, angle = 0) =>
  render(
    <svg>
      <FieldArt field={{ box: [0, 0, 140, 100], crop, angle }} />
    </svg>,
  ).container;

describe('FieldArt', () => {
  it('runs two pairs of tramlines along the rows of a wheat field only', () => {
    const wheat = draw(0);
    const tracks = [...wheat.querySelectorAll('.tramline')].map((p) => p.getAttribute('d'));
    expect(tracks).toHaveLength(4);
    expect(tracks.every((d) => d?.includes('H'))).toBe(true);
    const turned = [...draw(0, 90).querySelectorAll('.tramline')];
    expect(turned.every((p) => p.getAttribute('d')?.includes('V'))).toBe(true);
    expect(draw(1).querySelectorAll('.tramline')).toHaveLength(0);
  });

  it('leaves a strip of wild flowers along an edge of every field', () => {
    for (const crop of [0, 1, 2]) {
      const field = draw(crop);
      expect(field.querySelectorAll('.field-margin')).toHaveLength(1);
      expect(field.querySelectorAll('.poppy').length).toBeGreaterThan(2);
      expect(field.querySelectorAll('.cornflower').length).toBeGreaterThan(2);
      expect(field.querySelectorAll('.chamomile').length).toBeGreaterThan(0);
    }
  });
});
