// Layout of the Bioregion around the city (docs/game-design.md §7.4, §10.4): the land beyond the
// outskirts, its river, hills and fields, and where the water collectors and regional sites
// appear. Pure data in world coordinates, next to the city plan in neighbourhood.ts.
import type { CollectorId, SiteId } from '../game/bioregion';
import { BUILDINGS, PLANTER, STREETS, WORLD, visibleElements, type Box } from './neighbourhood';

export type Point = readonly [number, number];

/** The grey suburbs kept around the city: the land begins beyond them. */
export const SUBURBS: Box = [-130, -110, WORLD.width + 260, WORLD.height + 220];
export const SUBURBS_RADIUS = 70;

/** How far the land is drawn, beyond the widest view on any screen shape. */
export const LAND: Box = [-1700, -1300, WORLD.width + 3400, WORLD.height + 2600];

/** The buried river of the city (§6.1) runs along this street; the regional river joins it. */
const RIVER_X = STREETS.vertical[1] + STREETS.width / 2;

/** The river, from the hills in the north to the plain in the south-east, through the city. */
export const RIVER_NORTH: Point[] = [
  [60, -1300],
  [180, -1020],
  [360, -860],
  [230, -640],
  [330, -420],
  [RIVER_X, -230],
  [RIVER_X, SUBURBS[1]],
];
export const RIVER_SOUTH: Point[] = [
  [RIVER_X, SUBURBS[1] + SUBURBS[3]],
  [RIVER_X, 680],
  [560, 820],
  [520, 980],
  [760, 1110],
  [1060, 1220],
  [1260, 1460],
];
/** The canals that carry the river across the suburbs to the city. */
export const CANALS: [Point, Point][] = [
  [
    [RIVER_X, SUBURBS[1]],
    [RIVER_X, 0],
  ],
  [
    [RIVER_X, WORLD.height],
    [RIVER_X, SUBURBS[1] + SUBURBS[3]],
  ],
];

export interface Hill {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

/** Four hills frame the plain; the old-growth forest climbs them. */
export const HILLS: Hill[] = [
  { x: -520, y: -360, rx: 330, ry: 220 },
  { x: 1120, y: -330, rx: 340, ry: 230 },
  { x: -470, y: 820, rx: 300, ry: 200 },
  { x: 1200, y: 760, rx: 280, ry: 190 },
];

/** Smooth path through points (Catmull-Rom turned into cubic Béziers). */
export function smoothPath(points: readonly Point[]): string {
  if (points.length === 0) return '';
  const [first] = points;
  let d = `M${first![0]} ${first![1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(points.length - 1, i + 2)]!;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${round(c1[0]!)} ${round(c1[1]!)} ${round(c2[0]!)} ${round(c2[1]!)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/** Points along a polyline every `step` world units, with the direction there (radians). */
function along(points: readonly Point[], step: number): { x: number; y: number; angle: number }[] {
  const result: { x: number; y: number; angle: number }[] = [];
  let carry = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i]!;
    const [x1, y1] = points[i + 1]!;
    const length = Math.hypot(x1 - x0, y1 - y0);
    const angle = Math.atan2(y1 - y0, x1 - x0);
    for (let d = carry; d < length; d += step) {
      result.push({ x: x0 + ((x1 - x0) * d) / length, y: y0 + ((y1 - y0) * d) / length, angle });
    }
    carry = (carry - length) % step;
    if (carry < 0) carry += step;
  }
  return result;
}

function distanceToSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Distance from a point to the river. */
export function distanceToRiver(point: Point): number {
  let best = Infinity;
  for (const course of [RIVER_NORTH, RIVER_SOUTH]) {
    for (let i = 0; i < course.length - 1; i++) {
      best = Math.min(best, distanceToSegment(point, course[i]!, course[i + 1]!));
    }
  }
  return best;
}

function insideHill([x, y]: Point, margin = 1): boolean {
  return HILLS.some((h) => ((x - h.x) / h.rx) ** 2 + ((y - h.y) / h.ry) ** 2 < margin);
}

function insideBox([x, y]: Point, [bx, by, bw, bh]: Box, margin = 0): boolean {
  return x > bx - margin && x < bx + bw + margin && y > by - margin && y < by + bh + margin;
}

function fromHome([x, y]: Point): number {
  return Math.hypot(x - PLANTER.x, y - PLANTER.y);
}

/** A small stable number for a place, so the land varies without randomness. */
export function landHash(x: number, y: number): number {
  return Math.abs(Math.round(x * 31 + y * 57 + x * y * 0.013)) % 101;
}

export interface Field {
  box: Box;
  /** 0 to 2: wheat, young green, ochre furrows. */
  crop: number;
  /** Furrows' direction in degrees. */
  angle: number;
}

/**
 * The plain's fields, a patchwork between the suburbs, the hills and the river, nearest home
 * first. The meadows and food forests (§7.4) take some of them over, level after level.
 */
export const FIELDS: Field[] = (() => {
  const fields: Field[] = [];
  const [lx, ly] = [-980, -760];
  const [cw, ch] = [168, 124];
  for (let y = ly; y < 1240; y += ch) {
    for (let x = lx; x < 1580; x += cw) {
      // Every other row is offset and each field is a little smaller than its cell, by a
      // stable amount: hedged fields of many sizes rather than a grid.
      const row = Math.round((y - ly) / ch);
      const seed = landHash(x, y);
      const w = cw - 18 - (seed % 4) * 9;
      const h = ch - 16 - ((seed >> 2) % 3) * 12;
      const ox = x + (row % 2 === 1 ? cw / 2 : 0) + (seed % 5);
      const box: Box = [ox, y + ((seed >> 1) % 4), w, h];
      const centre: Point = [ox + w / 2, y + h / 2];
      // The plain fades into the haze beyond the widest view.
      if (((centre[0] - 300) / 1150) ** 2 + ((centre[1] - 225) / 900) ** 2 > 1) continue;
      const corners: Point[] = [
        [ox, y],
        [ox + w, y],
        [ox, y + h],
        [ox + w, y + h],
      ];
      if (corners.some((c) => insideBox(c, SUBURBS, 20))) continue;
      if (insideHill(centre, 1.15)) continue;
      if (distanceToRiver(centre) < 95) continue;
      fields.push({ box, crop: seed % 3, angle: seed % 2 === 0 ? 0 : 90 });
    }
  }
  return fields.sort((a, b) => fromHome(centreOf(a.box)) - fromHome(centreOf(b.box)));
})();

function centreOf([x, y, w, h]: Box): Point {
  return [x + w / 2, y + h / 2];
}

/** Fields the agrivoltaic meadows take over, then the ones the food forests take over. */
export const MEADOW_FIELDS: Field[] = FIELDS.filter((_, i) => i % 3 === 0);
export const FOREST_GARDEN_FIELDS: Field[] = FIELDS.filter((_, i) => i % 3 === 1);

export interface Marsh {
  x: number;
  y: number;
  rx: number;
  ry: number;
  /** Degrees, along the river. */
  angle: number;
}

/** Wetlands along the river banks, nearest home first. */
export const MARSHES: Marsh[] = [...along(RIVER_NORTH, 130), ...along(RIVER_SOUTH, 130)]
  .filter((p) => !insideBox([p.x, p.y], SUBURBS, 30))
  .map((p, i) => {
    const side = i % 2 === 0 ? 1 : -1;
    const normal = p.angle + Math.PI / 2;
    return {
      x: round(p.x + Math.cos(normal) * 48 * side),
      y: round(p.y + Math.sin(normal) * 48 * side),
      rx: 46 + (i % 3) * 8,
      ry: 22 + (i % 2) * 6,
      angle: round((p.angle * 180) / Math.PI),
    };
  })
  .sort((a, b) => fromHome([a.x, a.y]) - fromHome([b.x, b.y]));

export interface Crown {
  x: number;
  y: number;
  r: number;
}

/** Crowns of the old-growth forest on the hills, from each hill's top outwards. */
export const OLD_FOREST: Crown[] = (() => {
  const crowns: Crown[] = [];
  HILLS.forEach((hill, k) => {
    for (let ring = 0; ring < 6; ring++) {
      const count = ring === 0 ? 1 : ring * 7;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + ring * 0.5 + k;
        const f = ring / 6.2;
        crowns.push({
          x: round(hill.x + Math.cos(a) * hill.rx * f),
          y: round(hill.y + Math.sin(a) * hill.ry * f),
          r: 22 - ring * 1.5 + ((i * 5) % 4),
        });
      }
    }
  });
  // The hills are greened together, a ring at a time.
  return crowns.sort((a, b) => ringOf(a) - ringOf(b));
})();

function ringOf({ x, y }: Crown): number {
  const hill = HILLS.reduce((best, h) =>
    Math.hypot(x - h.x, y - h.y) < Math.hypot(x - best.x, y - best.y) ? h : best,
  );
  return Math.hypot((x - hill.x) / hill.rx, (y - hill.y) / hill.ry);
}

export interface Terrace {
  /** The terrace's wall and its rows of vines, along a contour of the hill. */
  d: string;
  /** Middle of the terrace, where it enters. */
  at: Point;
  /** Half its length, roughly: the size of its golden ring. */
  size: number;
}

/**
 * The hillsides (§7.5): terraces of vines on the sunny southern flank of each hill, below the
 * old-growth forest, the lowest of every hill first.
 */
export const TERRACES: Terrace[] = (() => {
  const terraces: (Terrace & { order: number })[] = [];
  HILLS.forEach((hill) => {
    [1.1, 1, 0.9].forEach((f, row) => {
      [
        [0.35, 1.5],
        [1.64, 2.8],
      ].forEach(([a0, a1], half) => {
        const points: Point[] = [];
        for (let i = 0; i <= 6; i++) {
          const a = a0! + ((a1! - a0!) * i) / 6;
          points.push([
            round(hill.x + Math.cos(a) * hill.rx * f),
            round(hill.y + Math.sin(a) * hill.ry * f),
          ]);
        }
        const mid = (a0! + a1!) / 2;
        terraces.push({
          d: smoothPath(points),
          at: [
            round(hill.x + Math.cos(mid) * hill.rx * f),
            round(hill.y + Math.sin(mid) * hill.ry * f),
          ],
          size: round(hill.rx * f * 0.45),
          order: row * 2 + half,
        });
      });
    });
  });
  return terraces.sort((a, b) => a.order - b.order).map(({ d, at, size }) => ({ d, at, size }));
})();

/** Ponds dug just beyond the suburbs, nearest home first. */
export const PONDS: Crown[] = (() => {
  const [sx, sy, sw, sh] = SUBURBS;
  const ponds: Crown[] = [];
  const cx = sx + sw / 2;
  const cy = sy + sh / 2;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.2;
    const x = cx + Math.cos(a) * (sw / 2 + 90);
    const y = cy + Math.sin(a) * (sh / 2 + 80);
    if (distanceToRiver([x, y]) < 60) continue;
    ponds.push({ x: round(x), y: round(y), r: 20 + (i % 3) * 6 });
  }
  return ponds.sort((a, b) => fromHome([a.x, a.y]) - fromHome([b.x, b.y]));
})();

/** Streams opened again: from each hill down to the river, two per hill. */
export const STREAMS: string[] = HILLS.flatMap((hill, k) =>
  [-0.35, 0.35].map((spread) => {
    const start: Point = [hill.x + hill.rx * spread, hill.y - hill.ry * 0.2 * Math.sign(spread)];
    const target = nearestRiverPoint(start);
    const mid: Point = [
      (start[0] + target[0]) / 2 + 40 * Math.sign(spread),
      (start[1] + target[1]) / 2 + (k % 2 === 0 ? 30 : -30),
    ];
    return smoothPath([start, mid, target].map(([x, y]) => [round(x), round(y)] as const));
  }),
);

function nearestRiverPoint(point: Point): Point {
  let best: Point = RIVER_NORTH[0]!;
  for (const p of [...along(RIVER_NORTH, 20), ...along(RIVER_SOUTH, 20)]) {
    if (insideBox([p.x, p.y], SUBURBS, 40)) continue;
    if (
      Math.hypot(p.x - point[0], p.y - point[1]) <
      Math.hypot(best[0] - point[0], best[1] - point[1])
    ) {
      best = [p.x, p.y];
    }
  }
  return best;
}

/** Rooftop tanks: one on a corner of each building of the city, from home outwards. */
export const ROOF_TANKS: Point[] = BUILDINGS.map(({ box: [x, y, w, h] }) => {
  const r = 3.2;
  return [round(x + w - r - 3), round(y + h - r - 3)] as Point;
}).sort((a, b) => fromHome(a) - fromHome(b));

/** Swales: planted ditches along the kerbs of the streets, from home outwards. */
export const SWALES: Box[] = (() => {
  const { horizontal, vertical, width } = STREETS;
  const swales: Box[] = [];
  const stops = [0, ...vertical.flatMap((x) => [x - 4, x + width + 4]), WORLD.width];
  for (const y of horizontal) {
    for (let i = 0; i < stops.length - 1; i += 2) {
      const x0 = stops[i]! + 6;
      const x1 = stops[i + 1]! - 6;
      swales.push([x0, y - 3.5, x1 - x0, 3], [x0, y + width + 0.5, x1 - x0, 3]);
    }
  }
  return swales.sort((a, b) => fromHome(centreOf(a)) - fromHome(centreOf(b)));
})();

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** The regional river, north and south of the city, as SVG paths. */
export const RIVER = [smoothPath(RIVER_NORTH), smoothPath(RIVER_SOUTH)];

/** Streaks of the shower's rain, around its centre. */
export const RAIN = Array.from({ length: 70 }, (_, i) => {
  const x = -230 + ((i * 47) % 460);
  const y = -120 + ((i * 83) % 240);
  return `M${x} ${y}l-6 16`;
}).join('');

/** What the land shows for the regional sites raised and the collectors built. */
export interface LandShown {
  /** Fields still farmed: those not yet turned into meadows or food forests. */
  fields: Field[];
  meadows: Field[];
  gardens: Field[];
  marshes: Marsh[];
  crowns: Crown[];
  terraces: Terrace[];
  ponds: Crown[];
  streams: string[];
  tanks: Point[];
  swales: Box[];
}

export function landShown(
  sites: Record<SiteId, number>,
  collectors: Record<CollectorId, number>,
): LandShown {
  const meadows = MEADOW_FIELDS.slice(0, visibleElements(sites.meadows, MEADOW_FIELDS.length, 2));
  const gardens = FOREST_GARDEN_FIELDS.slice(
    0,
    visibleElements(sites.foodForests, FOREST_GARDEN_FIELDS.length, 2),
  );
  const taken = new Set([...meadows, ...gardens]);
  return {
    fields: FIELDS.filter((field) => !taken.has(field)),
    meadows,
    gardens,
    marshes: MARSHES.slice(0, visibleElements(sites.wetlands, MARSHES.length, 2)),
    crowns: OLD_FOREST.slice(0, visibleElements(sites.oldForest, OLD_FOREST.length, 14)),
    terraces: TERRACES.slice(0, visibleElements(sites.hillsides, TERRACES.length, 2)),
    ponds: PONDS.slice(0, visibleElements(collectors.ponds, PONDS.length)),
    streams: STREAMS.slice(0, visibleElements(collectors.streams, STREAMS.length)),
    tanks: ROOF_TANKS.slice(0, visibleElements(collectors.roofTanks, ROOF_TANKS.length)),
    swales: SWALES.slice(0, visibleElements(collectors.swales, SWALES.length)),
  };
}
