import { describe, expect, it } from 'vitest';
import { FRUIT_IDS, FRUITS, fruitVarietyBonuses, isFruitId } from './fruits';
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

describe('the orchard trees', () => {
  it('makes the first tree free and each next one dearer', () => {
    const baskets = FRUIT_IDS.map((id) => FRUITS[id].baskets);
    expect(baskets[0]).toBe(0);
    for (let i = 1; i < baskets.length; i++) expect(baskets[i]).toBeGreaterThan(baskets[i - 1]!);
  });

  it('recognises only its own fruit ids and adds up their old varieties', () => {
    expect(isFruitId('plum')).toBe(true);
    expect(isFruitId('radish')).toBe(false);
    expect(isFruitId('hasOwnProperty')).toBe(false);
    expect(fruitVarietyBonuses(['apple', 'pear'])).toEqual([
      { kind: 'global', bonus: 0.05 },
      { kind: 'water', factor: 1.1 },
    ]);
  });
});
