import { render } from '@testing-library/react';
import { Roof } from './Neighbourhood';

describe('a roof of the courtyard', () => {
  it('keeps its gravel, seams and parapet under a garden, without the equipment', () => {
    const { container } = render(
      <svg>
        <g data-roof="bare">
          <Roof box={[0, 0, 80, 40]} storeys={4} fill="#ccc" bare />
        </g>
        <g data-roof="grey">
          <Roof box={[0, 0, 80, 40]} storeys={4} fill="#ccc" />
        </g>
      </svg>,
    );
    for (const kind of ['bare', 'grey']) {
      const roof = container.querySelector(`[data-roof="${kind}"]`)!;
      expect(roof.querySelector('[fill="url(#roof-gravel)"]')).not.toBeNull();
      expect(roof.querySelector('.seams')).not.toBeNull();
      expect(roof.querySelector('.parapet')).not.toBeNull();
    }
    expect(container.querySelector('[data-roof="bare"] .vent')).toBeNull();
    expect(container.querySelector('[data-roof="grey"] .vent')).not.toBeNull();
  });
});
