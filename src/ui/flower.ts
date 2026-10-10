// Growth stages and geometry of the clickable heliotrope (docs/game-design.md §10.4, "La fleur
// grandit"). Framework-free so the mapping from progression to what the flower shows stays
// testable.

/** Light earned this Season at which the flower reaches each stage (§6 phases fall on 3 and 5). */
export const FLOWER_STAGE_THRESHOLDS = [0, 100, 2_000, 1e4, 1e6, 1e7, 1e9] as const;

export type FlowerStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * The heliotrope grows with the Light earned in the current Season: a sprout, a bud, its first
 * flowers, a full head, a bouquet, a crown, then the solar heliotrope. A new Season replants it.
 */
export function flowerStage(seasonLight: number): FlowerStage {
  let stage = 0;
  for (let i = 1; i < FLOWER_STAGE_THRESHOLDS.length; i++) {
    if (seasonLight >= FLOWER_STAGE_THRESHOLDS[i]!) stage = i;
  }
  return stage as FlowerStage;
}

/** Where the stem leaves the soil of the pot, in the 200 × 260 flower view. */
export const SOIL = { x: 100, y: 222 } as const;

/** A flower head: a dome of florets, the inner ones open, the outer ones still in bud. */
export interface Head {
  x: number;
  y: number;
  radius: number;
  florets: number;
  /** Fraction of the florets that are open, from the centre outwards. */
  open: number;
}

export interface Leaf {
  /** Point of the stem it grows from. */
  x: number;
  y: number;
  length: number;
  /** Degrees; 0 points right. */
  angle: number;
}

export interface FlowerShape {
  /** Top of the main stem. */
  stemTop: number;
  leaves: Leaf[];
  /** Main head first, then the side heads. */
  heads: Head[];
  /** Side branches from the main stem to the side heads, as SVG paths. */
  branches: string[];
}

interface StageSpec {
  stemTop: number;
  leafPairs: number;
  main: Omit<Head, 'x' | 'y'> | null;
  side: Omit<Head, 'x' | 'y'> | null;
  sideCount: 0 | 1 | 2;
}

const STAGES: Record<FlowerStage, StageSpec> = {
  0: { stemTop: 194, leafPairs: 0, main: null, side: null, sideCount: 0 },
  1: {
    stemTop: 166,
    leafPairs: 1,
    main: { radius: 13, florets: 9, open: 0 },
    side: null,
    sideCount: 0,
  },
  2: {
    stemTop: 140,
    leafPairs: 2,
    main: { radius: 22, florets: 20, open: 0.45 },
    side: null,
    sideCount: 0,
  },
  3: {
    stemTop: 120,
    leafPairs: 3,
    main: { radius: 30, florets: 32, open: 0.75 },
    side: null,
    sideCount: 0,
  },
  4: {
    stemTop: 112,
    leafPairs: 3,
    main: { radius: 34, florets: 40, open: 0.85 },
    side: { radius: 17, florets: 13, open: 0.55 },
    sideCount: 1,
  },
  5: {
    stemTop: 106,
    leafPairs: 4,
    main: { radius: 38, florets: 48, open: 0.9 },
    side: { radius: 20, florets: 18, open: 0.75 },
    sideCount: 2,
  },
  6: {
    stemTop: 104,
    leafPairs: 4,
    main: { radius: 41, florets: 56, open: 1 },
    side: { radius: 22, florets: 22, open: 0.95 },
    sideCount: 2,
  },
};

/** Point of the main stem at height `y`: it leans slightly, like a plant turned to the sun. */
export function stemX(y: number, stemTop: number): number {
  const t = (SOIL.y - y) / (SOIL.y - stemTop);
  return round(SOIL.x + Math.sin(t * Math.PI) * -3 + t * 2);
}

/** The main stem as an SVG path. */
export function stemPath(stemTop: number): string {
  const span = SOIL.y - stemTop;
  return `M${SOIL.x} ${SOIL.y} C${SOIL.x - 4} ${round(SOIL.y - span * 0.4)} ${SOIL.x + 4} ${round(stemTop + span * 0.35)} ${stemX(stemTop, stemTop)} ${stemTop}`;
}

export function flowerShape(stage: FlowerStage): FlowerShape {
  const spec = STAGES[stage];
  const { stemTop } = spec;
  const top = stemX(stemTop, stemTop);

  // Leaves alternate left and right, the lowest the largest. The sprout only has its two round
  // seed leaves, drawn by the component.
  const leaves: Leaf[] = [];
  if (stage > 0) {
    const count = spec.leafPairs * 2;
    const highest = stemTop + (spec.main ? spec.main.radius * 0.55 + 14 : 12);
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const y = round(SOIL.y - 22 - t * (SOIL.y - 22 - highest));
      const right = i % 2 === 1;
      // Lower leaves are the largest and droop a little; upper ones reach up towards the light.
      const length = round(31 - t * 15 + Math.min(stage, 4) * 1.5 - (i % 3) * 1.5);
      const lean = 6 - t * 46;
      leaves.push({ x: stemX(y, stemTop), y, length, angle: right ? lean : 180 - lean });
    }
  }

  const heads: Head[] = [];
  const branches: string[] = [];
  if (spec.main) heads.push({ x: top, y: stemTop, ...spec.main });
  if (spec.side) {
    const sides: [number, number][] = [
      [-1, 36],
      [1, 26],
    ];
    for (const [dir, drop] of sides.slice(0, spec.sideCount)) {
      const fromY = stemTop + drop + 22;
      const fromX = stemX(fromY, stemTop);
      const x = round(top + dir * 46);
      const y = stemTop + drop;
      heads.push({ x, y, ...spec.side });
      branches.push(
        `M${fromX} ${fromY} C${round(fromX + dir * 10)} ${fromY - 4} ${round(x - dir * 8)} ${y + 12} ${x} ${y}`,
      );
    }
  }
  return { stemTop, leaves, heads, branches };
}

export interface Floret {
  x: number;
  y: number;
  size: number;
  /** Still a bud (outer florets of a head that is not fully open). */
  bud: boolean;
  /** 0, 1 or 2: three shades of violet so the head does not look flat. */
  shade: number;
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * The florets of a head, laid out with the golden angle on a dome seen slightly from above, and
 * sorted back to front so the nearer florets are drawn last.
 */
export function florets(head: Head): Floret[] {
  const { x, y, radius, florets: count, open } = head;
  const base = (radius / Math.sqrt(count)) * 1.55;
  const list: Floret[] = [];
  for (let i = 0; i < count; i++) {
    const r = radius * Math.sqrt((i + 0.5) / count);
    const a = i * GOLDEN_ANGLE;
    const depth = r / radius;
    // Florets near the centre sit higher on the dome.
    const lift = (1 - depth * depth) * radius * 0.28;
    list.push({
      x: round(x + Math.cos(a) * r),
      y: round(y + Math.sin(a) * r * 0.62 - lift),
      size: round(base * (1.08 - depth * 0.25)),
      bud: i >= Math.round(count * open),
      shade: (i * 7) % 3,
    });
  }
  return list.sort((a, b) => a.y - b.y);
}

/** A heliotrope floret: a corolla of five rounded lobes, `size` from centre to lobe tip. */
export function floretPath(size: number): string {
  const notch = size * 0.42;
  const parts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = ((i * 72 - 90) * Math.PI) / 180;
    const from = a - Math.PI / 5;
    const to = a + Math.PI / 5;
    const point = (angle: number, r: number) =>
      `${round(Math.cos(angle) * r)} ${round(Math.sin(angle) * r)}`;
    if (i === 0) parts.push(`M${point(from, notch)}`);
    parts.push(
      `C${point(from + 0.05, size * 1.18)} ${point(to - 0.05, size * 1.18)} ${point(to, notch)}`,
    );
  }
  return `${parts.join(' ')}Z`;
}

/** A leaf pointing right from (0, 0): pointed oval with a midrib and impressed veins. */
export function leafPaths(length: number): { blade: string; veins: string } {
  const w = length * 0.36;
  const blade = `M0 0 C${round(length * 0.18)} ${round(-w)} ${round(length * 0.72)} ${round(-w * 0.95)} ${length} 0 C${round(length * 0.72)} ${round(w * 0.95)} ${round(length * 0.18)} ${round(w)} 0 0Z`;
  const veins = [`M1 0 Q${round(length * 0.5)} ${round(-w * 0.06)} ${round(length * 0.94)} 0`];
  for (let k = 1; k <= 4; k++) {
    const vx = round((length * k) / 5.4);
    const reach = round(w * (0.78 - k * 0.1));
    const tip = round(vx + length * 0.16);
    veins.push(`M${vx} 0 Q${round(vx + length * 0.06)} ${-reach * 0.6} ${tip} ${-reach}`);
    veins.push(`M${vx} 0 Q${round(vx + length * 0.06)} ${reach * 0.6} ${tip} ${reach}`);
  }
  return { blade, veins: veins.join(' ') };
}

/**
 * Gilded sprigs on the arch, one per click upgrade (§5.2): [x, y, rotation in degrees]. The
 * first crowns the arch, the others climb down both sides in pairs.
 */
export const ARCH_ORNAMENTS: [number, number, number][] = [
  [100, 8, 0],
  [45, 31, -52],
  [155, 31, 52],
  [20, 112, -90],
  [180, 112, 90],
];

/** Seasons completed are counted by gold bands on the pot, up to this many. */
export const MAX_POT_BANDS = 6;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
