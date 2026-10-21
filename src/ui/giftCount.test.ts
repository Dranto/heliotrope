import { readFileSync } from 'node:fs';

// The number of Milestone gifts waiting on the map is read at a glance: its text keeps the 4.5:1
// contrast of small text (WCAG AA) against its gold badge.
const FILE = './App.css';

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe('the Milestone gift count', () => {
  it('reads clearly on its gold badge', () => {
    const css = readFileSync(new URL(FILE, import.meta.url), 'utf8');
    const token = (name: string) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))![1]!;
    const resolve = (value: string) =>
      value.replace(/var\(--([\w-]+)\)/, (_, name: string) => token(name));
    const rule = css.match(/\.milestone-gift \.gift-count \{([^}]*)\}/)![1]!;
    const color = resolve(rule.match(/(?:^|\n)\s*color:\s*([^;]+);/)![1]!.trim());
    const background = resolve(rule.match(/background:\s*([^;]+);/)![1]!.trim());
    expect(contrast(color, background)).toBeGreaterThanOrEqual(4.5);
  });
});
