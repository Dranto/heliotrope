import { fitCamera, flowerFrame, PLANTER, type View } from './neighbourhood';
import { SPECIES_PLACES } from './speciesMap';

// The flower's touch target in its 200 × 260 drawing: the ellipse around the plant (Flower.tsx)
// and the box its widest heads cover.
const PLANT = { cx: 100, cy: 170, rx: 62, ry: 88 };
const HEADS = { left: 29, top: 70, right: 173, bottom: 159 };

/** Map sizes measured on a phone, a small laptop and a desktop. */
const MAPS = [
  [364, 304],
  [573, 624],
  [930, 756],
] as const;

function underFlower(x: number, y: number, view: View, width: number, height: number): boolean {
  const camera = fitCamera(view, width, height, {
    top: width >= height ? 0 : 52,
    left: 0,
    bottom: 0,
  });
  const flower = flowerFrame(camera, width, height, PLANTER);
  const k = 200 / flower.width;
  const u = (width / 2 + (x - camera.x) * camera.scale - flower.x) * k;
  const v = (height / 2 + (y - camera.y) * camera.scale - flower.y) * k;
  const inPlant = ((u - PLANT.cx) / PLANT.rx) ** 2 + ((v - PLANT.cy) / PLANT.ry) ** 2 < 1;
  const inHeads = u > HEADS.left && u < HEADS.right && v > HEADS.top && v < HEADS.bottom;
  return inPlant || inHeads;
}

describe('species places', () => {
  it('keeps every resting species clear of the flower, so it can be greeted at every view', () => {
    const hidden: string[] = [];
    for (const [id, { spots, motion }] of Object.entries(SPECIES_PLACES)) {
      if (motion === 'fly') continue;
      for (const [x, y] of spots)
        for (const [width, height] of MAPS)
          for (const view of [1, 2, 3] as const)
            if (underFlower(x, y, view, width, height))
              hidden.push(`${id} ${width}×${height} v${view}`);
    }
    expect(hidden).toEqual([]);
  });

  it('sees the spot the bee used to have as hidden', () => {
    expect(underFlower(296, 192, 3, 930, 756)).toBe(true);
  });
});
