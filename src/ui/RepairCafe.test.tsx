import { render } from '@testing-library/react';
import { ProjectMarks } from './RestorationArt';

describe('the repair café', () => {
  it('opens four striped parasols with their shadows beside a bicycle under repair', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['repairCafe']} />
      </svg>,
    );
    const parasols = container.querySelectorAll('.parasol');
    expect(parasols).toHaveLength(4);
    expect(container.querySelectorAll('.parasol-shadow')).toHaveLength(4);
    // Panels alternate cream and sage, so each parasol reads as striped cloth.
    expect(container.querySelectorAll('.parasol-panel')).toHaveLength(4 * 8);
    expect(container.querySelectorAll('.parasol-panel.sage')).toHaveLength(4 * 4);
    expect(container.querySelectorAll('.repair-bike .bike-wheel')).toHaveLength(2);
  });
});
