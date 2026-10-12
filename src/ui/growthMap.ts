// Where the buildings that grow (docs/game-design.md §5.5, M26) wear their forms on the map, and
// the compact string the map layer redraws on.
import { GENERATOR_IDS, type GeneratorId } from '../game/generators';
import {
  ARCOLOGY_SITE,
  centre,
  FARM_SITES,
  GARDEN_ROOFS,
  GREENHOUSE_SITES,
  MIRROR_TOWER,
  TREES,
} from './neighbourhood';

/** Where each building wears its forms: its first one or two places on the map. */
export const GROWTH_ANCHORS: Record<GeneratorId, [number, number][]> = {
  pot: [
    [266, 220],
    [356, 252],
  ],
  balconyPanel: [
    [335, 186],
    [335, 278],
  ],
  rooftopGarden: [centre(GARDEN_ROOFS[0]!), centre(GARDEN_ROOFS[4]!)],
  greenhouse: [centre(GREENHOUSE_SITES[0]!), centre(GREENHOUSE_SITES[1]!)],
  verticalFarm: [centre(FARM_SITES[0]!.box), centre(FARM_SITES[1]!.box)],
  mirrorPlant: [[MIRROR_TOWER.x, MIRROR_TOWER.y]],
  urbanCanopy: TREES.slice(0, 2).map((tree): [number, number] => [tree.x, tree.y]),
  arcology: [centre(ARCOLOGY_SITE)],
};

/** One letter per tier reached: "a" or "b" for the path picked, "-" for none yet. */
export function encodeGrowth(
  reached: Record<GeneratorId, number>,
  paths: Record<GeneratorId, readonly (0 | 1 | null)[]>,
): string {
  return GENERATOR_IDS.map((id) => {
    const marks = paths[id]
      .slice(0, reached[id])
      .map((p) => (p === null ? '-' : p === 0 ? 'a' : 'b'))
      .join('');
    return `${id}:${marks}`;
  }).join(',');
}
