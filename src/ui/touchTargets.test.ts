import { readFileSync } from 'node:fs';

// The action buttons of the Season-2 panels, pressed many times a game, answer over a full 44 px
// on a touch screen (§10.3).
const RULES: [file: string, selector: string][] = [
  ['./alliances.css', '.alliance-card .buy'],
  ['./greatWorks.css', '.works-card .works-give'],
  ['./orchard.css', '.orchard-card .buy'],
  ['./garden.css', '.ghost.garden-sow'],
];

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

describe('touch targets in the Season-2 panels', () => {
  it.each(RULES)('%s gives %s a 44 px height on a touch screen', (file, selector) => {
    const css = readFileSync(new URL(file, import.meta.url), 'utf8');
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rule = new RegExp(`${escaped}\\s*\\{[^}]*min-height:\\s*2\\.75rem`);
    expect(coarseBlocks(css).some((block) => rule.test(block))).toBe(true);
  });
});
