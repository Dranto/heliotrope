import { render } from '@testing-library/react';
import { ProjectMarks } from './RestorationArt';

describe('the compost bins', () => {
  it('ripen from fresh greens to dark soil with a seedling, each bin in relief', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['compost']} />
      </svg>,
    );
    const bins = container.querySelectorAll('.compost');
    expect(bins).toHaveLength(3);
    expect(container.querySelectorAll('.compost-shadow')).toHaveLength(bins.length);
    expect(container.querySelectorAll('.compost-lid')).toHaveLength(bins.length);
    expect([0, 1, 2].map((i) => container.querySelectorAll(`.compost-heap-${i}`).length)).toEqual([
      1, 1, 1,
    ]);
    expect(container.querySelectorAll('.compost-greens').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.compost-sprout')).toHaveLength(1);
  });
});
