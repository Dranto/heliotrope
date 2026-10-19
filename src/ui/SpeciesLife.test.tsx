import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
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

  // A flying species (here the brimstone) has no halo, and at the city zoom every species is a few
  // pixels wide: the focus ring goes on the hit disc, which stays thumb-sized on screen.
  it('rings the hit disc of the focused species, flying ones included', () => {
    const { container } = render(
      <svg>
        <SpeciesLife species={['brimstone']} greetable="brimstone" onGreet={() => {}} />
      </svg>,
    );
    screen.getByRole('button', { name: /Citron/ });
    expect(container.querySelector('.species-halo')).toBeNull();
    const hit = container.querySelector('.species-hit')!;
    // A file name in a variable: Vite would turn a literal one into an asset address.
    const file = './species.css';
    const style = document.createElement('style');
    style.textContent = readFileSync(new URL(file, import.meta.url), 'utf8');
    document.head.append(style);
    const ring = [...style.sheet!.cssRules].find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule &&
        rule.selectorText.includes(':focus-visible') &&
        hit.matches(rule.selectorText.replace(':focus-visible', '')),
    );
    style.remove();
    expect(ring?.style.getPropertyValue('stroke')).not.toBe('');
    expect(ring?.style.getPropertyValue('vector-effect')).toBe('non-scaling-stroke');
  });
});
