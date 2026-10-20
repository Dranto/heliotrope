import { readFileSync } from 'node:fs';

/** Style rules the stylesheet gives on a phone, as the browser parses them. */
function phoneRules(): CSSStyleRule[] {
  // A file name in a variable: Vite would turn a literal one into an asset address.
  const file = './App.css';
  const style = document.createElement('style');
  style.textContent = readFileSync(new URL(file, import.meta.url), 'utf8');
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
 * On a phone the tab bar floats over the bottom of the page. A buy button reached with Tab (an
 * external keyboard, switch access) was scrolled just into the viewport, under the bar: the page
 * keeps a bottom scroll padding as tall as the room it leaves for the bar.
 */
describe('the phone tab bar', () => {
  it('never hides the control that takes the focus', () => {
    const rules = phoneRules();
    const room = rules.find((rule) => rule.selectorText === '.app')!.style.paddingBottom;
    const padding = rules
      .filter((rule) => document.documentElement.matches(rule.selectorText))
      .map((rule) => rule.style.getPropertyValue('scroll-padding-bottom'))
      .find(Boolean);
    expect(padding).toContain(room);
  });
});
