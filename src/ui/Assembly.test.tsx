import { render } from '@testing-library/react';
import { ProjectMarks } from './RestorationArt';

describe('the neighbourhood assembly', () => {
  it('sets ten curved benches around the tree, each with a cushion', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['assembly']} />
      </svg>,
    );
    for (const part of [
      '.assembly-back',
      '.assembly-seat',
      '.assembly-plank',
      '.assembly-cushion',
    ]) {
      expect(container.querySelectorAll(part)).toHaveLength(10);
    }
    expect(container.querySelectorAll('.assembly-shadow')).toHaveLength(1);
    // Cushions take the palette's gold, lilac and sage in turn.
    expect(container.querySelectorAll('.assembly-cushion.c1')).toHaveLength(3);
  });
});
