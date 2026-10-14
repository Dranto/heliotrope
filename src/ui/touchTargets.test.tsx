import { render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { GameStore } from '../game/store';
import { App } from './App';
import { GameStoreContext } from './useGame';

/** Style rules that apply on a touch screen, as the browser parses the real stylesheets. */
function coarseRules(): CSSStyleRule[] {
  const style = document.createElement('style');
  style.textContent = ['./App.css', './decor.css', './restoration.css']
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
describe('the controls used all game long on a touch screen', () => {
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

  it('gives each choice of how many to buy a full touch target', () => {
    render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <App />
      </GameStoreContext.Provider>,
    );
    const rules = coarseRules();
    const amounts = within(
      screen.getByRole('radiogroup', { name: 'Quantité à acheter' }),
    ).getAllByRole('radio');
    expect(amounts).toHaveLength(4);
    for (const amount of amounts) {
      expect(least(rules, amount, 'min-height')).toBeGreaterThanOrEqual(2.75);
    }
  });

  it('lets each panel fold from a full-size title', () => {
    render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <App />
      </GameStoreContext.Provider>,
    );
    const rules = coarseRules();
    const titles = document.querySelectorAll('.panel-title button');
    expect(titles.length).toBeGreaterThan(0);
    for (const title of titles) {
      expect(least(rules, title, 'min-height')).toBeGreaterThanOrEqual(2.75);
    }
  });

  it('gives the buy-all buttons and the parcel futures a full touch target', () => {
    const rules = coarseRules();
    // As the Upgrades and quartier panels and the futures list draw them in later play.
    const panel = document.createElement('div');
    panel.innerHTML = `
      <button type="button" class="buy-all">Tout lancer</button>
      <details class="futures">
        <summary>Les avenirs des parcelles</summary>
        <div class="future-pills" role="radiogroup"><button type="button">Rue jardin</button></div>
      </details>`;
    const [buyAll, summary, pill] = ['.buy-all', '.futures summary', '.future-pills button'].map(
      (selector) => panel.querySelector(selector)!,
    );
    for (const control of [buyAll, summary, pill]) {
      expect(least(rules, control!, 'min-height')).toBeGreaterThanOrEqual(2.75);
    }
  });
});
