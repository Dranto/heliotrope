import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { GameStore } from '../game/store';
import { App } from './App';
import { GameStoreContext } from './useGame';

/** Style rules of the real stylesheets, as the browser parses them. */
function rules(): CSSStyleRule[] {
  const style = document.createElement('style');
  style.textContent = ['./App.css', './restoration.css']
    .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'))
    .join('\n');
  document.head.append(style);
  const list = [...style.sheet!.cssRules].flatMap((rule) =>
    rule instanceof CSSMediaRule ? [...rule.cssRules] : [rule],
  );
  style.remove();
  return list.filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);
}

/**
 * Regression: a rule meant for the map's overlays (light, clouds, pollen) also matched the
 * flower's own drawing inside the map, so the heliotrope stopped catching clicks in a browser.
 * Tests that fire clicks directly cannot see it, so this one reads the stylesheets.
 */
describe('the heliotrope in the map', () => {
  beforeEach(() => localStorage.clear());

  it('is never matched by a rule that lets the pointer through', () => {
    render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <App />
      </GameStoreContext.Provider>,
    );
    const plant = [
      document.querySelector('.map-flower .flower-hit')!,
      document.querySelector('.map-flower .flower-sway')!,
    ];
    const sky = document.querySelector('.scene-map > svg > .sky')!;
    const passThrough = rules().filter(
      (rule) => rule.style.getPropertyValue('pointer-events') === 'none',
    );
    for (const element of plant) {
      const culprits = passThrough.filter((rule) => element.matches(rule.selectorText));
      expect(culprits.map((rule) => rule.selectorText)).toEqual([]);
    }
    // The overlays over the map still let clicks reach the parcels on offer.
    expect(passThrough.some((rule) => sky.matches(rule.selectorText))).toBe(true);
  });
});
