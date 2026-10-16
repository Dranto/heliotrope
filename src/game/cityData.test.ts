import { describe, expect, it } from 'vitest';
import {
  cityBonuses,
  HOME_NETWORK,
  LANDSCAPES,
  NETWORK_CUTTINGS,
  networkBonuses,
  nextWorkshopCost,
  SAVOIR_BONUS,
  SCHOOL_BONUS,
  savoirBonus,
  WORKSHOP_COSTS,
  workshopLevel,
} from './cityData';

describe('the Savoirs workshop prices', () => {
  it('reads an unlearnt rule as level 0', () => {
    expect(workshopLevel({}, 'trade')).toBe(0);
    expect(workshopLevel({ trade: 2 }, 'trade')).toBe(2);
  });

  it('prices each next level, then nothing once a rule is learnt to the end', () => {
    expect(nextWorkshopCost({}, 'memory')).toBe(WORKSHOP_COSTS.memory[0]);
    expect(nextWorkshopCost({ memory: 1 }, 'memory')).toBe(WORKSHOP_COSTS.memory[1]);
    expect(nextWorkshopCost({ memory: WORKSHOP_COSTS.memory.length }, 'memory')).toBeNull();
    expect(nextWorkshopCost({ seedlings: 1 }, 'seedlings')).toBeNull();
  });
});

describe('the network a city leaves behind', () => {
  it('sends its own bonus and cuttings once at scale 1', () => {
    expect(networkBonuses('home')).toEqual([
      ...HOME_NETWORK,
      { kind: 'cuttingsGift', units: NETWORK_CUTTINGS },
    ]);
    expect(networkBonuses('forest')).toEqual([
      ...LANDSCAPES.forest.network,
      { kind: 'cuttingsGift', units: NETWORK_CUTTINGS },
    ]);
  });

  it('scales factors around 1, so one below 1 drops further', () => {
    // Coast sends ×1.1 Water: three times as strong is ×1.3.
    const [water] = networkBonuses('coast', 3);
    expect(water).toMatchObject({ kind: 'water' });
    expect((water as { factor: number }).factor).toBeCloseTo(1.3);
    // A factor below 1 (a shorter butterfly interval) grows further below 1.
    const [interval] = networkBonuses('mountain', 2);
    expect(interval).toMatchObject({ kind: 'butterflyInterval' });
    expect((interval as { factor: number }).factor).toBeLessThan(
      (LANDSCAPES.mountain.network[0] as { factor: number }).factor,
    );
  });

  it('scales flat bonuses, fractions and cuttings by the scale', () => {
    const [global, cuttings] = networkBonuses('home', 2);
    expect((global as { bonus: number }).bonus).toBeCloseTo(
      (HOME_NETWORK[0] as { bonus: number }).bonus * 2,
    );
    expect(cuttings).toEqual({ kind: 'cuttingsGift', units: NETWORK_CUTTINGS * 2 });
    const [discount] = networkBonuses('plain', 3);
    expect(discount).toMatchObject({ kind: 'discount' });
    expect((discount as { fraction: number }).fraction).toBeCloseTo(
      (LANDSCAPES.plain.network[0] as { fraction: number }).fraction * 3,
    );
  });
});

describe('the bonuses of the city lived in', () => {
  it('adds the Savoirs earned, raised by each level of schools', () => {
    expect(savoirBonus({ earned: 0, workshop: { schools: 3 } })).toBe(0);
    expect(savoirBonus({ earned: 4, workshop: {} })).toBeCloseTo(SAVOIR_BONUS * 4);
    expect(savoirBonus({ earned: 4, workshop: { schools: 2 } })).toBeCloseTo(
      (SAVOIR_BONUS + 2 * SCHOOL_BONUS) * 4,
    );
  });

  it('is empty for a first city, then gathers the rule, the network and the Savoirs', () => {
    expect(cityBonuses({ landscape: null, founded: [], earned: 0, workshop: {} })).toEqual([]);
    const bonuses = cityBonuses({
      landscape: 'forest',
      founded: ['home', 'coast'],
      earned: 2,
      workshop: { trade: 1 },
    });
    expect(bonuses.slice(0, LANDSCAPES.forest.rule.length)).toEqual(LANDSCAPES.forest.rule);
    // Trade level 1 sends each city's network twice: two cities, two cuttings gifts of 2× each.
    const gifts = bonuses.filter((b) => b.kind === 'cuttingsGift');
    expect(gifts).toEqual([
      { kind: 'cuttingsGift', units: NETWORK_CUTTINGS * 2 },
      { kind: 'cuttingsGift', units: NETWORK_CUTTINGS * 2 },
    ]);
    expect(bonuses.at(-1)).toEqual({
      kind: 'global',
      bonus: savoirBonus({ earned: 2, workshop: {} }),
    });
  });
});
