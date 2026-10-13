// Bloom stages and flower geometry of the heliotrope tree (docs/game-design.md §10.4, "L'arbre
// héliotrope"): how far the current Season has come, and the heliotrope heads the tree carries.
// Framework-free so the mapping from progression to what the tree shows stays testable.

/** Light earned this Season at which the flower reaches each stage (§6 phases fall on 3 and 5). */
export const FLOWER_STAGE_THRESHOLDS = [0, 100, 2_000, 1e4, 1e6, 1e7, 1e9] as const;

export type FlowerStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * The tree blooms with the Light earned in the current Season: bare buds, then buds on its
 * twigs, its first flowers, full heads, more and more of them, then the solar heliotrope. A new
 * Season starts it again from bare buds.
 */
export function flowerStage(seasonLight: number): FlowerStage {
  let stage = 0;
  for (let i = 1; i < FLOWER_STAGE_THRESHOLDS.length; i++) {
    if (seasonLight >= FLOWER_STAGE_THRESHOLDS[i]!) stage = i;
  }
  return stage as FlowerStage;
}

/** A flower head: a dome of florets, the inner ones open, the outer ones still in bud. */
export interface Head {
  x: number;
  y: number;
  radius: number;
  florets: number;
  /** Fraction of the florets that are open, from the centre outwards. */
  open: number;
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

/** Seasons completed are counted by golden seeds at the foot of the tree, up to this many. */
export const MAX_POT_BANDS = 6;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
