import { readFileSync } from 'node:fs';

// The tier numeral is what tells apart upgrade tiles that share a building's icon, so it stays
// at a readable size on a tab of its own.
const FILE = './App.css';

describe('the tier numeral on an upgrade tile', () => {
  it('reads at 11.5 px at least, on a cream tab', () => {
    const css = readFileSync(new URL(FILE, import.meta.url), 'utf8');
    const rule = css.match(/\n\.tier \{([^}]*)\}/)![1]!;
    const size = Number(rule.match(/font-size:\s*([\d.]+)rem;/)![1]);
    expect(size * 16).toBeGreaterThanOrEqual(11.5);
    expect(rule).toMatch(/background:\s*rgb\(255 255 255/);
  });
});
