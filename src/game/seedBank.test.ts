import { describe, expect, it } from 'vitest';
import { varietyOf } from './garden';
import { CROP_IDS, isVarietyId, VARIETIES, VARIETY_IDS, varietyBonuses } from './seedBank';

describe('the seed bank', () => {
  it('lists every variety under its own id', () => {
    expect(Object.keys(VARIETIES).sort()).toEqual([...VARIETY_IDS].sort());
    for (const id of VARIETY_IDS) expect(VARIETIES[id].id).toBe(id);
  });

  it('gives exactly one variety for each pair of different crops', () => {
    const pairs = new Set<string>();
    for (const { parents } of Object.values(VARIETIES)) {
      expect(parents[0]).not.toBe(parents[1]);
      pairs.add([...parents].sort().join('+'));
    }
    expect(pairs.size).toBe(VARIETY_IDS.length);
    for (const a of CROP_IDS) {
      for (const b of CROP_IDS) {
        if (a === b) expect(varietyOf(a, b)).toBeNull();
        else expect(varietyOf(a, b)).toBe(varietyOf(b, a));
      }
    }
    expect(varietyOf('beans', 'squash')).toBe('threeSisters');
  });

  it('recognises only its own variety ids', () => {
    expect(isVarietyId('gariguette')).toBe(true);
    expect(isVarietyId('apple')).toBe(false);
    expect(isVarietyId('toString')).toBe(false);
    expect(isVarietyId(3)).toBe(false);
  });

  it('adds up the bonuses of the varieties found', () => {
    expect(varietyBonuses([])).toEqual([]);
    expect(varietyBonuses(['flameRadish', 'threeSisters'])).toEqual([
      { kind: 'clickMultiplier', factor: 1.5 },
      { kind: 'biodiversityFactor', factor: 1.25 },
    ]);
  });
});
