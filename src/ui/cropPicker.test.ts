import { readFileSync } from 'node:fs';
import { en } from '../i18n/en';
import { fr } from '../i18n/fr';

// The growing time and effect under each crop decide which one to sow, so they stay readable on a
// phone and never leave a number alone at the end of a line.
const FILE = './garden.css';

describe('the crop picker', () => {
  it('writes the growing time and effect at 12 px at least', () => {
    const css = readFileSync(new URL(FILE, import.meta.url), 'utf8');
    const rule = css.match(/\.garden-crop small \{([^}]*)\}/)![1]!;
    const size = Number(rule.match(/font-size:\s*([\d.]+)rem;/)![1]);
    expect(size * 16).toBeGreaterThanOrEqual(12);
  });

  it.each([
    ['fr', fr],
    ['en', en],
  ])('keeps each number with its unit in the %s effects', (_, texts) => {
    for (const { effect } of Object.values(texts.garden.crops)) {
      expect(effect).not.toMatch(/\d (min|h|s)\b/);
    }
  });
});
