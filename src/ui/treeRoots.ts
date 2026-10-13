// The roots of the heliotrope tree on the map (docs/game-design.md §10.4, "L'arbre héliotrope"):
// from the courtyard they run under the neighbourhood, then the city, the neighbouring districts
// and the Bioregion, reaching each place as it opens or is restored. Pure data in world
// coordinates. Every root has a fixed parent, and its course is drawn from the tree's seed and
// its own name, so a root never moves once it has grown, whatever order the places came in.
import type { SiteId } from '../game/bioregion';
import type { DistrictId } from '../game/districts';
import type { ParcelId } from '../game/parcels';
import {
  FOREST_GARDEN_FIELDS,
  MARSHES,
  MEADOW_FIELDS,
  OLD_FOREST,
  TERRACES,
  smoothPath,
  type Point,
} from './bioregionMap';
import { DISTRICT_PLACES } from './districtMap';
import { COURTYARD, PLANTER, STREETS, WORLD, type Box, type View } from './neighbourhood';
import { PARCEL_PINS } from './restorationMap';
import { sequence } from './tree';

const [NORTH, SOUTH] = STREETS.horizontal.map((y) => y + STREETS.width / 2) as [number, number];
const [WEST, EAST] = STREETS.vertical.map((x) => x + STREETS.width / 2) as [number, number];

/** A root's end, the root it branches from and how thick it grows (world units). */
interface Node {
  at: Point;
  parent: string | null;
  width: number;
}

/** The roots that come with the views: the courtyard, the neighbourhood, the city, the land. */
const NODES: Record<string, Node> = {
  trunk: { at: [PLANTER.x, PLANTER.y], parent: null, width: 3 },
  // Under the home block, out to the four streets around it.
  north: { at: [PLANTER.x - 6, NORTH], parent: 'trunk', width: 2.4 },
  south: { at: [PLANTER.x + 8, SOUTH], parent: 'trunk', width: 2.4 },
  west: { at: [WEST, PLANTER.y + 4], parent: 'trunk', width: 2.2 },
  east: { at: [EAST, PLANTER.y - 3], parent: 'trunk', width: 2.2 },
  // To the four crossroads.
  northWest: { at: [WEST, NORTH], parent: 'north', width: 1.8 },
  northEast: { at: [EAST, NORTH], parent: 'east', width: 1.8 },
  southWest: { at: [WEST, SOUTH], parent: 'west', width: 1.8 },
  southEast: { at: [EAST, SOUTH], parent: 'south', width: 1.8 },
  // Along the avenues and streets, to the edges of the city.
  westNorth: { at: [14, NORTH], parent: 'northWest', width: 1.5 },
  westSouth: { at: [14, SOUTH], parent: 'southWest', width: 1.5 },
  eastNorth: { at: [WORLD.width - 14, NORTH], parent: 'northEast', width: 1.5 },
  eastSouth: { at: [WORLD.width - 14, SOUTH], parent: 'southEast', width: 1.5 },
  northWestUp: { at: [WEST, 12], parent: 'northWest', width: 1.5 },
  northEastUp: { at: [EAST, 12], parent: 'northEast', width: 1.5 },
  southWestDown: { at: [WEST, WORLD.height - 12], parent: 'southWest', width: 1.5 },
  southEastDown: { at: [EAST, WORLD.height - 12], parent: 'southEast', width: 1.5 },
  // Out into the Bioregion, the four great roots that reach for the land.
  landNorthWest: { at: [-330, -260], parent: 'westNorth', width: 4 },
  landNorthEast: { at: [930, -250], parent: 'eastNorth', width: 4 },
  landSouthWest: { at: [-320, 700], parent: 'westSouth', width: 4 },
  landSouthEast: { at: [940, 690], parent: 'eastSouth', width: 4 },
};

/** The roots each view brings. */
const VIEW_ROOTS: Record<View, string[]> = {
  1: ['trunk'],
  2: ['north', 'south', 'west', 'east', 'northWest', 'northEast', 'southWest', 'southEast'],
  3: [
    'westNorth',
    'westSouth',
    'eastNorth',
    'eastSouth',
    'northWestUp',
    'northEastUp',
    'southWestDown',
    'southEastDown',
  ],
  4: ['landNorthWest', 'landNorthEast', 'landSouthWest', 'landSouthEast'],
};

/** Where a restored parcel is reached: its pin, or the middle of its place. */
const PARCEL_TARGETS: Record<ParcelId, Point> = {
  ...PARCEL_PINS,
  pollinatorStrip: [WEST, 92],
  river: [EAST, 384],
  squares: [EAST, NORTH],
  livingRoofs: [263, 195],
};

function centre([x, y, w, h]: Box): Point {
  return [x + w / 2, y + h / 2];
}

/** The place where each regional site begins (§7.4), the first piece of it the land shows. */
function siteTarget(id: SiteId): Point | null {
  switch (id) {
    case 'meadows':
      return MEADOW_FIELDS[0] ? centre(MEADOW_FIELDS[0].box) : null;
    case 'foodForests':
      return FOREST_GARDEN_FIELDS[0] ? centre(FOREST_GARDEN_FIELDS[0].box) : null;
    case 'wetlands':
      return MARSHES[0] ? [MARSHES[0].x, MARSHES[0].y] : null;
    case 'oldForest':
      return OLD_FOREST[0] ? [OLD_FOREST[0].x, OLD_FOREST[0].y] : null;
    case 'hillsides':
      return TERRACES[0] ? TERRACES[0].at : null;
  }
}

/** The fixed root nearest a point among `names`, so a new root always joins the same one. */
function nearest(point: Point, names: readonly string[]): string {
  let best = names[0]!;
  let distance = Infinity;
  for (const name of names) {
    const [x, y] = NODES[name]!.at;
    const d = Math.hypot(x - point[0], y - point[1]);
    if (d < distance) {
      distance = d;
      best = name;
    }
  }
  return best;
}

const STREET_ROOTS = [...VIEW_ROOTS[1], ...VIEW_ROOTS[2], ...VIEW_ROOTS[3]];

/** One root as drawn on the map. */
export interface Root {
  id: string;
  d: string;
  width: number;
  /** Depth in the root network: 0 under the courtyard, more further out. */
  depth: number;
}

/** A shoot where a root reaches a place restored: a pair of leaves around a golden bud. */
export interface Shoot {
  id: string;
  x: number;
  y: number;
  /** Degrees, the direction the root came from, so the leaves open across it. */
  angle: number;
}

export interface RootNetwork {
  roots: Root[];
  shoots: Shoot[];
}

/** What the roots reach: the views opened, the places restored and the sites raised. */
export interface RootReach {
  view: View;
  parcels: readonly ParcelId[];
  districts: readonly DistrictId[];
  sites: readonly SiteId[];
  /** Fine rootlets in the courtyard, more as the tree ages (Seasons). */
  age: number;
}

/**
 * A root's course from `from` to `to`: it wanders a little to each side, more in the middle, by
 * an amount drawn from the tree's seed and the root's name.
 */
export function rootCourse(seed: number, id: string, from: Point, to: Point): string {
  const random = sequence((seed ^ hashName(id)) >>> 0);
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const steps = Math.max(2, Math.min(14, Math.round(length / 24)));
  const nx = -(to[1] - from[1]) / (length || 1);
  const ny = (to[0] - from[0]) / (length || 1);
  const amplitude = Math.min(16, length * 0.06);
  const phase = random() * Math.PI * 2;
  const wobble = 1.5 + random() * 2;
  const points: Point[] = [from];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const sway =
      Math.sin(t * Math.PI) *
      amplitude *
      (Math.sin(phase + t * Math.PI * wobble) * 0.75 + (random() - 0.5) * 0.5);
    points.push([
      round(from[0] + (to[0] - from[0]) * t + nx * sway),
      round(from[1] + (to[1] - from[1]) * t + ny * sway),
    ]);
  }
  points.push(to);
  return smoothPath(points);
}

/** Fine rootlets in the courtyard, around the foot of the tree: one more every half Season. */
function courtyardRootlets(seed: number, age: number): Root[] {
  const random = sequence((seed ^ 0x7f4a7c15) >>> 0);
  const count = Math.min(7, Math.floor(age * 2) + 1);
  const [cx, cy, cw, ch] = COURTYARD;
  const roots: Root[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + random() * 0.6;
    const reach = 0.55 + random() * 0.4;
    const to: Point = [
      round(Math.max(cx + 4, Math.min(cx + cw - 4, PLANTER.x + Math.cos(a) * (cw / 2) * reach))),
      round(Math.max(cy + 3, Math.min(cy + ch - 3, PLANTER.y + Math.sin(a) * (ch / 2) * reach))),
    ];
    if (i >= count) continue;
    const id = `rootlet-${i}`;
    roots.push({
      id,
      d: rootCourse(seed, id, [PLANTER.x, PLANTER.y], to),
      width: 0.9,
      depth: 1,
    });
  }
  return roots;
}

/**
 * The roots grown so far. A root is drawn with every root it branches from, and each place
 * restored grows a shoot at the end of its root.
 */
export function rootNetwork(seed: number, reach: RootReach): RootNetwork {
  const wanted = new Map<string, Node>();
  const shoots: Shoot[] = [];
  const add = (name: string) => {
    let current: string | null = name;
    while (current && !wanted.has(current)) {
      wanted.set(current, NODES[current]!);
      current = NODES[current]!.parent;
    }
  };
  for (let view = 1; view <= reach.view; view++) VIEW_ROOTS[view as View].forEach(add);

  // Places restored: a root of their own from the nearest street root, ending in a shoot.
  const extra: { id: string; node: Node }[] = [];
  const reachPlace = (id: string, at: Point, among: readonly string[], width: number) => {
    const parent = nearest(at, among);
    add(parent);
    const [px, py] = NODES[parent]!.at;
    const far = Math.hypot(at[0] - px, at[1] - py) > 6;
    if (far) extra.push({ id, node: { at, parent, width } });
    const [fx, fy] = far ? [px, py] : NODES[NODES[parent]!.parent ?? parent]!.at;
    shoots.push({
      id,
      x: round(at[0]),
      y: round(at[1]),
      angle: round((Math.atan2(at[1] - fy, at[0] - fx) * 180) / Math.PI),
    });
  };
  for (const id of reach.parcels) {
    reachPlace(`parcel-${id}`, PARCEL_TARGETS[id], STREET_ROOTS, 1.3);
  }
  for (const id of reach.districts) {
    reachPlace(`district-${id}`, centre(DISTRICT_PLACES[id]), VIEW_ROOTS[3], 2.2);
  }
  if (reach.view >= 4) {
    for (const id of reach.sites) {
      const at = siteTarget(id);
      if (at) reachPlace(`site-${id}`, at, [...VIEW_ROOTS[3], ...VIEW_ROOTS[4]], 3);
    }
  }

  const depthOf = (name: string): number => {
    let depth = 0;
    for (let p = NODES[name]?.parent; p; p = NODES[p]?.parent) depth++;
    return depth;
  };
  const roots: Root[] = [];
  for (const [name, node] of wanted) {
    if (!node.parent) continue;
    roots.push({
      id: name,
      d: rootCourse(seed, name, NODES[node.parent]!.at, node.at),
      width: node.width,
      depth: depthOf(name),
    });
  }
  for (const { id, node } of extra) {
    roots.push({
      id,
      d: rootCourse(seed, id, NODES[node.parent!]!.at, node.at),
      width: node.width,
      depth: depthOf(node.parent!) + 1,
    });
  }
  roots.sort((a, b) => b.width - a.width);
  return { roots: [...courtyardRootlets(seed, reach.age), ...roots], shoots };
}

/** A stable 32-bit number for a root's name. */
function hashName(name: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
