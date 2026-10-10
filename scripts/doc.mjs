// Prints one section of a long doc so a session reads only what it needs.
// Usage:
//   npm run -s doc -- design            table of contents with line counts
//   npm run -s doc -- design 7.1        section "7.1" and its subsections
//   npm run -s doc -- roadmap P5        any heading whose text starts with "P5"
// The first argument is a file in docs/ ("design" is a shortcut for game-design).
import { readFileSync } from 'node:fs';

const [name = 'design', query] = process.argv.slice(2);
const file = `docs/${name === 'design' ? 'game-design' : name.replace(/\.md$/, '')}.md`;
const lines = readFileSync(file, 'utf8').split('\n');

const headings = [];
let inFence = false;
lines.forEach((line, index) => {
  if (line.startsWith('```')) inFence = !inFence;
  const match = !inFence && /^(#{1,6})\s+(.*)$/.exec(line);
  if (match) headings.push({ index, level: match[1].length, text: match[2] });
});
const end = (i) =>
  headings.slice(i + 1).find((h) => h.level <= headings[i].level)?.index ?? lines.length;

if (!query) {
  headings.forEach((h, i) => {
    const size = end(i) - h.index;
    console.log(`${'  '.repeat(h.level - 1)}${h.text} (${size} lines)`);
  });
} else {
  const wanted = query.toLowerCase();
  const i = headings.findIndex((h) => h.level > 1 && h.text.toLowerCase().startsWith(wanted));
  if (i < 0) {
    console.error(
      `No heading starting with "${query}" in ${file}. Run without a section for the list.`,
    );
    process.exit(1);
  }
  console.log(lines.slice(headings[i].index, end(i)).join('\n').trimEnd());
}
