import { render } from '@testing-library/react';
import { ProjectMarks } from './RestorationArt';

describe('the festival', () => {
  it('hangs two strings of pennant bunting in the four bloom colours', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['festival']} />
      </svg>,
    );
    expect(container.querySelectorAll('.garland-string')).toHaveLength(2);
    for (const part of ['.flag', '.flag-cloth', '.flag-shadow', '.flag-light']) {
      expect(container.querySelectorAll(part)).toHaveLength(26);
    }
    for (const colour of ['bloom-lilac', 'bloom-gold', 'bloom-white', 'bloom-rose']) {
      expect(container.querySelectorAll(`.flag-cloth.${colour}`).length).toBeGreaterThan(0);
    }
  });
});
