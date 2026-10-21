import { render } from '@testing-library/react';
import { BED_PLACES, BED_SIZE } from './gardenMap';
import { ProjectMarks } from './RestorationArt';
import { PROJECT_SPOTS } from './restorationMap';

const COURTYARD_PROJECTS = ['seedSwap', 'toolLibrary', 'compost', 'beehives'] as const;

function inBed(x: number, y: number): boolean {
  return BED_PLACES.some(
    ([cx, cy]) => Math.abs(x - cx) < BED_SIZE.width / 2 && Math.abs(y - cy) < BED_SIZE.height / 2,
  );
}

describe('the courtyard projects', () => {
  it.each(COURTYARD_PROJECTS)('draws %s clear of the garden beds', (id) => {
    expect(inBed(...PROJECT_SPOTS[id])).toBe(false);
    const { container } = render(
      <svg>
        <ProjectMarks projects={[id]} />
      </svg>,
    );
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThan(0);
    for (const rect of rects) {
      const [x, y, w, h] = ['x', 'y', 'width', 'height'].map((a) => Number(rect.getAttribute(a)));
      for (const [px, py] of [
        [x!, y!],
        [x! + w!, y!],
        [x!, y! + h!],
        [x! + w!, y! + h!],
      ] as const) {
        expect(inBed(px, py)).toBe(false);
      }
    }
  });
});
