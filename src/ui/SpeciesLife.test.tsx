import { render } from '@testing-library/react';
import { SpeciesLife } from './SpeciesLife';

describe('SpeciesLife', () => {
  it('draws each species back, named, and never takes the pointer', () => {
    const { container } = render(
      <svg>
        <SpeciesLife species={['ladybird', 'brimstone']} />
      </svg>,
    );
    expect(container.querySelectorAll('[data-species]')).toHaveLength(2);
    expect(container.querySelector('[data-species="brimstone"] title')?.textContent).toMatch(
      /Citron/,
    );
    // A flying species has no halo.
    expect(container.querySelectorAll('.species-halo')).toHaveLength(1);
    expect(container.querySelector('[role="button"]')).toBeNull();
  });
});
