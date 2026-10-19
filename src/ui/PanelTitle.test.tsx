import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { PanelTitle } from './PanelTitle';

/** Style rules of the real stylesheet, as the browser parses them, outside media queries. */
function rules(): CSSStyleRule[] {
  const style = document.createElement('style');
  // A file name in a variable: Vite would turn a literal one into an asset address.
  const file = './App.css';
  style.textContent = readFileSync(new URL(file, import.meta.url), 'utf8');
  document.head.append(style);
  const list = [...style.sheet!.cssRules].filter(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule,
  );
  style.remove();
  return list;
}

describe('a panel title', () => {
  it('folds its panel from a button that says whether it is open', () => {
    const toggle = vi.fn();
    render(
      <PanelTitle id="orchard-title" open onToggle={toggle}>
        Le verger et les ruches
      </PanelTitle>,
    );
    const button = screen.getByRole('button', { name: 'Le verger et les ruches' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    button.click();
    expect(toggle).toHaveBeenCalledOnce();
  });

  // "Le verger et les ruches" wraps beside its baskets count on a phone; a button centres its
  // text by default, so the second line sat in the middle, apart from the hint below.
  it('starts a wrapped title on the left, like the text under it', () => {
    render(
      <PanelTitle id="orchard-title" open onToggle={() => {}}>
        Le verger et les ruches
      </PanelTitle>,
    );
    const button = screen.getByRole('button');
    const align = rules()
      .filter((rule) => button.matches(rule.selectorText))
      .map((rule) => rule.style.getPropertyValue('text-align'))
      .filter(Boolean);
    expect(align.at(-1)).toBe('start');
  });
});
