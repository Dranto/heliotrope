import { render } from '@testing-library/react';
import type { SeasonCurve } from '../game/history';
import { ProductionCurve } from './ProductionCurve';

const curve = (season: number, points: number[]): SeasonCurve => ({ season, step: 30, points });

function lines() {
  return [...document.querySelectorAll<SVGPolylineElement>('.curve-line')].map((line) => ({
    current: line.getAttribute('data-current'),
    opacity: Number(line.style.opacity),
  }));
}

describe('the production curve', () => {
  it('draws the current Season dark and fades the others step by step', () => {
    render(
      <ProductionCurve
        curves={[curve(3, [1, 10, 100]), curve(4, [1, 20, 200]), curve(5, [2, 40, 400])]}
      />,
    );
    const drawn = lines();
    expect(drawn.map((l) => l.current)).toEqual(['false', 'false', 'true']);
    expect(drawn[2]!.opacity).toBe(1);
    expect(drawn[1]!.opacity).toBeGreaterThan(drawn[0]!.opacity);
    expect(drawn[1]!.opacity).toBeLessThan(1);
  });

  it('leads with the last finished Season while the new one has no line yet', () => {
    render(
      <ProductionCurve curves={[curve(8, [1, 10, 100]), curve(9, [1, 20, 200]), curve(10, [5])]} />,
    );
    const drawn = lines();
    expect(drawn).toHaveLength(2);
    expect(drawn[1]).toEqual({ current: 'true', opacity: 1 });
    expect(document.querySelector('.curve-legend span[data-current="true"]')?.textContent).toMatch(
      /9/,
    );
  });
});
