import { render } from '@testing-library/react';
import { ProjectMarks } from './RestorationArt';

describe('the courtyard beehives', () => {
  it('stand in relief with a lid, a landing board and an entrance each, among golden bees', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['beehives']} />
      </svg>,
    );
    for (const part of ['.hive', '.hive-shadow', '.hive-lid', '.hive-board', '.hive-entrance']) {
      expect(container.querySelectorAll(part)).toHaveLength(2);
    }
    const bees = container.querySelectorAll('.bee');
    expect(bees.length).toBeGreaterThan(0);
    // Each bee has a body and two wings, so it reads as a bee rather than a dark dot.
    for (const bee of bees) {
      expect(bee.querySelectorAll('.bee-body')).toHaveLength(1);
      expect(bee.querySelectorAll('.bee-wing')).toHaveLength(2);
    }
  });
});
