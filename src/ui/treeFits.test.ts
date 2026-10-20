import { readFileSync } from 'node:fs';

/** The declarations of the `.tree-stage` rule in the Tree of Seasons stylesheet. */
function stageDeclarations(): Map<string, string> {
  // A file name in a variable: Vite would turn a literal one into an asset address.
  const file = './tree.css';
  const css = readFileSync(new URL(file, import.meta.url), 'utf8');
  // jsdom's parser drops min()/max() values, so the rule is read as text.
  const body = /^\.tree-stage \{([^}]*)\}/m.exec(css)![1]!;
  return new Map(
    body
      .split(';')
      .map((line) => line.trim().split(/:\s*/))
      .filter(([name]) => name)
      .map(([name, ...value]) => [name!, value.join(':')]),
  );
}

/**
 * On a 1280×720 screen the drawing filled the dialog's width, 600 px tall: the card of the talent
 * the player picked, with its Sow button, landed below the fold. The drawing's width now follows
 * the screen's height, centred, so the card stays in view under it.
 */
describe('the Tree of Seasons drawing', () => {
  it('shrinks with the screen height and stays centred', () => {
    const rule = stageDeclarations();
    expect(rule.get('width')).toMatch(/^min\(100%, .*100dvh/);
    expect(rule.get('aspect-ratio')).toBe('360 / 330');
    expect(rule.get('margin')).toMatch(/ auto /);
  });
});
