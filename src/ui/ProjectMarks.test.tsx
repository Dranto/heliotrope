import { render } from '@testing-library/react';
import { ProjectMarks } from './RestorationArt';

describe('the solar shelters over the avenue', () => {
  it('stand on posts, cast a shadow and carry glass cells', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['solarCanopy']} />
      </svg>,
    );
    const mark = container.querySelector('[data-project="solarCanopy"]')!;
    const panels = mark.querySelectorAll('.canopy-panel');
    expect(panels).toHaveLength(7);
    expect(mark.querySelectorAll('.canopy-shadow')).toHaveLength(7);
    expect(mark.querySelectorAll('.canopy-post')).toHaveLength(14);
    expect(mark.querySelectorAll('.canopy-glint')).toHaveLength(7);
    expect(mark.querySelector('linearGradient#canopy-glass')).not.toBeNull();
  });
});
