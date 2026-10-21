import { render } from '@testing-library/react';
import { ProjectMarks } from './RestorationArt';

describe('the seed swap table', () => {
  it('stands in relief with a runner, a jar and four packets printed with their flower', () => {
    const { container } = render(
      <svg>
        <ProjectMarks projects={['seedSwap']} />
      </svg>,
    );
    expect(container.querySelectorAll('.table')).toHaveLength(1);
    expect(container.querySelectorAll('.table-shadow')).toHaveLength(1);
    expect(container.querySelectorAll('.swap-cloth')).toHaveLength(1);
    expect(container.querySelectorAll('.swap-jar')).toHaveLength(1);
    const packets = container.querySelectorAll('.swap-packet');
    expect(packets).toHaveLength(4);
    // Each packet shows a different flower, outlined so the white one reads on paper.
    const blooms = [...container.querySelectorAll('.swap-bloom')];
    expect(blooms).toHaveLength(packets.length);
    expect(new Set(blooms.map((b) => b.getAttribute('class'))).size).toBe(packets.length);
  });
});
