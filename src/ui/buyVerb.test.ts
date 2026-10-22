import { readFileSync } from 'node:fs';

// "Acheter", "Bâtir", "Planter"…: the verb on every buy button stays readable on a phone.
const FILE = './App.css';

describe('the verb on a buy button', () => {
  it('reads at 12 px at least', () => {
    const css = readFileSync(new URL(FILE, import.meta.url), 'utf8');
    const rule = css.match(/\n\.buy-verb \{([^}]*)\}/)![1]!;
    const size = Number(rule.match(/font-size:\s*([\d.]+)rem;/)![1]);
    expect(size * 16).toBeGreaterThanOrEqual(12);
  });
});
