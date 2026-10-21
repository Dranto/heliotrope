import { render } from '@testing-library/react';
import { ProjectMarks } from './RestorationArt';

describe('the shared batteries', () => {
  it('stand each cabinet on the shared cable, with a shadow, a lit lid and a charge gauge', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['sharedBatteries']} />
      </svg>,
    );
    const cabinets = container.querySelectorAll('.battery');
    expect(cabinets).toHaveLength(5);
    expect(container.querySelectorAll('.battery-cable')).toHaveLength(1);
    expect(container.querySelectorAll('.battery-shadow')).toHaveLength(cabinets.length);
    expect(container.querySelectorAll('.battery-lid')).toHaveLength(cabinets.length);
    expect(container.querySelectorAll('.battery-shade')).toHaveLength(cabinets.length);
    expect(container.querySelectorAll('.battery-cell')).toHaveLength(3 * cabinets.length);
  });
});
