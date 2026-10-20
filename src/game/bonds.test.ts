import { BOND_BONUS, BOND_MAX, bondBonuses } from './bonds';

describe('bonds with the neighbouring districts (§9.11)', () => {
  it('gives no bonus before a request is served', () => {
    expect(bondBonuses({})).toEqual([]);
  });

  it('adds one global bonus per district, growing with each request served', () => {
    const [first, second] = bondBonuses({ tanneries: 1, railyard: 4 });
    expect(first).toEqual({ kind: 'global', bonus: BOND_BONUS });
    expect(second).toEqual({ kind: 'global', bonus: 4 * BOND_BONUS });
  });

  it('stops strengthening a bond after the tenth request', () => {
    expect(BOND_MAX).toBe(10);
    expect(bondBonuses({ tanneries: 10 })).toEqual(bondBonuses({ tanneries: 250 }));
    expect(bondBonuses({ tanneries: 250 })).toEqual([
      { kind: 'global', bonus: BOND_MAX * BOND_BONUS },
    ]);
  });

  it('skips districts with nothing served, as an old save may carry', () => {
    expect(bondBonuses({ tanneries: 0, railyard: undefined })).toEqual([]);
  });
});
