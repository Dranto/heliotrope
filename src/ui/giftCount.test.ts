import { readFileSync } from 'node:fs';

// The count on the Milestone gift badge ("3") stays readable on a phone.
const FILE = './App.css';

describe('the Milestone gift count', () => {
  it('reads at 12 px at least', () => {
    const css = readFileSync(new URL(FILE, import.meta.url), 'utf8');
    const rule = css.match(/\.milestone-gift \.gift-count \{([^}]*)\}/)![1]!;
    const size = Number(rule.match(/font-size:\s*([\d.]+)rem;/)![1]);
    expect(size * 16).toBeGreaterThanOrEqual(12);
  });
});
