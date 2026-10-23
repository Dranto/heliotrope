import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { GameStore } from '../game/store';
import { App } from './App';
import { GameStoreContext } from './useGame';

const FILE = './App.css';

/** Style rules for a phone-width screen, as the browser parses the real stylesheet. */
function phoneRules(): CSSStyleRule[] {
  const style = document.createElement('style');
  style.textContent = readFileSync(new URL(FILE, import.meta.url), 'utf8');
  document.head.append(style);
  const list = [...style.sheet!.cssRules].flatMap((rule) =>
    rule instanceof CSSMediaRule && rule.conditionText.includes('max-width: 40rem')
      ? [...rule.cssRules]
      : [],
  );
  style.remove();
  return list.filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);
}

/**
 * On a phone the map's caption is one row that scrolls sideways. The decor and photo buttons
 * sat at its far end, past the weather, out of sight; they now stay in reach outside it.
 */
describe('the map tools on a phone', () => {
  beforeEach(() => localStorage.clear());

  it('stay outside the caption row that scrolls', () => {
    render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <App />
      </GameStoreContext.Provider>,
    );
    const photo = screen.getByRole('button', { name: 'Photo' });
    const caption = photo.closest('.scene-caption')!;
    const row = caption.querySelector('.caption-row')!;
    expect(row).not.toContainElement(photo);

    const rules = phoneRules();
    const scrolls = (element: Element) =>
      rules.some(
        (rule) =>
          element.matches(rule.selectorText) &&
          rule.style.getPropertyValue('overflow-x') === 'auto',
      );
    expect(scrolls(row)).toBe(true);
    expect(scrolls(caption)).toBe(false);
  });
});
