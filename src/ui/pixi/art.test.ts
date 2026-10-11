import { describe, expect, it } from 'vitest';
import { BUILDINGS, CAR_PARKS, FARM_SITES, GARDEN_ROOFS, GREENHOUSE_SITES } from '../neighbourhood';
import {
  arcologyRingArt,
  buildingArt,
  farmArt,
  gardenArt,
  greenhouseArt,
  groundArt,
  mirrorArt,
  panelArt,
  planterArt,
  potArt,
  svgDocument,
  towerArt,
  treeArt,
  type Art,
  type ArtContext,
} from './art';
import { palette } from './model';

function drawings(ctx: ArtContext, level: number): Art[] {
  return [
    groundArt(ctx, {
      courtyardGreen: 0.5,
      wastelands: [],
      carParks: [CAR_PARKS[0]!],
      mirrorField: CAR_PARKS[1]!,
    }),
    ...BUILDINGS.slice(0, 4).map(({ box, storeys }, i) =>
      buildingArt(ctx, box, storeys, { sedum: i === 1 }),
    ),
    gardenArt(ctx, GARDEN_ROOFS[0]!, level),
    greenhouseArt(ctx, GREENHOUSE_SITES[0]!, level),
    farmArt(ctx, FARM_SITES[0]!.box, level),
    ...[0, 1, 2].map((kind) => treeArt(ctx, kind, 7, level)),
    potArt(ctx, 0, 0, level),
    panelArt(ctx, 0, 0, level),
    mirrorArt(ctx, level >= 1),
    towerArt(),
    planterArt(level),
    ...[0, 1, 2].map((ring) => arcologyRingArt(ctx, ring, level)),
  ];
}

describe('drawings of the enriched map (§10.4)', () => {
  it('are well-formed SVG at every level, in every season and phase', () => {
    const parser = new DOMParser();
    for (const season of [null, 'spring', 'autumn', 'winter'] as const) {
      for (const level of [0, 2, 5]) {
        const ctx: ArtContext = { palette: palette(3, season), lit: -1, greenness: 0.8 };
        for (const art of drawings(ctx, level)) {
          const doc = parser.parseFromString(svgDocument(art, 2), 'image/svg+xml');
          expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
          expect(art.svg).not.toMatch(/NaN|undefined/);
        }
      }
    }
  });

  it('are the same drawing each time, so textures are shared and cached', () => {
    const ctx: ArtContext = { palette: palette(2, null), lit: 1, greenness: 0.5 };
    expect(drawings(ctx, 3).map((a) => a.svg)).toEqual(drawings(ctx, 3).map((a) => a.svg));
  });

  it('keeps spring leaves green, its blossom pink', () => {
    const spring = palette(2, 'spring');
    expect(spring.foliageLight).toBe('#b5d68e');
    expect(spring.blossom).toBe('#f2bfd3');
    expect(treeArt({ palette: spring, lit: 1, greenness: 1 }, 2, 7, 1).svg).toContain('#f2bfd3');
  });
});
