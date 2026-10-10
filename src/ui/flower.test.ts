import { describe, expect, it } from 'vitest';
import {
  FLOWER_STAGE_THRESHOLDS,
  SOIL,
  flowerShape,
  flowerStage,
  florets,
  floretPath,
  type FlowerStage,
} from './flower';

const STAGES: FlowerStage[] = [0, 1, 2, 3, 4, 5, 6];

describe('flowerStage', () => {
  it('starts as a sprout and follows the Light earned this Season', () => {
    expect(flowerStage(0)).toBe(0);
    expect(flowerStage(99)).toBe(0);
    expect(flowerStage(100)).toBe(1);
    expect(flowerStage(1e4)).toBe(3);
    expect(flowerStage(1e7)).toBe(5);
    expect(flowerStage(1e12)).toBe(6);
  });

  it('reaches each stage exactly at its threshold', () => {
    FLOWER_STAGE_THRESHOLDS.forEach((threshold, stage) => {
      expect(flowerStage(threshold)).toBe(stage);
      if (stage > 0) expect(flowerStage(threshold * 0.999)).toBe(stage - 1);
    });
  });
});

describe('flowerShape', () => {
  it('grows taller, with more heads and florets, at every stage', () => {
    for (let i = 1; i < STAGES.length; i++) {
      const before = flowerShape(STAGES[i - 1]!);
      const after = flowerShape(STAGES[i]!);
      expect(after.stemTop).toBeLessThan(before.stemTop);
      const count = (s: typeof after) => s.heads.reduce((sum, h) => sum + h.florets, 0);
      expect(count(after)).toBeGreaterThan(count(before));
      expect(after.heads.length).toBeGreaterThanOrEqual(before.heads.length);
    }
  });

  it('shows a sprout without flowers, then buds before the first open florets', () => {
    expect(flowerShape(0).heads).toEqual([]);
    expect(flowerShape(1).heads[0]!.open).toBe(0);
    expect(flowerShape(2).heads[0]!.open).toBeGreaterThan(0);
    expect(flowerShape(6).heads[0]!.open).toBe(1);
  });

  it('keeps every head and leaf inside the arch and above the pot', () => {
    for (const stage of STAGES) {
      const { heads, leaves, branches } = flowerShape(stage);
      expect(branches).toHaveLength(Math.max(0, heads.length - 1));
      for (const head of heads) {
        expect(head.x - head.radius).toBeGreaterThan(20);
        expect(head.x + head.radius).toBeLessThan(180);
        expect(head.y - head.radius).toBeGreaterThan(8);
      }
      for (const leaf of leaves) {
        expect(leaf.y).toBeLessThan(SOIL.y);
        expect(leaf.x + leaf.length).toBeLessThan(180);
        expect(leaf.x - leaf.length).toBeGreaterThan(20);
      }
    }
  });
});

describe('florets', () => {
  it('lays out one floret per count, outer ones in bud, sorted back to front', () => {
    const head = { x: 100, y: 100, radius: 30, florets: 20, open: 0.5 };
    const list = florets(head);
    expect(list).toHaveLength(20);
    expect(list.filter((f) => !f.bud)).toHaveLength(10);
    for (let i = 1; i < list.length; i++) expect(list[i]!.y).toBeGreaterThanOrEqual(list[i - 1]!.y);
  });
});

describe('floretPath', () => {
  it('draws a closed corolla of five lobes', () => {
    const d = floretPath(10);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.match(/C/g)).toHaveLength(5);
  });
});
