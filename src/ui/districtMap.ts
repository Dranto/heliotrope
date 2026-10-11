// Where the neighbouring districts lie (docs/game-design.md §6.4): one grey block of the
// outskirts each, on the city's street grid, all around the ring road. Pure data in world
// coordinates, next to the city plan in neighbourhood.ts.
import type { DistrictId } from '../game/districts';
import { VIEW_FRAMES, type Box } from './neighbourhood';

/** Size of a block of the outskirts between its streets (the outskirts tile, §6). */
const BLOCK = { width: 182, height: 124 };
/** Left and top edges of the blocks beyond the ring road, west to east and north to south. */
const WEST = -196;
const MIDDLE_X = 220;
const EAST = 636;
const NORTH = -126;
const MIDDLE_Y = 174;
const SOUTH = 474;

function block(x: number, y: number): Box {
  return [x, y, BLOCK.width, BLOCK.height];
}

export const DISTRICT_PLACES: Record<DistrictId, Box> = {
  tanneries: block(EAST, MIDDLE_Y),
  railyard: block(MIDDLE_X, NORTH),
  mall: block(MIDDLE_X, SOUTH),
  parkAndRide: block(WEST, MIDDLE_Y),
  interchange: block(EAST, NORTH),
  offices: block(WEST, SOUTH),
  industrialZone: block(EAST, SOUTH),
  chimneys: block(WEST, NORTH),
};

/** Room kept around the districts when the City view grows to show them. */
const MARGIN = 10;

/**
 * Frame of the City view (§6): the whole city, grown to take in every district restored so far,
 * so the view widens as the outskirts turn green.
 */
export function cityFrame(districts: readonly DistrictId[]): Box {
  const [fx, fy, fw, fh] = VIEW_FRAMES[3];
  let [x0, y0] = [fx, fy];
  let x1 = fx + fw;
  let y1 = fy + fh;
  for (const id of districts) {
    const [x, y, bw, bh] = DISTRICT_PLACES[id];
    x0 = Math.min(x0, x - MARGIN);
    y0 = Math.min(y0, y - MARGIN);
    x1 = Math.max(x1, x + bw + MARGIN);
    y1 = Math.max(y1, y + bh + MARGIN);
  }
  return [x0, y0, x1 - x0, y1 - y0];
}
