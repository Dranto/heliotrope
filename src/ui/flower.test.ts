import { describe, expect, it } from 'vitest';
import { FLOWER_STAGE_THRESHOLDS, flowerStage, florets, floretPath } from './flower';

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
