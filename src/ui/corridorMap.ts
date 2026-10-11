// Where the green and blue corridors run on the map (docs/game-design.md §6.7, M21): a line
// along each parcel of a corridor, and a short link where two neighbouring parcels do not touch.
// Pure data in world coordinates.
import type { CorridorFamily } from '../game/corridors';
import type { ParcelId } from '../game/parcels';
import { STREETS, WORLD } from './neighbourhood';
import { CROSSROADS, PARCEL_PLACES } from './restorationMap';

const [NORTH, SOUTH] = STREETS.horizontal;
const [WEST, EAST] = STREETS.vertical;
const W = STREETS.width;
/** How far the corridor runs inside the edge of its street. */
const EDGE = 3;

function outline([x, y, w, h]: readonly number[]): string {
  return `M${x! + EDGE} ${y! + EDGE}h${w! - 2 * EDGE}v${h! - 2 * EDGE}h${-(w! - 2 * EDGE)}Z`;
}

/** The path of the corridor along each parcel that can join one. */
export const SPINES: Record<ParcelId, string> = {
  gardenStreet: `M${WEST + W} ${NORTH + EDGE}H${EAST}`,
  rainGardens: `M${WEST + W} ${SOUTH + W - EDGE}H${EAST}`,
  pollinatorStrip: `M${WEST + EDGE} 0V${WORLD.height}`,
  river: `M${EAST + W - EDGE} 0V${WORLD.height}`,
  park: outline(PARCEL_PLACES.park),
  orchard: outline(PARCEL_PLACES.orchard),
  squares: CROSSROADS.map(([x, y]) => `M${x - 7} ${y}a7 7 0 1 0 14 0a7 7 0 1 0 -14 0`).join(''),
  livingRoofs: '',
};

/** Links between neighbours that do not touch on the map, keyed `a+b`. */
export const BRIDGES: Partial<Record<string, string>> = {
  'pollinatorStrip+orchard': `M${WEST + EDGE} 425H${8 + 180 - EDGE}`,
  'river+park': `M${EAST + W - EDGE} 236H${498 + EDGE}`,
};

export interface CorridorDraw {
  family: CorridorFamily;
  parcels: ParcelId[];
  links: string[];
}

/** One string per corridor (`green:a+b:a+b|…`) so the layer redraws only on a change. */
export function encodeCorridors(
  list: readonly { family: CorridorFamily; parcels: ParcelId[]; links: [ParcelId, ParcelId][] }[],
): string {
  return list
    .map((c) => `${c.family}:${c.parcels.join('+')}:${c.links.map((l) => l.join('+')).join(',')}`)
    .join('|');
}

export function parseCorridors(encoded: string): CorridorDraw[] {
  if (!encoded) return [];
  return encoded.split('|').map((part) => {
    const [family, parcels, links] = part.split(':');
    return {
      family: family as CorridorFamily,
      parcels: (parcels ?? '').split('+') as ParcelId[],
      links: (links ?? '').split(',').filter(Boolean),
    };
  });
}
