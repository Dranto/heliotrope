import { describe, expect, it } from 'vitest';
import { rootCourse, rootNetwork, type RootReach } from './treeRoots';

const courtyard: RootReach = { view: 1, parcels: [], districts: [], sites: [], age: 0.5 };

function ids(reach: RootReach): string[] {
  return rootNetwork(777, reach).roots.map((r) => r.id);
}

describe('rootNetwork', () => {
  it('reaches further with each view opened', () => {
    const counts = ([1, 2, 3, 4] as const).map((view) => ids({ ...courtyard, view }).length);
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThan(counts[i - 1]!);
    expect(ids(courtyard).every((id) => id.startsWith('rootlet'))).toBe(true);
  });

  it('grows a root and a shoot to each place restored', () => {
    const reach: RootReach = {
      ...courtyard,
      view: 3,
      parcels: ['park', 'orchard'],
      districts: ['tanneries'],
    };
    const network = rootNetwork(777, reach);
    expect(network.shoots.map((s) => s.id)).toEqual([
      'parcel-park',
      'parcel-orchard',
      'district-tanneries',
    ]);
    expect(network.roots.some((r) => r.id === 'district-tanneries')).toBe(true);
  });

  it('never moves a root once grown, whatever order the places come in', () => {
    const a = rootNetwork(777, { ...courtyard, view: 3, parcels: ['park', 'orchard'] });
    const b = rootNetwork(777, { ...courtyard, view: 4, parcels: ['orchard', 'park', 'squares'] });
    for (const root of a.roots) {
      expect(b.roots.find((r) => r.id === root.id)?.d).toBe(root.d);
    }
  });

  it('reaches the regional sites raised once the Bioregion is open', () => {
    const closed = rootNetwork(777, { ...courtyard, view: 3, sites: ['wetlands'] });
    const open = rootNetwork(777, { ...courtyard, view: 4, sites: ['wetlands'] });
    expect(closed.shoots).toEqual([]);
    expect(open.shoots.map((s) => s.id)).toEqual(['site-wetlands']);
  });
});

describe('rootCourse', () => {
  it('runs from one end to the other, wandering by the seed', () => {
    const d = rootCourse(1, 'north', [0, 0], [100, 0]);
    expect(d.startsWith('M0 0')).toBe(true);
    expect(d.endsWith('100 0')).toBe(true);
    expect(rootCourse(2, 'north', [0, 0], [100, 0])).not.toBe(d);
  });
});
