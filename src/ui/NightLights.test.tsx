import { render } from '@testing-library/react';
import { NightLights } from './VisitArt';

function draw(daylight: 'day' | 'evening' | 'night') {
  return render(<NightLights daylight={daylight} camera="none" width={800} height={600} />)
    .container;
}

describe('NightLights', () => {
  it('draws nothing by day', () => {
    expect(draw('day').childElementCount).toBe(0);
  });

  it('puts the veil under the lanterns, as two layers of the map', () => {
    const layers = [...draw('night').children];
    expect(layers.map((layer) => layer.getAttribute('class'))).toEqual(['night-veil', 'night']);
    expect(layers[0]!.getAttribute('data-daylight')).toBe('night');
    expect(layers[1]!.querySelectorAll('.night-lantern').length).toBeGreaterThan(0);
  });
});
