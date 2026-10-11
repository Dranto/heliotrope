// The green and blue corridors (docs/game-design.md §6.7, M21): restored parcels next to each
// other on the map whose chosen futures (§6.5) belong to the same family join into a corridor.
// A corridor adds a modest bonus that grows with its length and, from three parcels, brings back
// a species that only comes through it. Nothing is stored: corridors follow the parcels and their
// futures, so rearranging the futures each Cycle of water rearranges them too.
import type { Bonus } from './bonuses';
import type { Future, ParcelId } from './parcels';

export const CORRIDOR_FAMILIES = ['green', 'blue'] as const;
export type CorridorFamily = (typeof CORRIDOR_FAMILIES)[number];

/**
 * The family of each future of each parcel: green for planted ground (streets, strips, parks,
 * orchards), blue for water. The play street, the covered market, the glasshouses and the roofs
 * (which do not touch the ground) join no corridor.
 */
export const FAMILIES: Record<ParcelId, readonly [CorridorFamily | null, CorridorFamily | null]> = {
  gardenStreet: ['green', null],
  rainGardens: ['blue', 'blue'],
  pollinatorStrip: ['green', 'green'],
  river: ['blue', 'blue'],
  park: ['green', null],
  orchard: ['green', null],
  livingRoofs: [null, null],
  squares: ['green', 'blue'],
};

/**
 * Parcels that touch on the map: the two avenues meet the two crossing streets and the squares
 * at their crossroads; the orchard's warehouse lies along the west street, the car park park
 * faces the river street.
 */
export const NEIGHBOURS: readonly (readonly [ParcelId, ParcelId])[] = [
  ['gardenStreet', 'pollinatorStrip'],
  ['gardenStreet', 'river'],
  ['gardenStreet', 'squares'],
  ['rainGardens', 'pollinatorStrip'],
  ['rainGardens', 'river'],
  ['rainGardens', 'squares'],
  ['pollinatorStrip', 'squares'],
  ['river', 'squares'],
  ['pollinatorStrip', 'orchard'],
  ['river', 'park'],
];

/** A corridor needs at least this many parcels; its species comes from SPECIES_LENGTH. */
export const MIN_LENGTH = 2;
export const SPECIES_LENGTH = 3;

/** What each parcel of a corridor adds: production for green, Water for blue. */
export const GREEN_PER_PARCEL = 0.02;
export const BLUE_PER_PARCEL = 0.05;

export interface Corridor {
  family: CorridorFamily;
  /** Its parcels, in the order of PARCEL_IDS. */
  parcels: ParcelId[];
  /** Its links, each a pair of neighbouring parcels of the corridor. */
  links: [ParcelId, ParcelId][];
}

export interface CorridorSource {
  parcels: readonly ParcelId[];
  futures?: { chosen: Readonly<Partial<Record<ParcelId, Future>>> };
}

/** The family a restored parcel brings with its chosen future; null if none or not restored. */
export function familyOf(source: CorridorSource, id: ParcelId): CorridorFamily | null {
  if (!source.parcels.includes(id)) return null;
  return FAMILIES[id][source.futures?.chosen[id] ?? 0];
}

/** Every corridor on the map: groups of neighbouring parcels of one family, MIN_LENGTH or more. */
export function corridors(source: CorridorSource): Corridor[] {
  const links = NEIGHBOURS.filter(([a, b]) => {
    const family = familyOf(source, a);
    return family !== null && family === familyOf(source, b);
  });
  const seen = new Set<ParcelId>();
  const found: Corridor[] = [];
  for (const start of source.parcels) {
    const family = familyOf(source, start);
    if (family === null || seen.has(start)) continue;
    const group = new Set<ParcelId>([start]);
    const queue = [start];
    while (queue.length > 0) {
      const id = queue.pop()!;
      for (const [a, b] of links) {
        const other = a === id ? b : b === id ? a : null;
        if (other && !group.has(other)) {
          group.add(other);
          queue.push(other);
        }
      }
    }
    group.forEach((id) => seen.add(id));
    if (group.size < MIN_LENGTH) continue;
    found.push({
      family,
      parcels: Object.keys(FAMILIES).filter((id) => group.has(id as ParcelId)) as ParcelId[],
      links: links.filter(([a]) => group.has(a)).map(([a, b]) => [a, b]),
    });
  }
  return found;
}

/** The longest corridor of a family, 0 with none. */
export function longestCorridor(source: CorridorSource, family: CorridorFamily): number {
  return corridors(source)
    .filter((c) => c.family === family)
    .reduce((longest, c) => Math.max(longest, c.parcels.length), 0);
}

/** The bonus of one corridor: it grows with its length. */
export function corridorBonus(family: CorridorFamily, length: number): Bonus {
  return family === 'green'
    ? { kind: 'global', bonus: GREEN_PER_PARCEL * length }
    : { kind: 'water', factor: 1 + BLUE_PER_PARCEL * length };
}

/** Bonuses of every corridor on the map. */
export function corridorBonuses(source: CorridorSource): Bonus[] {
  return corridors(source).map((c) => corridorBonus(c.family, c.parcels.length));
}
