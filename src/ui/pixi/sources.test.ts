import { describe, expect, it } from 'vitest';
import { landShown, MEADOW_FIELDS, FIELDS } from '../bioregionMap';
import { localUrl, paddedBox } from './snapshot';
import { mapSources } from './sources';

const none = { wetlands: 0, meadows: 0, foodForests: 0, oldForest: 0, hillsides: 0 };
const dry = { roofTanks: 0, swales: 0, ponds: 0, streams: 0 };

describe('drawings the WebGL map takes from the SVG scene (§10.4)', () => {
  it('takes the parcels it does not draw itself, unveiled from their pin', () => {
    const sources = mapSources({
      parcels: ['river', 'livingRoofs', 'park', 'gardenStreet'],
      sites: none,
      collectors: dry,
      bioregion: false,
    });
    expect(sources.map((s) => s.key)).toEqual(['parcel:gardenStreet', 'parcel:park']);
    expect(sources.every((s) => s.group === 'parcels' && s.entrance?.unveil)).toBe(true);
  });

  it('adds the Bioregion once open: the plain, its sites and the collectors', () => {
    const sites = { wetlands: 1, meadows: 1, foodForests: 0, oldForest: 1, hillsides: 0 };
    const collectors = { roofTanks: 1, swales: 0, ponds: 1, streams: 1 };
    const sources = mapSources({ parcels: [], sites, collectors, bioregion: true });
    const shown = landShown(sites, collectors);
    const count = (prefix: string) => sources.filter((s) => s.key.startsWith(prefix)).length;
    expect(count('land')).toBe(1);
    expect(count('meadow:')).toBe(shown.meadows.length);
    expect(count('crown:')).toBe(shown.crowns.length);
    expect(count('pond:')).toBe(shown.ponds.length);
    expect(count('tank:')).toBe(shown.tanks.length);
    expect(shown.meadows.length).toBeGreaterThan(0);
    // The plain itself has no entrance and stays a light texture.
    const land = sources.find((s) => s.key === 'land')!;
    expect(land.entrance).toBeUndefined();
    expect(land.maxRes).toBeLessThan(1);
    expect(mapSources({ parcels: [], sites, collectors, bioregion: false })).toEqual([]);
  });

  it('turns farmed fields into meadows as the site grows', () => {
    const shown = landShown({ ...none, meadows: 1 }, dry);
    expect(shown.fields.length).toBe(FIELDS.length - shown.meadows.length);
    expect(shown.fields).not.toContain(MEADOW_FIELDS[0]);
  });
});

describe('snapshots of SVG drawings', () => {
  it('keeps pattern references local to the picture', () => {
    expect(localUrl('url("http://localhost:5173/#land-furrows")')).toBe('url(#land-furrows)');
    expect(localUrl('url(#sedum-texture)')).toBe('url(#sedum-texture)');
    expect(localUrl('rgb(1, 2, 3)')).toBe('rgb(1, 2, 3)');
  });

  it('frames a drawing in whole world units with room for its strokes', () => {
    expect(paddedBox({ x: 10.5, y: 20, width: 5, height: 4.2 })).toEqual([7, 17, 12, 11]);
  });
});
