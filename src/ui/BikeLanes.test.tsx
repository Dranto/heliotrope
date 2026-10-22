import { render } from '@testing-library/react';
import { ProjectMarks } from './RestorationArt';

describe('the cycle lanes', () => {
  it('paint a green band, a dashed edge and bicycles at both kerbs of the four avenues', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['bikeLanes']} />
      </svg>,
    );
    expect(container.querySelectorAll('.bike-lane')).toHaveLength(8);
    expect(container.querySelectorAll('.bike-lane-edge')).toHaveLength(8);
    expect(container.querySelectorAll('.bike-glyph').length).toBeGreaterThanOrEqual(8);
  });

  it('lie under the market stalls whatever the order they were built in', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['market', 'bikeLanes']} />
      </svg>,
    );
    const order = [...container.querySelectorAll('[data-project]')].map((g) =>
      g.getAttribute('data-project'),
    );
    expect(order).toEqual(['bikeLanes', 'market']);
  });
});
