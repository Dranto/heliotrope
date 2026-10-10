import { describe, expect, it } from 'vitest';
import { GENERATOR_IDS, type GeneratorId } from '../game/generators';
import type { UpgradeId } from '../game/upgrades';
import {
  APPEAR_THRESHOLDS,
  BUILDINGS,
  FARM_SITES,
  GARDEN_ROOFS,
  MIRRORS,
  PANEL_SPOTS,
  POT_SPOTS,
  TREES,
  WORLD,
  VIEW_FRAMES,
  fitCamera,
  furthestView,
  cameraTransform,
  clickLevel,
  upgradeLevel,
  visibleElements,
  type Box,
} from './neighbourhood';

function owning(counts: Partial<Record<GeneratorId, number>>): Record<GeneratorId, number> {
  return Object.fromEntries(GENERATOR_IDS.map((id) => [id, counts[id] ?? 0])) as Record<
    GeneratorId,
    number
  >;
}

function inside([x, y, w, h]: Box, [ox, oy, ow, oh]: Box): boolean {
  return x >= ox && y >= oy && x + w <= ox + ow && y + h <= oy + oh;
}

describe('visibleElements', () => {
  it('shows nothing before the first unit and one element per early unit', () => {
    expect(visibleElements(0, 10)).toBe(0);
    expect(visibleElements(1, 10)).toBe(1);
    expect(visibleElements(7, 10)).toBe(7);
  });

  it('keeps adding elements at wider steps later on', () => {
    expect(visibleElements(11, 50)).toBe(10);
    expect(visibleElements(12, 50)).toBe(11);
    expect(visibleElements(100, 50)).toBe(APPEAR_THRESHOLDS.indexOf(100) + 1);
  });

  it('never shows more elements than there are slots', () => {
    expect(visibleElements(1_000, 12)).toBe(12);
    expect(visibleElements(1_000, 500, 4)).toBe(APPEAR_THRESHOLDS.length * 4);
  });

  it('multiplies the elements per step by the density', () => {
    expect(visibleElements(3, 100, 4)).toBe(12);
  });
});

describe('upgrade levels', () => {
  it('counts the ×2 upgrades bought for one generator only', () => {
    const upgrades: UpgradeId[] = ['pot.1', 'pot.3', 'balconyPanel.1', 'gloves'];
    expect(upgradeLevel(upgrades, 'pot')).toBe(2);
    expect(upgradeLevel(upgrades, 'balconyPanel')).toBe(1);
    expect(upgradeLevel(upgrades, 'arcology')).toBe(0);
  });

  it('counts the click upgrades', () => {
    expect(clickLevel(['gloves', 'pot.1', 'copperCan'])).toBe(2);
    expect(clickLevel([])).toBe(0);
  });
});

describe('views', () => {
  it('opens views with the phase', () => {
    expect(furthestView(1, owning({ pot: 5 }))).toBe(1);
    expect(furthestView(2, owning({ pot: 5 }))).toBe(2);
    expect(furthestView(3, owning({}))).toBe(3);
  });

  it('opens a further view early so a generator further out is never built out of reach', () => {
    expect(furthestView(1, owning({ greenhouse: 1 }))).toBe(2);
    expect(furthestView(2, owning({ mirrorPlant: 1 }))).toBe(3);
    expect(furthestView(3, owning({ greenhouse: 1 }))).toBe(3);
  });

  it('frames the whole world in the city view of a world-sized screen', () => {
    expect(cameraTransform(fitCamera(3, WORLD.width, WORLD.height))).toBe(
      'translate(0px, 0px) scale(1)',
    );
  });

  /** Screen rectangle the frame of `view` takes with the camera fitted to that screen. */
  function onScreen(view: 1 | 2 | 3, width: number, height: number, left = 0, bottom = 0, top = 0) {
    const camera = fitCamera(view, width, height, { top, left, bottom });
    const [fx, fy, fw, fh] = VIEW_FRAMES[view];
    const x = width / 2 + (fx - camera.x) * camera.scale;
    const y = height / 2 + (fy - camera.y) * camera.scale;
    return { x, y, right: x + fw * camera.scale, bottom: y + fh * camera.scale };
  }

  it('keeps every view whole on wide and tall screens alike', () => {
    for (const view of [1, 2, 3] as const) {
      for (const [width, height] of [
        [1200, 700],
        [390, 480],
        [800, 800],
      ] as const) {
        const box = onScreen(view, width, height);
        expect(box.x).toBeGreaterThanOrEqual(-0.5);
        expect(box.y).toBeGreaterThanOrEqual(-0.5);
        expect(box.right).toBeLessThanOrEqual(width + 0.5);
        expect(box.bottom).toBeLessThanOrEqual(height + 0.5);
        // As large as it fits: it touches two opposite sides.
        const fillsWidth = box.right - box.x >= width - 1;
        const fillsHeight = box.bottom - box.y >= height - 1;
        expect(fillsWidth || fillsHeight).toBe(true);
      }
    }
  });

  it('keeps the flower clear of the part of the city in view', () => {
    const box = onScreen(2, 1200, 700, 260, 0);
    expect(box.x).toBeGreaterThanOrEqual(259.5);
    expect(box.right).toBeLessThanOrEqual(1200.5);
    const tall = onScreen(3, 390, 520, 0, 150, 48);
    expect(tall.bottom).toBeLessThanOrEqual(370.5);
    expect(tall.y).toBeGreaterThanOrEqual(47.5);
  });

  it('zooms closer on the courtyard than on the city', () => {
    expect(fitCamera(1, 1000, 700).scale).toBeGreaterThan(fitCamera(2, 1000, 700).scale);
    expect(fitCamera(2, 1000, 700).scale).toBeGreaterThan(fitCamera(3, 1000, 700).scale);
  });
});

describe('layout', () => {
  const world: Box = [0, 0, WORLD.width, WORLD.height];

  it('puts every garden on the roof of a building', () => {
    for (const roof of GARDEN_ROOFS) {
      expect(BUILDINGS.some(({ box }) => inside(roof, box))).toBe(true);
    }
  });

  it('keeps every element inside the world', () => {
    const points = [
      ...POT_SPOTS,
      ...PANEL_SPOTS,
      ...MIRRORS.map((m) => [m.x, m.y]),
      ...TREES.map((t) => [t.x, t.y]),
    ];
    for (const [x, y] of points) expect(inside([x!, y!, 0, 0], world)).toBe(true);
    for (const { box } of [...BUILDINGS, ...FARM_SITES]) expect(inside(box, world)).toBe(true);
  });

  it('never places two elements of a kind on the same spot', () => {
    for (const spots of [
      POT_SPOTS,
      PANEL_SPOTS,
      MIRRORS.map((m) => [m.x, m.y]),
      TREES.map((t) => [t.x, t.y]),
    ]) {
      expect(new Set(spots.map((p) => p.join())).size).toBe(spots.length);
    }
  });

  it('grows the canopy outwards from the home courtyard', () => {
    const [first, last] = [TREES[0]!, TREES[TREES.length - 1]!];
    expect(Math.hypot(first.x - 311, first.y - 236)).toBeLessThan(
      Math.hypot(last.x - 311, last.y - 236),
    );
  });

  it('has enough mirrors and trees for late purchases to keep showing', () => {
    expect(MIRRORS.length).toBeGreaterThanOrEqual(30);
    expect(TREES.length).toBeGreaterThanOrEqual(100);
  });
});
