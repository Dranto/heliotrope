// The heliotrope tree at the heart of the courtyard (docs/game-design.md §10.4, "L'arbre
// héliotrope"): a procedural tree, seeded per save, that grows over the whole game. Its limbs are
// drawn once at full size from the seed, each with the age (in Seasons) at which it starts to
// grow, so the tree only ever adds wood: Seasons thicken it and lengthen its limbs, and the Light
// of the current Season leafs it out and makes it bloom. Framework-free so it stays testable.
import { nextRandom } from '../game/random';
import { FLOWER_STAGE_THRESHOLDS, type FlowerStage, type Head } from './flower';

/** Size of the tree's drawing, the same frame the flower and its arch had. */
export const TREE_VIEW = { width: 200, height: 260 } as const;
/** Where the trunk leaves the ground, on the courtyard planter. */
export const BASE = { x: 100, y: 246 } as const;
/**
 * Box the crown stays in, in the drawing: the touch target keeps clear of the species resting
 * around the courtyard (speciesMap.test.ts), so the tree grows wide rather than tall.
 */
export const CROWN_BOX = { left: 31, top: 74, right: 169, bottom: 200 } as const;

/** One limb of the tree, from the trunk (depth 0) to the twigs. */
export interface Limb {
  /** Index of the limb it grows from, -1 for the trunk. */
  parent: number;
  depth: number;
  /** Where along its parent it starts, from 0 (base) to 1 (tip). */
  at: number;
  /** Direction at full growth, in radians (-π/2 points up). */
  angle: number;
  /** Full length, in drawing units. */
  length: number;
  /** Sideways bow of the limb, as a share of its length. */
  bend: number;
  /** Age of the tree (in Seasons) when it starts to grow. */
  birth: number;
  /** Seasons it takes to reach its full length. */
  grow: number;
}

const MAX_DEPTH = 6;

/** A random sequence drawn from a 32-bit seed. */
export function sequence(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    const [value, next] = nextRandom(state);
    state = next;
    return value;
  };
}

/**
 * Every limb the tree will ever have, parents before children, scaled so the grown crown fits
 * `CROWN_BOX`. The same seed always gives the same tree.
 */
export function treeSkeleton(seed: number): Limb[] {
  const random = sequence(seed ^ 0x51ed270b);
  const between = (a: number, b: number) => a + random() * (b - a);
  const limbs: Limb[] = [
    {
      parent: -1,
      depth: 0,
      at: 0,
      angle: -Math.PI / 2 + between(-0.06, 0.06),
      length: 64,
      bend: between(-0.06, 0.06),
      birth: 0,
      grow: 0.25,
    },
  ];
  for (let i = 0; i < limbs.length; i++) {
    const limb = limbs[i]!;
    if (limb.depth >= MAX_DEPTH) continue;
    const depth = limb.depth + 1;
    // The trunk opens into three or four scaffold limbs, then each limb forks in two, now and
    // then in three.
    const count = limb.depth === 0 ? (random() < 0.5 ? 3 : 4) : random() < 0.22 ? 3 : 2;
    const spread = limb.depth === 0 ? between(1.5, 1.9) : between(0.75, 1.05);
    for (let k = 0; k < count; k++) {
      const offset = (k / (count - 1) - 0.5) * spread;
      let angle = limb.angle + offset + between(-0.14, 0.14);
      // Limbs reach up towards the light, the outer twigs droop a little under their leaves.
      angle += (-Math.PI / 2 - angle) * (depth <= 2 ? 0.18 : 0.04);
      angle += depth >= 4 ? Math.sign(Math.cos(angle)) * 0.08 : 0;
      limbs.push({
        parent: i,
        depth,
        at: limb.depth === 0 ? between(0.82, 1) : between(0.88, 1),
        angle,
        length: limb.length * (limb.depth === 0 ? between(0.6, 0.72) : between(0.7, 0.82)),
        bend: between(-0.12, 0.12),
        birth: limb.birth + limb.grow * between(0.48, 0.6),
        grow: 0.22 + depth * 0.16,
      });
    }
    // A shorter side limb halfway up the larger limbs, so the crown fills in from inside.
    if (limb.depth >= 1 && limb.depth <= 3) {
      const side = random() < 0.5 ? -1 : 1;
      limbs.push({
        parent: i,
        depth,
        at: between(0.42, 0.62),
        angle: limb.angle + side * between(0.55, 0.85),
        length: limb.length * between(0.48, 0.6),
        bend: between(-0.1, 0.1),
        birth: limb.birth + limb.grow * between(0.7, 0.9),
        grow: 0.22 + depth * 0.16,
      });
    }
  }
  return fitCrown(limbs);
}

/** Scale the limbs so the grown tree stays inside `CROWN_BOX`. */
function fitCrown(limbs: Limb[]): Limb[] {
  const grown = layout(limbs, Infinity, 1);
  let left: number = BASE.x;
  let right: number = BASE.x;
  let top: number = BASE.y;
  for (const segment of grown) {
    left = Math.min(left, segment.x1);
    right = Math.max(right, segment.x1);
    top = Math.min(top, segment.y1);
  }
  // Leaf clusters reach a little beyond the twig tips.
  const pad = 9;
  const scale = Math.min(
    1,
    (BASE.x - CROWN_BOX.left - pad) / Math.max(1, BASE.x - left),
    (CROWN_BOX.right - pad - BASE.x) / Math.max(1, right - BASE.x),
    (BASE.y - CROWN_BOX.top - pad) / Math.max(1, BASE.y - top),
  );
  return limbs.map((limb) => ({ ...limb, length: limb.length * scale }));
}

/** A limb as drawn at some age: a curved segment from (x0, y0) to (x1, y1). */
export interface Segment {
  index: number;
  depth: number;
  x0: number;
  y0: number;
  /** Control point of the curve. */
  cx: number;
  cy: number;
  x1: number;
  y1: number;
  /** Width at the base and at the tip. */
  w0: number;
  w1: number;
  /** Share of its full length grown so far, from 0 to 1. */
  grown: number;
}

/** How much of a limb has grown at `age`, eased so it slows as it reaches its length. */
function grownShare(limb: Limb, age: number): number {
  const t = Math.max(0, Math.min(1, (age - limb.birth) / limb.grow));
  return 1 - (1 - t) * (1 - t);
}

/**
 * The tree's overall size at `age`: a young tree by the end of the first Season, close to grown
 * after five, still filling out after that.
 */
export function treeScale(age: number): number {
  return 0.78 + 0.22 * (1 - Math.exp(-age / 2));
}

function pointOn(s: Segment, t: number): [number, number] {
  const u = 1 - t;
  return [
    u * u * s.x0 + 2 * u * t * s.cx + t * t * s.x1,
    u * u * s.y0 + 2 * u * t * s.cy + t * t * s.y1,
  ];
}

/** The limbs grown at `age`, scaled by `scale`; limbs not started yet are left out. */
function layout(limbs: readonly Limb[], age: number, scale: number): Segment[] {
  const placed: (Segment | null)[] = [];
  const segments: Segment[] = [];
  limbs.forEach((limb, index) => {
    const parent = limb.parent >= 0 ? placed[limb.parent] : null;
    // The trunk shows from the first moment, as a seedling's stem.
    const grown = limb.parent < 0 ? Math.max(0.16, grownShare(limb, age)) : grownShare(limb, age);
    if ((limb.parent >= 0 && !parent) || grown <= 0) {
      placed.push(null);
      return;
    }
    const [x0, y0] = parent ? pointOn(parent, limb.at) : [BASE.x, BASE.y];
    const length = limb.length * grown * scale;
    const x1 = x0 + Math.cos(limb.angle) * length;
    const y1 = y0 + Math.sin(limb.angle) * length;
    const bow = limb.bend * length;
    const segment: Segment = {
      index,
      depth: limb.depth,
      x0,
      y0,
      cx: (x0 + x1) / 2 - Math.sin(limb.angle) * bow,
      cy: (y0 + y1) / 2 + Math.cos(limb.angle) * bow,
      x1,
      y1,
      w0: 0,
      w1: 0,
      grown,
    };
    placed.push(segment);
    segments.push(segment);
  });
  return segments;
}

/**
 * Widths follow the pipe model: a limb is as thick as all the wood it carries (summed with the
 * exponent of real trees, a little above 2), so the trunk thickens as the crown grows and every
 * fork stays continuous.
 */
const PIPE = 2.5;

function setWidths(segments: Segment[], limbs: readonly Limb[], scale: number): void {
  const carried = new Map<number, number>();
  const twig = 0.85 * scale;
  for (let i = segments.length - 1; i >= 0; i--) {
    const s = segments[i]!;
    const own = (twig * (0.6 + 0.4 * s.grown)) ** PIPE;
    const area = (carried.get(s.index) ?? 0) + own;
    s.w0 = area ** (1 / PIPE);
    s.w1 = Math.max(twig * 0.55, (carried.get(s.index) ?? own) ** (1 / PIPE) * 0.8);
    const parent = limbs[s.index]!.parent;
    if (parent >= 0) carried.set(parent, (carried.get(parent) ?? 0) + area);
  }
}

/** A cluster of leaves at the end of a twig. */
export interface Cluster {
  x: number;
  y: number;
  radius: number;
  /** Depth of the limb it grows on: deeper ones are drawn last, on the outside of the crown. */
  depth: number;
  /** A stable number per cluster, for its lobes and its blossoms. */
  key: number;
}

/** One leaf drawn on its own, while the tree is still a sapling. */
export interface SaplingLeaf {
  x: number;
  y: number;
  length: number;
  /** Degrees; 0 points right. */
  angle: number;
}

/** A surface root spreading over the planter from the foot of the trunk. */
export interface FootRoot {
  d: string;
  width: number;
}

export interface TreeShape {
  limbs: Segment[];
  clusters: Cluster[];
  /** Leaves along the stem of the young tree, fading out as the crown forms. */
  leaves: SaplingLeaf[];
  /** The two seed leaves of the seedling, shown at the very start only. */
  seedling: boolean;
  heads: Head[];
  roots: FootRoot[];
  /** Centre and radius of the crown, for its glow, the arrival rings and the click. */
  crown: { x: number; y: number; radius: number };
}

/** Share of the twigs that bloom at each stage of the Season, and how open their heads are. */
const BLOOM: Record<FlowerStage, { share: number; open: number }> = {
  0: { share: 0, open: 0 },
  1: { share: 0.12, open: 0 },
  2: { share: 0.18, open: 0.45 },
  3: { share: 0.26, open: 0.75 },
  4: { share: 0.32, open: 0.85 },
  5: { share: 0.38, open: 0.9 },
  6: { share: 0.44, open: 1 },
};
const MAX_HEADS = 16;

/**
 * The tree at `age` (Seasons, see `treeAge`), leafed out by `leaves` (from 0, bare buds at the
 * start of a Season, to 1) and blooming at `stage`.
 */
export function treeShape(
  limbs: readonly Limb[],
  age: number,
  leaves: number,
  stage: FlowerStage,
): TreeShape {
  const scale = treeScale(age);
  const segments = layout(limbs, age, scale);
  setWidths(segments, limbs, scale);
  const trunk = segments[0]!;
  const deepest = segments.reduce((max, s) => Math.max(max, s.depth), 0);

  // Leaves gather at the ends of the twigs, and along the outer limbs once there are many.
  const hasChild = new Set(segments.map((s) => limbs[s.index]!.parent));
  const clusters: Cluster[] = [];
  for (const s of segments) {
    if (s.depth === 0) continue;
    const tip = !hasChild.has(s.index);
    if (!tip && s.depth < deepest - 1) continue;
    const length = Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
    const radius = Math.max(2.5, Math.min(12, 3.5 + length * 0.32)) * (0.2 + 0.8 * leaves);
    clusters.push({ x: s.x1, y: s.y1 - radius * 0.25, radius, depth: s.depth, key: s.index });
  }
  clusters.sort((a, b) => a.depth - b.depth || a.y - b.y);

  // Until the crown forms, the young tree carries single leaves up its stem.
  const sapling = Math.max(0, 1 - age / 0.45);
  const saplingLeaves: SaplingLeaf[] = [];
  if (sapling > 0 && age > 0.04) {
    const count = Math.min(6, 2 + Math.floor(age * 16));
    for (let i = 0; i < count; i++) {
      const t = 0.35 + (0.6 * i) / Math.max(1, count - 1);
      const [x, y] = pointOn(trunk, t);
      const right = i % 2 === 1;
      const lean = 10 - t * 40;
      saplingLeaves.push({
        x: round(x),
        y: round(y),
        length: round((9 + 6 * (1 - t)) * sapling * (0.4 + 0.6 * leaves) + 2),
        angle: right ? lean : 180 - lean,
      });
    }
  }

  const bloom = BLOOM[stage];
  const heads: Head[] = [];
  if (bloom.share > 0 && clusters.length > 0) {
    // The same twigs bloom first in every Season: those whose key draws lowest.
    const ranked = [...clusters]
      .filter((c) => c.depth >= Math.min(2, deepest))
      .sort((a, b) => keyRank(a.key) - keyRank(b.key));
    const count = Math.min(MAX_HEADS, Math.max(1, Math.round(ranked.length * bloom.share)));
    for (const c of ranked.slice(0, count)) {
      const radius = round(Math.max(3, c.radius * 0.62));
      heads.push({
        x: round(c.x + ((keyRank(c.key) * 7) % 1) * c.radius * 0.5 - c.radius * 0.25),
        y: round(c.y - c.radius * 0.45),
        radius,
        florets: Math.max(5, Math.min(12, Math.round(radius * 1.4))),
        open: bloom.open,
      });
    }
    heads.sort((a, b) => a.y - b.y);
  }

  // Surface roots spread over the planter as the trunk thickens.
  const roots: FootRoot[] = [];
  const spread = Math.min(1, age / 3);
  if (age > 0.25) {
    const random = sequence(limbs.length * 7919 + Math.round(trunk.x1 * 13));
    for (const side of [-1, 1, -0.45, 0.5]) {
      const reach = (12 + random() * 10) * (0.35 + 0.65 * spread) * Math.abs(side);
      const x1 = BASE.x + side * (trunk.w0 * 0.3 + reach);
      const y1 = BASE.y + 2 + random() * 3;
      roots.push({
        d: `M${round(BASE.x + side * trunk.w0 * 0.15)} ${BASE.y - 3} Q${round(BASE.x + side * (trunk.w0 * 0.45 + reach * 0.3))} ${BASE.y} ${round(x1)} ${round(y1)}`,
        width: round(trunk.w0 * 0.32 * (0.6 + 0.4 * Math.abs(side))),
      });
    }
  }

  let crown = { x: trunk.x1, y: trunk.y1, radius: 14 };
  if (clusters.length > 0) {
    let [left, right, top, bottom] = [Infinity, -Infinity, Infinity, -Infinity];
    for (const c of clusters) {
      left = Math.min(left, c.x - c.radius);
      right = Math.max(right, c.x + c.radius);
      top = Math.min(top, c.y - c.radius);
      bottom = Math.max(bottom, c.y + c.radius);
    }
    crown = {
      x: round((left + right) / 2),
      y: round((top + bottom) / 2),
      radius: round(Math.max(14, (right - left) / 2, (bottom - top) / 2)),
    };
  }

  return {
    limbs: segments,
    clusters,
    leaves: saplingLeaves,
    seedling: age < 0.12,
    heads,
    roots,
    crown,
  };
}

/** A stable number in [0, 1) for a cluster key. */
function keyRank(key: number): number {
  return (((key * 0.6180339887) % 1) + 1) % 1;
}

/**
 * The limb as a filled, tapering shape: its two edges follow the curve, from `w0` wide at the
 * base to `w1` at the tip.
 */
export function limbPath(s: Segment): string {
  const steps = 5;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [x, y] = pointOn(s, t);
    // Tangent of the quadratic curve.
    const dx = 2 * (1 - t) * (s.cx - s.x0) + 2 * t * (s.x1 - s.cx);
    const dy = 2 * (1 - t) * (s.cy - s.y0) + 2 * t * (s.y1 - s.cy);
    const norm = Math.hypot(dx, dy) || 1;
    const half = (s.w0 + (s.w1 - s.w0) * t) / 2;
    const nx = (-dy / norm) * half;
    const ny = (dx / norm) * half;
    left.push(`${round(x + nx)} ${round(y + ny)}`);
    right.unshift(`${round(x - nx)} ${round(y - ny)}`);
  }
  return `M${left.join(' L')} L${right.join(' L')}Z`;
}

/** The lit edge of a limb, on the sun's side (upper left), as a stroke along its curve. */
export function limbLight(s: Segment): string {
  const shift = s.w0 * 0.22;
  return `M${round(s.x0 - shift)} ${round(s.y0)} Q${round(s.cx - shift * 0.8)} ${round(s.cy)} ${round(s.x1 - shift * 0.5)} ${round(s.y1)}`;
}

/**
 * The lobes of a leaf cluster: a few overlapping rounds around its centre, so the crown reads
 * as tufts of leaves rather than balls. [dx, dy, r] relative to the cluster.
 */
export function clusterLobes(c: Cluster): [number, number, number][] {
  const lobes: [number, number, number][] = [[0, 0, c.radius * 0.9]];
  const count = 5;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + keyRank(c.key) * Math.PI * 2;
    lobes.push([
      round(Math.cos(a) * c.radius * 0.7),
      round(Math.sin(a) * c.radius * 0.55),
      round(c.radius * (0.48 + ((i * 0.37 + keyRank(c.key)) % 1) * 0.2)),
    ]);
  }
  return lobes;
}

/** The crown's passes, each one path: the shade under every tuft, three tones of leaves, light. */
export interface CrownPaths {
  shade: string;
  tones: [string, string, string];
  light: string;
}

function circle(x: number, y: number, r: number): string {
  return `M${round(x - r)} ${round(y)}a${round(r)} ${round(r)} 0 1 0 ${round(2 * r)} 0a${round(r)} ${round(r)} 0 1 0 ${round(-2 * r)} 0`;
}

/**
 * The crown drawn in a few paths rather than a shape per tuft, so the large tree stays light to
 * render: the tufts read as one mass of leaves lit from the upper left.
 */
export function crownPaths(clusters: readonly Cluster[]): CrownPaths {
  const shade: string[] = [];
  const tones: [string[], string[], string[]] = [[], [], []];
  const light: string[] = [];
  for (const c of clusters) {
    const lobes = clusterLobes(c);
    lobes.forEach(([dx, dy, r], k) => {
      shade.push(circle(c.x + dx + r * 0.2, c.y + dy + r * 0.28, r));
      tones[(c.key + k) % 3]!.push(circle(c.x + dx, c.y + dy, r));
    });
    const [dx, dy, r] = lobes[0]!;
    // A tilted oval of light on the upper left of each tuft.
    const cx = c.x + dx - r * 0.34;
    const cy = c.y + dy - r * 0.4;
    const rx = r * 0.42;
    const ry = r * 0.3;
    const ux = Math.cos(-Math.PI / 6) * rx;
    const uy = Math.sin(-Math.PI / 6) * rx;
    light.push(
      `M${round(cx - ux)} ${round(cy - uy)}a${round(rx)} ${round(ry)} -30 1 0 ${round(2 * ux)} ${round(2 * uy)}a${round(rx)} ${round(ry)} -30 1 0 ${round(-2 * ux)} ${round(-2 * uy)}`,
    );
  }
  return {
    shade: shade.join(''),
    tones: tones.map((list) => list.join('')) as [string, string, string],
    light: light.join(''),
  };
}

/**
 * How far the current Season has come in the flower stages, as a continuous number from 0 to 6:
 * between two thresholds it moves with the logarithm of the Light, as the stages do.
 */
export function seasonGrowth(seasonLight: number): number {
  const t = FLOWER_STAGE_THRESHOLDS;
  if (seasonLight >= t[t.length - 1]!) return t.length - 1;
  if (seasonLight < t[1]!) return Math.max(0, seasonLight) / t[1]!;
  for (let i = 1; i < t.length - 1; i++) {
    const low = t[i]!;
    const high = t[i + 1]!;
    if (seasonLight < high) return i + Math.log(seasonLight / low) / Math.log(high / low);
  }
  return t.length - 1;
}

/**
 * The age of the tree in Seasons: one per Season completed, plus how far the current one has
 * come. It never goes back, since a new Season starts where the last one ended. Rounded to a
 * small step so the drawing only changes when the tree visibly grows.
 */
export function treeAge(seasons: number, seasonLight: number): number {
  return Math.round((seasons + seasonGrowth(seasonLight) / 6) * 48) / 48;
}

/**
 * How leafed out the tree is in the current Season: bare buds when it starts, in full leaf from
 * the third stage. The young tree of the first Season keeps a few leaves from the start.
 */
export function leafOut(seasons: number, seasonLight: number): number {
  const growth = seasonGrowth(seasonLight);
  const out = Math.min(1, 0.15 + growth * 0.32);
  return Math.round((seasons === 0 ? Math.max(out, 0.5) : out) * 20) / 20;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
