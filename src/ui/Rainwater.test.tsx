import { render } from '@testing-library/react';
import { ProjectMarks } from './RestorationArt';

describe('the rainwater tanks', () => {
  it('stand in relief, linked by one pipe, each with a sunlit rim and clear water', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['rainwater']} />
      </svg>,
    );
    expect(container.querySelectorAll('.cistern-pipe')).toHaveLength(1);
    const tanks = container.querySelectorAll('.cistern');
    expect(tanks).toHaveLength(4);
    for (const part of ['.cistern-shadow', '.cistern-light', '.cistern-water', '.cistern-ripple']) {
      expect(container.querySelectorAll(part)).toHaveLength(tanks.length);
    }
  });
});
