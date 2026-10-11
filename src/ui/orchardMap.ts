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
