// Rounds of the Cooperatives' cargo bikes on the top-down map (docs/game-design.md §7.2). Pure
// data in world coordinates, next to the plan in neighbourhood.ts: every route follows the
// streets, keeping to its lane.
import type { CooperativeId } from '../game/cooperatives';
import { STREETS } from './neighbourhood';

const [NORTH, SOUTH] = STREETS.horizontal;
const [WEST, EAST] = STREETS.vertical;
const MID = STREETS.width / 2;

export interface CooperativeRoute {
  /** SVG path the bike rides along, closed. */
  path: string;
  /** Seconds for one round. */
  seconds: number;
  /** Seconds into the round at load, so the bikes do not ride together. */
  delay: number;
  /** Where a paused bike waits: x, y and heading in degrees. */
  park: [number, number, number];
}

export const COOPERATIVE_ROUTES: Record<CooperativeId, CooperativeRoute> = {
  // Around the home block, on the inner lane.
  gardeners: {
    path: `M${WEST + MID + 5} ${NORTH + MID + 5} H${EAST + MID - 5} V${SOUTH + MID - 5} H${WEST + MID + 5} Z`,
    seconds: 40,
    delay: 0,
    park: [WEST + MID + 30, NORTH + MID + 5, 0],
  },
  // The whole north avenue, there and back.
  roofers: {
    path: `M-12 ${NORTH + MID - 4} H612 V${NORTH + MID + 4} H-12 Z`,
    seconds: 50,
    delay: 12,
    park: [EAST - 30, NORTH + MID - 4, 0],
  },
  // The whole south avenue, there and back.
  farmers: {
    path: `M612 ${SOUTH + MID + 4} H-12 V${SOUTH + MID - 4} H612 Z`,
    seconds: 55,
    delay: 30,
    park: [WEST + 60, SOUTH + MID + 4, 180],
  },
  // The west street, across the whole city.
  foresters: {
    path: `M${WEST + MID - 4} 462 V-12 H${WEST + MID + 4} V462 Z`,
    seconds: 46,
    delay: 8,
    park: [WEST + MID - 4, SOUTH - 30, 270],
  },
  // Around the home block the other way, on the outer lane.
  council: {
    path: `M${WEST + MID - 5} ${NORTH + MID - 5} V${SOUTH + MID + 5} H${EAST + MID + 5} V${NORTH + MID - 5} Z`,
    seconds: 60,
    delay: 20,
    park: [EAST + MID + 5, NORTH + MID + 30, 90],
  },
  // The east street, across the whole city, towards the river.
  fountaineers: {
    path: `M${EAST + MID + 4} -12 V462 H${EAST + MID - 4} V-12 Z`,
    seconds: 52,
    delay: 26,
    park: [EAST + MID + 4, SOUTH - 30, 90],
  },
  // M36: the street south of the home block and its courtyard garden, there and back.
  growers: {
    path: `M${WEST + MID + 10} ${SOUTH + MID - 1} H${EAST + MID - 10} V${SOUTH + MID + 1} H${WEST + MID + 10} Z`,
    seconds: 34,
    delay: 6,
    park: [WEST + MID + 40, SOUTH + MID - 1, 0],
  },
  // M36: the north avenue from the east street to the west edge, there and back, with the honey.
  beekeepers: {
    path: `M${EAST + MID} ${NORTH + MID + 1} H-12 V${NORTH + MID - 1} H${EAST + MID} Z`,
    seconds: 48,
    delay: 18,
    park: [WEST - 40, NORTH + MID + 1, 180],
  },
};
