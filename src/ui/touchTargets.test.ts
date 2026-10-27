import { readFileSync } from 'node:fs';

// Buttons pressed many times a game answer over a full 44 px on a touch screen (§10.3): the
// action buttons of the Season-2 panels by their height.
const RULES: [file: string, selector: string][] = [['./garden.css', '.ghost.garden-sow']];

function coarseBlocks(css: string): string[] {
  const blocks: string[] = [];
  for (const match of css.matchAll(/@media \(pointer: coarse\) \{/g)) {
    let depth = 1;
    let i = match.index + match[0].length;
    const start = i;
    for (; depth > 0 && i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') depth--;
    }
    blocks.push(css.slice(start, i - 1));
  }
  return blocks;
}

function escapeSelector(selector: string): string {
  return selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('touch targets', () => {
  it.each(RULES)('%s gives %s a 44 px height on a touch screen', (file, selector) => {
    const css = readFileSync(new URL(file, import.meta.url), 'utf8');
    const rule = new RegExp(`${escapeSelector(selector)}\\s*\\{[^}]*min-height:\\s*2\\.75rem`);
    expect(coarseBlocks(css).some((block) => rule.test(block))).toBe(true);
  });
});
