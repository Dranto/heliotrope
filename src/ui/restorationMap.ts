// Where restored parcels and neighbourhood projects sit on the top-down map (docs/game-design.md
// §6.1, §6.2). Pure data in world coordinates, next to the plan in neighbourhood.ts.
import type { ParcelId } from '../game/parcels';
import type { ProjectId } from '../game/projects';
import { BUILDINGS, STREETS, WORLD, type Box } from './neighbourhood';

const [NORTH, SOUTH] = STREETS.horizontal;
const [WEST, EAST] = STREETS.vertical;
const W = STREETS.width;

/** The place each parcel restores. Living roofs cover every grey roof, see LIVING_ROOFS. */
export const PARCEL_PLACES: Record<ParcelId, Box> = {
  // The avenue in front of the home block, then the one behind it.
  gardenStreet: [WEST + W, NORTH, EAST - WEST - W, W],
  rainGardens: [WEST + W, SOUTH, EAST - WEST - W, W],
  // The two streets that cross the whole city.
  pollinatorStrip: [WEST, 0, W, WORLD.height],
  river: [EAST, 0, W, WORLD.height],
  // The east car park, and the low warehouse of the south-west block.
  park: [498, 180, 94, 112],
  orchard: [8, 408, 180, 34],
  livingRoofs: [0, 0, WORLD.width, WORLD.height],
  squares: [WEST, NORTH, EAST - WEST + W, SOUTH - NORTH + W],
};

/** Roofs greened by the living roofs parcel. Gardens and farms later grow on top of them. */
export const LIVING_ROOFS: Box[] = BUILDINGS.map(({ box }) => box);

/** The four crossroads around the home block, planted by the squares parcel. */
export const CROSSROADS: [number, number][] = [NORTH, SOUTH].flatMap((y) =>
  [WEST, EAST].map((x): [number, number] => [x + W / 2, y + W / 2]),
);

/** Where the pin of an offered parcel stands: the part of its place nearest home. */
export const PARCEL_PINS: Record<ParcelId, [number, number]> = {
  gardenStreet: [311, NORTH + W / 2],
  rainGardens: [311, SOUTH + W / 2],
  pollinatorStrip: [WEST + W / 2, 236],
  river: [EAST + W / 2, 236],
  park: [545, 236],
  orchard: [98, 425],
  livingRoofs: [263, 195],
  squares: [EAST + W / 2, NORTH + W / 2],
};

/** Outer avenue segments, beyond the two crossing streets: projects use them. */
export const OUTER_AVENUES: Record<'northWest' | 'northEast' | 'southWest' | 'southEast', Box> = {
  northWest: [0, NORTH, WEST, W],
  northEast: [EAST + W, NORTH, WORLD.width - EAST - W, W],
  southWest: [0, SOUTH, WEST, W],
  southEast: [EAST + W, SOUTH, WORLD.width - EAST - W, W],
};

/** Centre of each project's mark, used for its entrance ring. */
export const PROJECT_SPOTS: Record<ProjectId, [number, number]> = {
  seedSwap: [284, 236],
  toolLibrary: [338, 236],
  compost: [267, 236],
  sharedBatteries: [347, 201],
  beehives: [355, 236],
  festival: [311, 216],
  bikeLanes: [98, NORTH + W / 2],
  market: [513, NORTH + W / 2],
  repairCafe: [455, SOUTH + W / 2],
  rainwater: [462, 236],
  butterflyGarden: [WEST + W / 2, 100],
  solarCanopy: [98, SOUTH + W / 2],
  tram: [60, NORTH + W / 2],
  assembly: [311, 236],
  lightFestival: [311, 236],
};
