import { describe, expect, it } from 'vitest';
import { nextRandom, seedFrom } from './random';

describe('the seeded random numbers', () => {
  it('gives the same sequence from the same seed', () => {
    const draw = (seed: number, count: number) => {
      const values: number[] = [];
      for (let i = 0; i < count; i++) {
        const [value, next] = nextRandom(seed);
        values.push(value);
        seed = next;
      }
      return values;
    };
    expect(draw(42, 20)).toEqual(draw(42, 20));
    expect(draw(42, 20)).not.toEqual(draw(43, 20));
  });

  it('stays in [0, 1) and keeps the next seed an unsigned 32-bit integer', () => {
    let seed = 0xffffffff;
    for (let i = 0; i < 10_000; i++) {
      const [value, next] = nextRandom(seed);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(Number.isInteger(next)).toBe(true);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThanOrEqual(0xffffffff);
      seed = next;
    }
  });

  it('spreads its draws evenly enough for the random events', () => {
    const buckets = new Array<number>(10).fill(0);
    let seed = 1;
    const draws = 20_000;
    for (let i = 0; i < draws; i++) {
      const [value, next] = nextRandom(seed);
      buckets[Math.floor(value * 10)]!++;
      seed = next;
    }
    for (const count of buckets) expect(Math.abs(count - draws / 10)).toBeLessThan(draws / 50);
  });

  it('derives an unsigned 32-bit seed from a timestamp, different per timestamp', () => {
    const seed = seedFrom(1_760_000_000_000.7);
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
    expect(seedFrom(1_760_000_000_000)).toBe(seed);
    expect(seedFrom(1_760_000_000_001)).not.toBe(seed);
  });
});
