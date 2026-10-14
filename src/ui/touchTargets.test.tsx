import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { GameStore } from '../game/store';
import { App } from './App';
import { GameStoreContext } from './useGame';

/** Style rules that apply on a touch screen, as the browser parses the real stylesheets. */
function coarseRules(): CSSStyleRule[] {
  const style = document.createElement('style');
  style.textContent = ['./App.css', './decor.css']
    .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'))
    .join('\n');
  document.head.append(style);
  const list = [...style.sheet!.cssRules].flatMap((rule) =>
    rule instanceof CSSMediaRule && rule.conditionText.includes('pointer: coarse')
      ? [...rule.cssRules]
      : [],
  );
  style.remove();
  return list.filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);
}

/** The least size a rule gives on a touch screen, in rem (0 when none). */
function least(rules: CSSStyleRule[], element: Element, property: string): number {
  return Math.max(
    0,
    ...rules
      .filter((rule) => element.matches(rule.selectorText))
      .map((rule) => parseFloat(rule.style.getPropertyValue(property)) || 0),
  );
}

/**
 * §10.3: touch targets are at least 44 px (2.75rem). The map's view switch and its decor and
 * photo buttons, used all game long on phones, were 30 to 35 px tall. Layout is not computed
 * here, so the test reads the stylesheets.
 */
describe('the map caption on a touch screen', () => {
  beforeEach(() => localStorage.clear());

  it('gives the photo button and each view a full touch target', () => {
    render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <App />
      </GameStoreContext.Provider>,
    );
    const rules = coarseRules();
    const photo = screen.getByRole('button', { name: 'Photo' });
    expect(photo).toHaveClass('scene-tool');
    expect(least(rules, photo, 'min-height')).toBeGreaterThanOrEqual(2.75);

    // A view button, as the scene draws it once a second view opens.
    const scene = document.createElement('div');
    scene.className = 'scene';
    scene.innerHTML = '<div class="segmented views"><button type="button">Ville</button></div>';
    const view = scene.querySelector('button')!;
    expect(least(rules, view, 'min-height')).toBeGreaterThanOrEqual(2.75);
    expect(least(rules, view, 'min-width')).toBeGreaterThanOrEqual(2.75);
  });
});
