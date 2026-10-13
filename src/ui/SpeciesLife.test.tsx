import { fireEvent, render, screen } from '@testing-library/react';
import { SpeciesLife } from './SpeciesLife';

describe('SpeciesLife greeting', () => {
  it('gives a species that can be greeted a hit disc of at least the given radius', () => {
    const onGreet = vi.fn();
    const { container } = render(
      <svg>
        <SpeciesLife
          species={['ladybird', 'hedgehog']}
          greetable="ladybird"
          onGreet={onGreet}
          hitRadius={40}
        />
      </svg>,
    );
    expect(container.querySelectorAll('.species-hit')).toHaveLength(1);
    const hit = container.querySelector('.species-hit')!;
    expect(Number(hit.getAttribute('r'))).toBe(40);
    fireEvent.click(hit);
    expect(onGreet).toHaveBeenCalledWith('ladybird');
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
