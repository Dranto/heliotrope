// Where the orchard and its hives stand on the map (docs/game-design.md §9.8, M22): a grey block
// of the outskirts south-west of the city, and the encoding of their stages that keeps the map
// from redrawing at every tick. Pure data and helpers.
import {
  FRUIT_IDS,
  treeStage,
  type FruitId,
  type OrchardState,
  type TreeStage,
} from '../game/orchard';
import type { Box } from './neighbourhood';

/** The orchard's block, in world coordinates (182 × 124). */
export const ORCHARD_PLACE: Box = [12, 474, 182, 124];

const [X, Y, W] = ORCHARD_PLACE;

/** Where each tree stands: a row across the block. */
export const TREE_SPOTS: Record<FruitId, [number, number]> = Object.fromEntries(
  FRUIT_IDS.map((id, i) => [id, [X + 26 + i * ((W - 52) / 3), Y + 48]]),
) as Record<FruitId, [number, number]>;

/** Where the hives stand, along the bottom of the block. */
export const HIVE_SPOTS: [number, number][] = [
  [X + 60, Y + 100],
  [X + 122, Y + 100],
];

const [PLACE_X, PLACE_Y, PLACE_W, PLACE_H] = ORCHARD_PLACE;
const TREE_ROW_Y = Object.values(TREE_SPOTS)[0]?.[1] ?? PLACE_Y;
const HIVE_ROW_Y = HIVE_SPOTS[0]?.[1] ?? PLACE_Y + PLACE_H;

/** The grass mown short along the row of trees and the row of hives. */
const MOWN_START = PLACE_X + 20;
const MOWN_END = PLACE_X + PLACE_W - 20;
export const MOWN_PATHS = `M${MOWN_START} ${TREE_ROW_Y}H${MOWN_END}M${MOWN_START} ${HIVE_ROW_Y + 2}H${MOWN_END}`;

/** Half the width of each mown path, where the meadow grass stops. */
export const MOWN_HALF_WIDTH = 11;

/**
 * The unmown meadow between the paths: grass tufts on a jittered grid, with a white clover,
 * a buttercup or a lilac self-heal at some of them. Fixed, so the orchard looks the same each
 * visit.
 */
export const MEADOW = (() => {
  const tufts: string[] = [];
  const flowers: [number, number, number][] = [];
  let i = 0;
  for (let gy = PLACE_Y + 9; gy < PLACE_Y + PLACE_H - 5; gy += 9) {
    for (let gx = PLACE_X + 9; gx < PLACE_X + PLACE_W - 6; gx += 11) {
      i += 1;
      const jx = gx + ((i * 37) % 9) - 4 + (gy % 2 ? 5 : 0);
      const jy = gy + ((i * 53) % 7) - 3;
      if (jx < PLACE_X + 9 || jx > PLACE_X + PLACE_W - 9) continue;
      const nearRow = (row: number) => Math.abs(jy - row) < MOWN_HALF_WIDTH;
      if (nearRow(TREE_ROW_Y) || nearRow(HIVE_ROW_Y + 2)) continue;
      tufts.push(`M${jx - 1.3} ${jy}l-.5 -2.3M${jx} ${jy}v-2.9M${jx + 1.3} ${jy}l.5 -2.3`);
      if (i % 3 === 0) flowers.push([jx + 1.8, jy - 2.6, i % 9 === 0 ? 2 : i % 2]);
    }
  }
  return { tufts: tufts.join(''), flowers };
})();

export interface OrchardDraw {
  trees: Record<FruitId, TreeStage>;
  hives: number;
}

export function encodeOrchard(orchard: OrchardState): string {
  return `${FRUIT_IDS.map((id) => treeStage(orchard.trees[id])).join(',')};${orchard.hives}`;
}

export function parseOrchard(encoded: string): OrchardDraw {
  const [stages = '', hives = '0'] = encoded.split(';');
  const list = stages.split(',');
  return {
    trees: Object.fromEntries(
      FRUIT_IDS.map((id, i) => [id, (list[i] as TreeStage | undefined) ?? 'none']),
    ) as Record<FruitId, TreeStage>,
    hives: Number(hives) || 0,
  };
}
