import { render } from '@testing-library/react';
import { ProjectMarks } from './RestorationArt';

describe('the tool library', () => {
  it('is a tiled shed in relief with tools to borrow beside it', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['toolLibrary']} />
      </svg>,
    );
    expect(container.querySelectorAll('.shed')).toHaveLength(1);
    expect(container.querySelectorAll('.shed-shadow')).toHaveLength(1);
    expect(container.querySelectorAll('.shed-shade')).toHaveLength(1);
    expect(container.querySelector('.shed-tiles')).not.toBeNull();
    // A rake and a spade, each on a wooden handle, and a watering can.
    expect(container.querySelectorAll('.tool-handle')).toHaveLength(2);
    expect(container.querySelectorAll('.tool-blade')).toHaveLength(1);
    expect(container.querySelectorAll('.watering-can')).toHaveLength(1);
  });
});
