import { render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { GameStore } from '../game/store';
import { App } from './App';
import { GameStoreContext } from './useGame';

const FILE = './App.css';

/** Style rules for Windows high contrast, as the browser parses the real stylesheet. */
function forcedRules(): CSSStyleRule[] {
  const style = document.createElement('style');
  style.textContent = readFileSync(new URL(FILE, import.meta.url), 'utf8');
  document.head.append(style);
  const list = [...style.sheet!.cssRules].flatMap((rule) =>
    rule instanceof CSSMediaRule && rule.conditionText.includes('forced-colors: active')
      ? [...rule.cssRules]
      : [],
  );
  style.remove();
  return list.filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);
}

const styled = (rules: CSSStyleRule[], element: Element, property: string) =>
  rules
    .filter((rule) => element.matches(rule.selectorText))
    .map((rule) => rule.style.getPropertyValue(property).toLowerCase());

/**
 * Windows high contrast replaces the tints that show the chosen quantity, tab or view and the
 * gold of a buy button, which left the choice invisible; system colours mark it again.
 */
describe('choices in high contrast mode', () => {
  beforeEach(() => localStorage.clear());

  it('marks the chosen quantity and tab with the system highlight, and outlines buy buttons', () => {
    render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <App />
      </GameStoreContext.Provider>,
    );
    const rules = forcedRules();
    const amounts = within(screen.getByRole('radiogroup', { name: 'Quantité à acheter' }));
    const chosen = amounts.getByRole('radio', { checked: true });
    expect(styled(rules, chosen, 'background')).toContain('highlight');
    expect(styled(rules, chosen, 'forced-color-adjust')).toContain('none');
    const other = amounts.getAllByRole('radio', { checked: false })[0]!;
    expect(styled(rules, other, 'background')).toEqual([]);

    // The phone tab bar, as the layout draws it once a second tab opens.
    const bar = document.createElement('nav');
    bar.className = 'tabbar';
    bar.innerHTML = '<button type="button" aria-current="page">Bâtir</button>';
    document.body.append(bar);
    const tab = bar.querySelector('button')!;
    expect(styled(rules, tab, 'background')).toContain('highlight');
    bar.remove();

    const buy = screen.getByRole('button', { name: /acheter héliotrope en pot/i });
    expect(styled(rules, buy, 'border').join(' ')).toContain('buttontext');
  });
});
