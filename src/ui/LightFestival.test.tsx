import { render } from '@testing-library/react';
import { ProjectMarks } from './RestorationArt';

describe('the festival of lights', () => {
  it('strings ten paper lanterns down each of the four streets, in three colours', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['lightFestival']} />
      </svg>,
    );
    expect(container.querySelectorAll('.lantern-cord')).toHaveLength(4);
    for (const part of ['.lantern', '.lantern-pool', '.lantern-paper', '.lantern-cap']) {
      expect(container.querySelectorAll(part)).toHaveLength(40);
    }
    for (const colour of ['c0', 'c1', 'c2']) {
      expect(container.querySelectorAll(`.lantern.${colour}`).length).toBeGreaterThan(0);
    }
  });
});
