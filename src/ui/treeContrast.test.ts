import { readFileSync } from 'node:fs';

// A file name in a variable: Vite would turn a literal one into an asset address.
const file = './tree.css';
const css = readFileSync(new URL(file, import.meta.url), 'utf8');

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** The declarations of a rule, read as text. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped} \\{([^}]*)\\}`, 'm').exec(css)![1]!;
}

function variable(body: string, name: string): string {
  return new RegExp(`${name}:\\s*(#[0-9a-f]{6})`).exec(body)![1]!;
}

/**
 * The "Appris" tag and the branch name of a talent were written in the branch colour, which
 * read at 2.25:1 on the tag's soft tint for the roots: below the 4.5:1 that small text needs.
 */
describe('the Tree of Seasons branch text', () => {
  it.each(['roots', 'pollinators', 'memory'])('reads clearly on the %s branch tint', (branch) => {
    const body = rule(`[data-branch='${branch}']`);
    const ink = variable(body, '--branch-ink');
    expect(contrast(ink, variable(body, '--branch-soft'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(ink, '#fbf6ec')).toBeGreaterThanOrEqual(4.5);
  });

  it('writes the learnt tag and the branch name in that ink', () => {
    expect(rule('.tree-learnt-tag')).toContain('color: var(--branch-ink)');
    expect(rule('.tree-branch-tag')).toContain('color: var(--branch-ink)');
  });
});
