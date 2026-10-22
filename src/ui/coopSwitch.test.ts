import { readFileSync } from 'node:fs';

// Each cooperative is paused and restarted from its switch: on a touch screen it is a full 44 px
// tap target (§10.3).
const FILE = './cooperatives.css';

describe('the cooperative switch', () => {
  it('is at least 44 px tall on a touch screen', () => {
    const css = readFileSync(new URL(FILE, import.meta.url), 'utf8');
    const coarse = css.match(/@media \(pointer: coarse\) \{\s*\.coop-switch \{([^}]*)\}/)![1]!;
    const height = Number(coarse.match(/min-height:\s*([\d.]+)rem;/)![1]);
    expect(height * 16).toBeGreaterThanOrEqual(44);
  });
});
