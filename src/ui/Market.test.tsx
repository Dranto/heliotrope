import { render } from '@testing-library/react';
import { ProjectMarks } from './RestorationArt';

describe('the market', () => {
  it('raises five stalls under striped awnings with shadows and a scalloped front', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['market']} />
      </svg>,
    );
    for (const part of ['.awning', '.awning-shadow', '.awning-scallop', '.awning-ridge']) {
      expect(container.querySelectorAll(part)).toHaveLength(5);
    }
    // Stalls alternate terracotta and gold awnings, each clipped to its rounded roof.
    expect(container.querySelectorAll('.awning-scallop.gold')).toHaveLength(2);
    expect(container.querySelectorAll('clipPath')).toHaveLength(5);
  });
});
