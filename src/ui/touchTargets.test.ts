import { readFileSync } from 'node:fs';

// Buttons pressed many times a game answer over a full 44 px on a touch screen (§10.3): the
// action buttons of the Season-2 panels by their height, the Milestone gift on the map by its size.
const RULES: [file: string, selector: string][] = [
  ['./alliances.css', '.alliance-card .buy'],
  ['./greatWorks.css', '.works-card .works-give'],
  ['./orchard.css', '.orchard-card .buy'],
  ['./garden.css', '.ghost.garden-sow'],
];
const SQUARE_RULES: [file: string, selector: string][] = [['./App.css', '.milestone-gift']];

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

  it.each(SQUARE_RULES)('%s gives %s a 44 px square on a touch screen', (file, selector) => {
    const css = readFileSync(new URL(file, import.meta.url), 'utf8');
    const block = new RegExp(`${escapeSelector(selector)}\\s*\\{([^}]*)\\}`);
    const rules = coarseBlocks(css).flatMap((b) => b.match(block)?.[1] ?? []);
    expect(rules.some((r) => /width:\s*2\.75rem/.test(r) && /height:\s*2\.75rem/.test(r))).toBe(
      true,
    );
  });
});
