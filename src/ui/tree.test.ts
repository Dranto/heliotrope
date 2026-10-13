import { describe, expect, it } from 'vitest';
import { FLOWER_STAGE_THRESHOLDS, type FlowerStage } from './flower';
import {
  BASE,
  CROWN_BOX,
  leafOut,
  seasonGrowth,
  treeAge,
  treeShape,
  treeSkeleton,
  type TreeShape,
} from './tree';

const SEEDS = [0, 1, 777, 123456789, 0xffffffff];

function woodLength(shape: TreeShape): number {
  return shape.limbs.reduce((sum, s) => sum + Math.hypot(s.x1 - s.x0, s.y1 - s.y0), 0);
}

describe('treeSkeleton', () => {
  it('draws the same tree from the same seed, and another tree from another seed', () => {
    expect(treeSkeleton(777)).toEqual(treeSkeleton(777));
    expect(treeSkeleton(777)).not.toEqual(treeSkeleton(778));
  });

  it('lists every limb after the limb it grows from, and later', () => {
    for (const seed of SEEDS) {
      const limbs = treeSkeleton(seed);
      expect(limbs[0]!.parent).toBe(-1);
      limbs.forEach((limb, i) => {
        if (i === 0) return;
        expect(limb.parent).toBeLessThan(i);
        expect(limb.birth).toBeGreaterThan(limbs[limb.parent]!.birth);
      });
    }
  });
});

describe('treeShape', () => {
  it('keeps the grown crown inside its box, clear of the species around the courtyard', () => {
    for (const seed of SEEDS) {
      const shape = treeShape(treeSkeleton(seed), 40, 1, 6);
      for (const c of shape.clusters) {
        expect(c.x - c.radius).toBeGreaterThan(CROWN_BOX.left - 1);
        expect(c.x + c.radius).toBeLessThan(CROWN_BOX.right + 1);
        expect(c.y - c.radius).toBeGreaterThan(CROWN_BOX.top - 1);
      }
      for (const h of shape.heads) expect(h.y - h.radius).toBeGreaterThan(CROWN_BOX.top - 8);
    }
  });

  it('only ever adds wood as the tree ages, and stands on its base', () => {
    for (const seed of SEEDS) {
      const limbs = treeSkeleton(seed);
      let before = 0;
      let trunk = 0;
      for (let age = 0; age <= 12; age += 0.25) {
        const shape = treeShape(limbs, age, 1, 3);
        expect(shape.limbs[0]!.x0).toBe(BASE.x);
        expect(shape.limbs[0]!.y0).toBe(BASE.y);
        expect(woodLength(shape)).toBeGreaterThanOrEqual(before);
        expect(shape.limbs[0]!.w0).toBeGreaterThanOrEqual(trunk);
        before = woodLength(shape);
        trunk = shape.limbs[0]!.w0;
      }
    }
  });

  it('starts as a seedling, is a young tree after a Season, and keeps branching after', () => {
    const limbs = treeSkeleton(777);
    const seedling = treeShape(limbs, 0, 0.5, 0);
    const young = treeShape(limbs, 1, 1, 6);
    const old = treeShape(limbs, 8, 1, 6);
    expect(seedling.seedling).toBe(true);
    expect(seedling.limbs).toHaveLength(1);
    expect(young.seedling).toBe(false);
    expect(young.limbs.length).toBeGreaterThan(8);
    expect(old.limbs.length).toBeGreaterThan(young.limbs.length * 2);
    expect(old.crown.radius).toBeGreaterThan(young.crown.radius);
  });

  it('blooms with the stages of the Season: bare, buds, then more and more open heads', () => {
    const limbs = treeSkeleton(777);
    const heads = (stage: FlowerStage) => treeShape(limbs, 6, 1, stage).heads;
    expect(heads(0)).toEqual([]);
    expect(heads(1).every((h) => h.open === 0)).toBe(true);
    for (let stage = 2; stage <= 6; stage++) {
      expect(heads(stage as FlowerStage).length).toBeGreaterThanOrEqual(
        heads((stage - 1) as FlowerStage).length,
      );
    }
    expect(heads(6).every((h) => h.open === 1)).toBe(true);
  });
});

describe('treeAge', () => {
  it('counts the Seasons, and never goes back when a new Season starts', () => {
    expect(treeAge(0, 0)).toBe(0);
    expect(treeAge(0, 1e12)).toBe(1);
    expect(treeAge(1, 0)).toBe(1);
    expect(treeAge(3, 1e4)).toBe(3.5);
  });

  it('grows continuously with the Light of the Season', () => {
    let before = -1;
    for (let light = 0; light < 1e10; light = light * 3 + 7) {
      const growth = seasonGrowth(light);
      expect(growth).toBeGreaterThanOrEqual(before);
      before = growth;
    }
    FLOWER_STAGE_THRESHOLDS.forEach((threshold, stage) =>
      expect(seasonGrowth(threshold)).toBeCloseTo(stage),
    );
  });
});

describe('leafOut', () => {
  it('starts a Season from bare buds and is in full leaf by the third stage', () => {
    expect(leafOut(2, 0)).toBeLessThan(0.3);
    expect(leafOut(2, 1e4)).toBe(1);
    // The young tree of the first Season keeps its first leaves.
    expect(leafOut(0, 0)).toBeGreaterThanOrEqual(0.5);
  });
});
