// Layout of the Tree of Seasons drawing (docs/game-design.md §7.1, §10.4): where each talent sits
// and how branches join it. Pure data and helpers, so the drawing stays testable.
import { TALENT_LIST, TALENTS, type TalentBranch, type TalentId } from '../game/talents';

/** The drawing's coordinate space. */
export const TREE_VIEW = { width: 360, height: 330 } as const;

/** Soil line: the canopy grows above it, the roots below. */
export const GROUND_Y = 206;

/** Where each branch leaves the trunk. */
export const BRANCH_ORIGINS: Record<TalentBranch, [number, number]> = {
  roots: [180, 214],
  pollinators: [172, 140],
  memory: [188, 140],
};

/** Position of each talent: roots fan out under the soil, the two branches share the canopy. */
export const TALENT_SPOTS: Record<TalentId, [number, number]> = {
  mycorrhiza: [180, 246],
  earlyDiversity: [118, 274],
  cuttings: [242, 274],
  motherForest: [70, 306],
  livingSoil: [290, 306],
  nectarFlowers: [134, 124],
  hedgerows: [96, 94],
  longBloom: [52, 74],
  greatSwarm: [116, 50],
  beeDance: [36, 32],
  gardenersCoop: [226, 124],
  nightWatch: [276, 108],
  roofersCoop: [214, 80],
  farmersCoop: [250, 46],
  neighbourhoodCouncil: [178, 40],
  forestersCoop: [300, 22],
  longMemory: [326, 76],
};

/** A gently curved branch (or root) from `from` to `to`. */
export function branchPath([x1, y1]: [number, number], [x2, y2]: [number, number]): string {
  const bend = (x2 - x1) * 0.15;
  const mx = (x1 + x2) / 2 - bend * 0.3;
  const my = (y1 + y2) / 2 + Math.abs(bend);
  return `M${x1} ${y1} Q${round(mx)} ${round(my)} ${x2} ${y2}`;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** The branch leading to a talent: from its parent, or from the trunk for a branch's first one. */
export function talentBranch(id: TalentId): string {
  const { parent, branch } = TALENTS[id];
  const from = parent ? TALENT_SPOTS[parent] : BRANCH_ORIGINS[branch];
  return branchPath(from, TALENT_SPOTS[id]);
}

/** How much the tree has grown, from 0 (bare sapling) to 1 (every talent learnt). */
export function treeGrowth(learnt: readonly TalentId[]): number {
  return learnt.length / TALENT_LIST.length;
}

/** Leaves of the Canopy (§7.1): one per level sown, along an arc above the crown. */
export const CANOPY_LEAVES = 36;

/** Where the first `levels` leaves of the Canopy sit: x, y and angle, from the middle outwards. */
export function canopyLeafSpots(levels: number): [number, number, number][] {
  const spots: [number, number, number][] = [];
  for (let i = 0; i < Math.min(levels, CANOPY_LEAVES); i++) {
    // Alternate sides from the centre: 0, +1, -1, +2, -2...
    const step = Math.ceil(i / 2) * (i % 2 === 0 ? -1 : 1);
    const t = step / (CANOPY_LEAVES / 2);
    const x = 180 + t * 150;
    const y = 10 + t * t * 34 + (i % 3) * 3;
    spots.push([round(x), round(y), round(t * 40 + (i % 2 === 0 ? -18 : 18))]);
  }
  return spots;
}
